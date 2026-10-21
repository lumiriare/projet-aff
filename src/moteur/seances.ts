import type { Evenement, Programme, Seance } from '../types'
import { DUREE_PAR_DEFAUT_MIN } from './regles'

//Une séance, avec son film et ses horaires calculés (minutes depuis minuit)
export interface SeanceFestival {
    id: string
    evenement: Evenement
    seance: Seance
    jour: string 
    debutMin: number | null // null si l'heure n'est pas publiée
    finMin: number | null // début + durée du film
    dureeEstimee: boolean // la fiche ne donne pas de durée
}

export function identifiantSeance(evenement: Evenement, seance: Seance): string {
    return `${evenement.id}|${seance.debut}`
}

export function lireMinutes(debut: string): number | null {
    if (debut.length <= 10) {return null}
    return Number(debut.slice(11, 13)) * 60 + Number(debut.slice(14, 16))
}

function comparer(a: SeanceFestival, b: SeanceFestival): number {
    return (
        a.jour.localeCompare(b.jour) ||
        (a.debutMin ?? -1) - (b.debutMin ?? -1) ||
        a.evenement.titre.localeCompare(b.evenement.titre, 'fr')
    )
}

// Toutes les séances du programme triées par jour puis par heure
export function aplatir(programme: Programme): SeanceFestival[] {
    const resultat: SeanceFestival[] = []
    for (const evenement of programme.evenements) {
        for (const seance of evenement.seances) {
            const debutMin = lireMinutes(seance.debut)
            // La durée de la séance (plage horaire de la fiche) prime sur celle du film
            const duree = seance.duree_min ?? evenement.duree_min ?? DUREE_PAR_DEFAUT_MIN
            resultat.push({
                id: identifiantSeance(evenement, seance),
                evenement,
                seance,
                jour: seance.debut.slice(0, 10),
                debutMin,
                finMin: debutMin === null ? null : debutMin + duree,
                dureeEstimee: seance.duree_min == null && evenement.duree_min === null,
            })
        }
    }
    return resultat.sort(comparer)
}
