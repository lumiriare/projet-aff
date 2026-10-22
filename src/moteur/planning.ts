import { formaterHeure, formaterPresence, jourLong } from '../format'
import type { Evenement } from '../types'
import { conflitEntre } from './conflits'
import { aDesDispo, estLibre, type Dispo } from './dispo'
import type { SeanceFestival } from './seances'

// Planning automatique : à partir des films qu'on veut voir, choisir une séance par film
// sans conflit, en plaçant le plus de films possible, puis en limitant les jours ou les déplacements

export type Critere = 'peu_de_jours' | 'peu_de_deplacements'

export interface Plan {
    criteres: Critere[]             // critères pour lesquels ce plan est le meilleur (un même plan peut gagner les deux)
    seances: SeanceFestival[]       // séances à ajouter, triées par jour puis par heure
    sansPlace: Evenement[]          // films qu'on n'a pas pu placer
    nbJours: number                 // jours de présence, séances déjà choisies comprises
    nbDeplacements: number          // changements de lieu entre deux séances d'un même jour
}

export interface Demande {
    films: Evenement[]                                  // films à voir
    seancesParEvenement: Map<string, SeanceFestival[]>
    fixes: SeanceFestival[]                             // séances déjà choisies à la main : elles ne bougent pas
    dispos?: Dispo                                      // si des moments libres sont indiqués, on n'utilise que ceux-là
}

// Garde-fou : au-delà, on garde la meilleure solution trouvée
const LIMITE_NOEUDS = 200_000

export function mesures(seances: SeanceFestival[]): { nbJours: number; nbDeplacements: number } {
    const parJour = new Map<string, SeanceFestival[]>()
    for (const s of seances) parJour.set(s.jour, [...(parJour.get(s.jour) ?? []), s])

    let nbDeplacements = 0
    for (const duJour of parJour.values()) {
        const triees = [...duJour].sort((a, b) => (a.debutMin ?? 0) - (b.debutMin ?? 0))
        for (let i = 1; i < triees.length; i++) {
            const avant = triees[i - 1].seance.lieu
            const apres = triees[i].seance.lieu
            if (avant === null || apres === null || avant !== apres) nbDeplacements++
        }
    }
    return { nbJours: parJour.size, nbDeplacements }
}

interface Option {
    film: Evenement
    seances: SeanceFestival[] // séances utilisables pour ce film
}

// Les séances d'un film qu'on peut réellement placer
function seancesUtilisables(film: Evenement, demande: Demande): SeanceFestival[] {
    const filtrerDispos = demande.dispos !== undefined && aDesDispo(demande.dispos)
    return (demande.seancesParEvenement.get(film.id) ?? [])
        .filter((s) => s.debutMin !== null) // sans heure, on ne peut pas vérifier les conflits
        .filter((s) => !demande.fixes.some((f) => conflitEntre(s, f) !== null))
        .filter((s) => !filtrerDispos || estLibre(s, demande.dispos as Dispo))
}

interface Resultat {
    choisies: SeanceFestival[]
    placees: number
    cout: number[]
}

// Plus petit = meilleur : d'abord le plus de films placés, puis le coût selon le critère
function comparer(a: Resultat, b: Resultat): number {
    if (a.placees !== b.placees) return b.placees - a.placees
    for (let i = 0; i < a.cout.length; i++) {
        if (a.cout[i] !== b.cout[i]) return a.cout[i] - b.cout[i]
    }
    return 0
}

