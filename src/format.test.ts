import { describe, expect, it } from 'vitest'
import { formaterHeure, jourCourt, jourLong } from './format'

describe('jours', () => {
    it('donne le bon jour de la semaine (le 8 novembre 2026 est un dimanche)', () => {
        expect(jourCourt('2026-11-08')).toBe('dim')
        expect(jourLong('2026-11-08')).toBe('Dimanche 8 novembre')
        expect(jourLong('2026-11-09')).toBe('Lundi 9 novembre')
        expect(jourLong('2026-11-14')).toBe('Samedi 14 novembre')
    })
})

describe('formaterHeure', () => {
    it('écrit les heures et les durées, et ramène un horaire après minuit dans la journée', () => {
        expect(formaterHeure(540)).toBe('9h00')
        expect(formaterHeure(82)).toBe('1h22')
        expect(formaterHeure(1500)).toBe('1h00')
    })
})
