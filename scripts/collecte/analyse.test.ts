import { describe, expect, it } from 'vitest'
import { analyserFiche, appliquerLieuParDefaut, lireLigneInfos, lireLigneSeances, lirePlageHoraire } from './analyse'

const resume = (seances: { debut: string, lieu: string | null }[]) =>
    seances.map(({ debut, lieu }) => ({ debut, lieu }))

describe('séances', () => {
    it('lit plusieurs séances avec heures et un lieu écrit à la fin de la ligne', () => {
        const { seances } = analyserFiche(
            'Samedi 7 novembre à 13h30, Mercredi 11 novembre à 13h30, Samedi 14 novembre à 9h au Megarama Arras',
        )
        expect(resume(seances)).toEqual([
            { debut: '2026-11-07T13:30', lieu: 'Megarama Arras' },
            { debut: '2026-11-11T13:30', lieu: 'Megarama Arras' },
            { debut: '2026-11-14T09:00', lieu: 'Megarama Arras' },
        ])
    })

    it("reprend le lieu du résumé public quand la séance n'en a pas", () => {
        const { seances } = analyserFiche(
            'Jeudi 12 novembre à 13h30, Dimanche 15 novembre à 11h',
            'Jeudi 12 novembre 2026, dimanche 15 novembre 2026 - Megarama',
        )
        expect(resume(seances)).toEqual([
            { debut: '2026-11-12T13:30', lieu: 'Megarama Arras' },
            { debut: '2026-11-15T11:00', lieu: 'Megarama Arras' },
        ])
    })

    it("garde la date seule quand l'heure n'est pas publiée, avec le lieu du résumé", () => {
        const { seances } = analyserFiche('BLIND TEST\nLundi 9 novembre 2026', 'Lundi 9 novembre 2026 - Casino')
        expect(resume(seances)).toEqual([{ debut: '2026-11-09', lieu: "Casino d'Arras" }])
    })

    it('lit deux lieux, des heures sans « à », des majuscules et un astérisque', () => {
        const seances = lireLigneSeances(
            "Samedi 7 novembre à 20h au CASINO D'ARRAS*, MERCREDI 11 NOVEMBRE 18H30, JEUDI 12 NOVEMBRE 13H30 AU MEGARAMA ARRAS",
        )
        expect(resume(seances)).toEqual([
            { debut: '2026-11-07T20:00', lieu: "Casino d'Arras" },
            { debut: '2026-11-11T18:30', lieu: 'Megarama Arras' },
            { debut: '2026-11-12T13:30', lieu: 'Megarama Arras' },
        ])
    })

    it('lit « en présence de… » sur la même ligne ou sur la suivante', () => {
        const [meme] = lireLigneSeances(
            'Mardi 10 novembre à 13h30 au Casino d’Arras en présence de la réalisatrice Mounia Meddour',
        )
        expect(meme.lieu).toBe("Casino d'Arras")
        expect(meme.presence).toBe('la réalisatrice Mounia Meddour')

        const { seances } = analyserFiche("Vendredi 6 novembre à 20h au Casino d'Arras\nen présence de l'équipe du film")
        expect(seances[0].presence).toBe("l'équipe du film")
    })

    it("lit un lieu après un astérisque et rattache « en présence » à la séance marquée seulement", () => {
        const { seances } = analyserFiche(
            'Vendredi 13 novembre à 11h, Samedi 14 novembre à 13h15* au Megarama Arras\n*en présence du producteur Robert Kijak',
        )
        expect(seances.map((s) => [s.debut, s.lieu, s.presence])).toEqual([
            ['2026-11-13T11:00', 'Megarama Arras', null],
            ['2026-11-14T13:15', 'Megarama Arras', 'du producteur Robert Kijak'],
        ])
    })

    it('reconnaît la chapelle du Pôle culturel Saint-Pierre', () => {
        const [seance] = lireLigneSeances('Mardi 10 novembre à 19h à la CHAPELLE DU PÔLE CULTUREL SAINT-PIERRE')
        expect(seance.lieu).toBe('Chapelle du Pôle culturel Saint-Pierre')
    })

    it("ne garde pas une date sans heure quand le même jour a déjà une séance avec heure", () => {
        const { seances } = analyserFiche('Vendredi 13 novembre 2026\nVendredi 13 novembre à 11h au Megarama Arras')
        expect(resume(seances)).toEqual([{ debut: '2026-11-13T11:00', lieu: 'Megarama Arras' }])
    })

    it('marque « à vérifier » un jour de la semaine impossible en 2026', () => {
        const [seance] = analyserFiche("MARDI 14 NOVEMBRE À 18H00 AU CASINO D'ARRAS").seances
        expect(seance.statut).toBe('a_verifier')
    })
})

