import { describe, expect, it } from 'vitest'
import { aDesDispo, basculerMoment, estLibre } from './dispo'
import type { SeanceFestival } from './seances'

// une séance minimale : jour, heure de début et de fin en minutes 
function seance(jour: string, debutMin: number | null, finMin: number | null): SeanceFestival {
    return { id: 'x', jour, debutMin, finMin } as SeanceFestival
}

const JOUR = '2026-11-08'

describe('estLibre', () => {
    it("refuse tout quand aucun moment n'est choisi ce jour-là", () => {
        expect(estLibre(seance(JOUR, 14 * 60, 16 * 60), {})).toBe(false)
        expect(estLibre(seance(JOUR, 14 * 60, 16 * 60), { '2026-11-09': ['apres-midi'] })).toBe(false)
    })

    it("accepte une séance qui tient entièrement dans le moment choisi", () => {
        expect(estLibre(seance(JOUR, 14 * 60, 16 * 60), { [JOUR]: ['apres-midi'] })).toBe(true)
    })

    it('refuse une séance qui déborde du moment choisi', () => {
        // 11h00 – 13h00 : commence le matin, finit l'après-midi
        expect(estLibre(seance(JOUR, 11 * 60, 13 * 60), { [JOUR]: ['matin'] })).toBe(false)
        expect(estLibre(seance(JOUR, 11 * 60, 13 * 60), { [JOUR]: ['apres-midi'] })).toBe(false)
    })

    it('réunit les moments qui se suivent', () => {
        expect(estLibre(seance(JOUR, 11 * 60, 13 * 60), { [JOUR]: ['matin', 'apres-midi'] })).toBe(true)
        // matin + soir ne se touchent pas : une séance de l'après-midi n'y tient pas
        expect(estLibre(seance(JOUR, 14 * 60, 16 * 60), { [JOUR]: ['matin', 'soir'] })).toBe(false)
    })

    it('garde une séance du soir qui finit après minuit', () => {
        expect(estLibre(seance(JOUR, 22 * 60, 24 * 60 + 30), { [JOUR]: ['soir'] })).toBe(true)
    })

    it("propose une séance dont l'heure n'est pas publiée si la personne est libre ce jour-là", () => {
        expect(estLibre(seance(JOUR, null, null), { [JOUR]: ['soir'] })).toBe(true)
        expect(estLibre(seance(JOUR, null, null), {})).toBe(false)
    })
})

describe('basculerMoment', () => {
    it('ajoute puis retire un moment, sans toucher aux autres jours', () => {
        const avec = basculerMoment({ '2026-11-09': ['soir'] }, JOUR, 'matin')
        expect(avec).toEqual({ '2026-11-09': ['soir'], [JOUR]: ['matin'] })
        expect(basculerMoment(avec, JOUR, 'matin')).toEqual({ '2026-11-09': ['soir'] })
    })

    it('sait si des disponibilités sont choisies', () => {
        expect(aDesDispo({})).toBe(false)
        expect(aDesDispo({ [JOUR]: ['soir'] })).toBe(true)
    })
})
