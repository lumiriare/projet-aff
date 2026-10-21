import { describe, expect, it } from 'vitest'
import type { Evenement, Programme } from '../types'
import { conflitEntre, conflitsAvec } from './conflits'
import { DUREE_PAR_DEFAUT_MIN, MARGE_MIN, TRAJET_ENTRE_LIEUX_MIN, TRAJET_UNIVERSITE_MIN, UNIVERSITE } from './regles'
import { aplatir, lireMinutes } from './seances'

const CASINO = "Casino d'Arras"
const MEGARAMA = 'Megarama Arras'

function horaire(minutes: number, jour = '2026-11-08') {
    return `${jour}T${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
}

//Un film minimal, avec ses séances [début, lieu]
function evenement(id: string, duree: number | null, seances: [string, string | null][]): Evenement {
    return {
        id, titre: id.toUpperCase(), section: 's', type: 'film', lien_officiel: '', affiche: null,
        realisation: [], pays: [], annee: null, duree_min: duree, version: null, seances_brutes: [],
        seances: seances.map(([debut, lieu]) => ({ debut, lieu, presence: null, statut: 'ok' as const })),
    }
}

function seancesDe(...evenements: Evenement[]) {
    const programme: Programme = { sections: [], evenements }
    return aplatir(programme)
}

const NEUF_HEURES = 9 * 60
const FIN = NEUF_HEURES + 82 // un film de 1h22 qui commence à 9h00 finit à 10h22

// Une première séance à 9h00 (1h22, au Casino) et une seconde qui commence à "debut"
function paire(debut: number, lieu: string | null, jour = '2026-11-08') {
    return seancesDe(
        evenement('a', 82, [[horaire(NEUF_HEURES), CASINO]]),
        evenement('b', 90, [[horaire(debut, jour), lieu]]),
    )
}

describe('conflitEntre', () => {
    it('signale un chevauchement, dans les deux sens', () => {
        const [a, b] = paire(10 * 60, CASINO)
        expect(conflitEntre(a, b)).toBe('chevauche')
        expect(conflitEntre(b, a)).toBe('chevauche')
    })

    it('exige la marge de sécurité dans le même lieu', () => {
        const [a, juste] = paire(FIN + MARGE_MIN - 1, CASINO)
        expect(conflitEntre(a, juste)).toBe('trop_juste')
        const [c, ok] = paire(FIN + MARGE_MIN, CASINO)
        expect(conflitEntre(c, ok)).toBeNull()
    })

    it('ajoute le trajet quand les lieux diffèrent', () => {
        const limite = FIN + MARGE_MIN + TRAJET_ENTRE_LIEUX_MIN
        const [a, juste] = paire(limite - 1, MEGARAMA)
        expect(conflitEntre(a, juste)).toBe('trop_juste')
        const [c, ok] = paire(limite, MEGARAMA)
        expect(conflitEntre(c, ok)).toBeNull()
    })

    it("compte un trajet plus long depuis et vers l'Université d'Artois", () => {
        const limite = FIN + MARGE_MIN + TRAJET_UNIVERSITE_MIN
        const [a, juste] = paire(limite - 1, UNIVERSITE)
        expect(conflitEntre(a, juste)).toBe('trop_juste')
        const [c, ok] = paire(limite, UNIVERSITE)
        expect(conflitEntre(c, ok)).toBeNull()

        // dans l'autre sens : séance à l'Université à 9h00, puis une séance au Casino
        const [u, casino] = seancesDe(
            evenement('u', 82, [[horaire(NEUF_HEURES), UNIVERSITE]]),
            evenement('c', 90, [[horaire(limite - 1), CASINO]]),
        )
        expect(conflitEntre(u, casino)).toBe('trop_juste')
    })

    it("ne compte aucun trajet entre deux séances de l'Université", () => {
        const [u1, u2] = seancesDe(
            evenement('u1', 82, [[horaire(NEUF_HEURES), UNIVERSITE]]),
            evenement('u2', 90, [[horaire(FIN + MARGE_MIN), UNIVERSITE]]),
        )
        expect(conflitEntre(u1, u2)).toBeNull()
    })

    it('suppose un trajet quand le lieu est inconnu', () => {
        const [a, b] = paire(FIN + MARGE_MIN + TRAJET_ENTRE_LIEUX_MIN - 1, null)
        expect(conflitEntre(a, b)).toBe('trop_juste')
    })

    it("ne dit rien pour des jours différents ou une heure non publiée", () => {
        const [a, autreJour] = paire(NEUF_HEURES, CASINO, '2026-11-09')
        expect(conflitEntre(a, autreJour)).toBeNull()

        const [c, sansHeure] = seancesDe(
            evenement('a', 120, [[horaire(NEUF_HEURES), CASINO]]),
            evenement('b', 120, [['2026-11-08', CASINO]]),
        )
        expect(conflitEntre(c, sansHeure)).toBeNull()
    })
})

describe('conflitsAvec', () => {
    it('ignore la séance elle-même', () => {
        const [a, b] = paire(10 * 60, CASINO)
        expect(conflitsAvec(a, [a, b])).toHaveLength(1)
    })
})

describe('séances à plat', () => {
    it("lit l'heure en minutes, ou null quand elle n'est pas publiée", () => {
        expect(lireMinutes('2026-11-08T13:30')).toBe(810)
        expect(lireMinutes('2026-11-08')).toBeNull()
    })

    it('trie par jour puis par heure', () => {
        const toutes = seancesDe(
            evenement('b', 90, [['2026-11-09T09:00', CASINO], ['2026-11-08T14:00', CASINO]]),
            evenement('a', 90, [['2026-11-08T09:00', MEGARAMA]]),
        )
        expect(toutes.map((s) => s.id)).toEqual(['a|2026-11-08T09:00', 'b|2026-11-08T14:00', 'b|2026-11-09T09:00'])
    })

    it('préfère la durée de la séance (plage horaire) à celle du film', () => {
        const film = evenement('a', 82, [[horaire(NEUF_HEURES), CASINO]])
        film.seances[0].duree_min = 30
        const [court] = seancesDe(film)
        expect(court.finMin).toBe(NEUF_HEURES + 30)
        expect(court.dureeEstimee).toBe(false)
    })

    it('calcule la fin avec la durée du film, ou une durée par défaut marquée estimée', () => {
        const [connue] = seancesDe(evenement('a', 82, [['2026-11-08T09:00', CASINO]]))
        expect(connue.finMin).toBe(9 * 60 + 82)
        expect(connue.dureeEstimee).toBe(false)

        const [inconnue] = seancesDe(evenement('a', null, [['2026-11-08T09:00', CASINO]]))
        expect(inconnue.finMin).toBe(9 * 60 + DUREE_PAR_DEFAUT_MIN)
        expect(inconnue.dureeEstimee).toBe(true)
    })
})