describe('informations du film', () => {
    it('lit pays, année, durée et version', () => {
        expect(lireLigneInfos('Kosovo, Suisse, 2026, 1h41, vostf')).toEqual({
            pays: ['Kosovo', 'Suisse'],
            annee: 2026,
            duree_min: 101,
            version: 'vostf',
        })
    })

    it('lit une durée seule : « Durée : 45min » ou « 36min, animation, color »', () => {
        expect(lireLigneInfos('Durée : 45min')?.duree_min).toBe(45)
        expect(lireLigneInfos('36min, animation, color')?.duree_min).toBe(36)
    })

    it('additionne les durées d\'un film en deux parties', () => {
        const { infos } = analyserFiche(
            'France, 1972\n1ère partie : La Masure Gorbeau (durée : 1h58)\n2ème partie : L’Épopée de la rue Saint-Denis (1h57)',
        )
        expect(infos?.duree_min).toBe(235)
    })

    it('lit la réalisation dans la fiche technique, puis dans « Film de »', () => {
        expect(analyserFiche('Film de Nicole Garcia\nRéalisation : Nicole Garcia').realisation).toEqual(['Nicole Garcia'])
        expect(analyserFiche('Film de clôture - Arras Film Festival 2026').realisation).toEqual([])
    })
})

describe('lieu par défaut', () => {
    it("donne le lieu de la section aux séances qui n'en ont pas, sans écraser un lieu déjà lu", () => {
        const { seances } = analyserFiche('Lundi 9 novembre 2026')
        expect(resume(appliquerLieuParDefaut(seances, 'Village du festival'))).toEqual([
            { debut: '2026-11-09', lieu: 'Village du festival' },
        ])

        const avecLieu = lireLigneSeances('Mardi 10 novembre à 19h au Casino d\'Arras')
        expect(appliquerLieuParDefaut(avecLieu, 'Village du festival')[0].lieu).toBe("Casino d'Arras")
    })

    it("ne change rien quand la section n'a pas de lieu par défaut", () => {
        const { seances } = analyserFiche('Lundi 9 novembre 2026')
        expect(appliquerLieuParDefaut(seances, undefined)[0].lieu).toBeNull()
    })
})

describe('plage horaire sur la ligne suivante', () => {
    it("lit l'horaire, la durée et le lieu d'un after (fiche du Blind Test)", () => {
        const { seances } = analyserFiche(
            'BLIND TEST\nspécial musique de films\nLundi 9 novembre 2026\nDe 23h à 1h au Village du festival\nEntrée gratuite',
        )
        expect(seances).toEqual([
            { debut: '2026-11-09T23:00', lieu: 'Village du festival', presence: null, statut: 'ok', duree_min: 120 },
        ])
    })

    it('lit les variantes « À partir de 23h » et « À 21h30 au Casino d\'Arras »', () => {
        expect(lirePlageHoraire('À partir de 23h')).toEqual({ heure: '23:00', duree_min: null, lieu: null })
        expect(lirePlageHoraire("À 21h30 au Casino d'Arras")).toEqual({
            heure: '21:30', duree_min: null, lieu: "Casino d'Arras",
        })
        expect(lirePlageHoraire('De 22h30 à 1h30')?.duree_min).toBe(180)
        expect(lirePlageHoraire('De 22h à minuit au Village du festival')).toEqual({
            heure: '22:00', duree_min: 120, lieu: 'Village du festival',
        })
    })

    it("ne prend pas pour un horaire une ligne qui n'en est pas un", () => {
        expect(lirePlageHoraire('Entrée gratuite')).toBeNull()
        expect(lirePlageHoraire('Durée : 45min')).toBeNull()
    })
})

describe('lieux', () => {
    it("lit « à l'Université d'Artois - Amphithéâtre Churchill » sans garder le « l' »", () => {
        const [seance] = lireLigneSeances("Vendredi 13 novembre à 14h30 à l'Université d'Artois - Amphithéâtre Churchill")
        expect(seance.lieu).toBe("Université d'Artois - Amphithéâtre Churchill")
    })

    it("lit aussi « à l'… » dans une plage horaire", () => {
        expect(lirePlageHoraire("À 14h30 à l'Université d'Artois - Amphithéâtre Churchill")?.lieu).toBe(
            "Université d'Artois - Amphithéâtre Churchill",
        )
    })
})