function optimiser(critere: Critere, options: Option[], fixes: SeanceFestival[]): Resultat {
    let meilleur: Resultat = { choisies: [], placees: 0, cout: [Infinity, Infinity] }
    let noeuds = 0

    const cout = (choisies: SeanceFestival[]) => {
        const m = mesures([...fixes, ...choisies])
        return critere === 'peu_de_jours' ? [m.nbJours, m.nbDeplacements] : [m.nbDeplacements, m.nbJours]
    }

    function explorer(i: number, choisies: SeanceFestival[]) {
        if (noeuds++ > LIMITE_NOEUDS) return
        const restants = options.length - i
        if (choisies.length + restants < meilleur.placees) return // même en plaçant tout le reste, on ne ferait pas mieux

        if (i === options.length) {
            const resultat = { choisies: [...choisies], placees: choisies.length, cout: cout(choisies) }
            if (comparer(resultat, meilleur) < 0) meilleur = resultat
            return
        }

        // Le nombre de jours ne peut qu'augmenter : inutile de continuer s'il dépasse déjà le meilleur
        if (critere === 'peu_de_jours' && choisies.length + restants <= meilleur.placees) {
            if (mesures([...fixes, ...choisies]).nbJours > meilleur.cout[0]) return
        }

        for (const seance of options[i].seances) {
            if ([...fixes, ...choisies].some((autre) => conflitEntre(seance, autre) !== null)) continue
            choisies.push(seance)
            explorer(i + 1, choisies)
            choisies.pop()
        }
        explorer(i + 1, choisies) // ou ne pas placer ce film
    }

    explorer(0, [])
    return meilleur
}

// Au plus deux plannings : le moins de jours, et le moins de déplacements (fusionnés s'ils sont identiques)
export function proposerPlannings(demande: Demande): Plan[] {
    const dejaPlanifies = new Set(demande.fixes.map((s) => s.evenement.id))
    const aPlacer = demande.films.filter((f) => !dejaPlanifies.has(f.id))

    const options: Option[] = []
    const sansOption: Evenement[] = []
    for (const film of aPlacer) {
        const seances = seancesUtilisables(film, demande)
        if (seances.length > 0) options.push({ film, seances })
        else sansOption.push(film)
    }
    // Les films qui ont le moins de choix d'abord : on écarte vite les impasses
    options.sort((a, b) => a.seances.length - b.seances.length)

    if (aPlacer.length === 0) return []

    const plans: Plan[] = []
    for (const critere of ['peu_de_jours', 'peu_de_deplacements'] as Critere[]) {
        const resultat = optimiser(critere, options, demande.fixes)
        const choisies = [...resultat.choisies].sort(
            (a, b) => a.jour.localeCompare(b.jour) || (a.debutMin ?? 0) - (b.debutMin ?? 0),
        )
        const placeesIds = new Set(choisies.map((s) => s.evenement.id))
        const identique = plans.find(
            (p) => p.seances.length === choisies.length && p.seances.every((s, i) => s.id === choisies[i].id),
        )
        if (identique) {
            identique.criteres.push(critere)
            continue
        }
        plans.push({
            criteres: [critere],
            seances: choisies,
            sansPlace: [...sansOption, ...options.map((o) => o.film).filter((f) => !placeesIds.has(f.id))],
            ...mesures([...demande.fixes, ...choisies]),
        })
    }
    return plans
}

// Le planning en texte simple, à coller dans un message ou une note (séances déjà triées par jour et heure)
export function texteDuPlanning(seances: SeanceFestival[]): string {
    if (seances.length === 0) return ''
    const lignes = ['Mon planning · Arras Film Festival, du 6 au 15 novembre 2026']
    let jourCourant = ''
    for (const s of seances) {
        if (s.jour !== jourCourant) {
            jourCourant = s.jour
            lignes.push('', jourLong(s.jour))
        }
        const heure =
            s.debutMin === null
                ? 'Heure à confirmer'
                : s.finMin !== null && !s.dureeEstimee
                  ? `${formaterHeure(s.debutMin)} – ${formaterHeure(s.finMin)}`
                  : formaterHeure(s.debutMin)
        const details = [
            s.evenement.titre,
            s.seance.lieu ?? 'Lieu à confirmer',
            s.evenement.type === 'after' ? 'entrée gratuite' : null,
            s.seance.presence ? `en présence ${formaterPresence(s.seance.presence)}` : null,
        ].filter(Boolean)
        lignes.push(`- ${heure} · ${details.join(' · ')}`)
    }
    lignes.push('', 'Horaires à vérifier auprès du festival (arrasfilmfestival.com). Planning fait avec Arras en Poche, projet non officiel.')
    return lignes.join('\n')
}
