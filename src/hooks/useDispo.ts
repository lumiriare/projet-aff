import { useCallback, useEffect, useState } from 'react'
import { MOMENTS, basculerMoment, type Dispo, type Moment } from '../moteur/dispo'

const CLE = 'projet-aff:dispo'
const MOMENTS_VALIDES = new Set<string>(MOMENTS.map((m) => m.id))

function lire(): Dispo {
    try {
        const brut = localStorage.getItem(CLE)
        const valeur: unknown = brut ? JSON.parse(brut) : {}
        if (typeof valeur !== 'object' || valeur === null || Array.isArray(valeur)) return {}
        const resultat: Dispo = {}
        for (const [jour, moments] of Object.entries(valeur)) {
            if (!Array.isArray(moments)) continue
            const valides = moments.filter((m): m is Moment => typeof m === 'string' && MOMENTS_VALIDES.has(m))
            if (valides.length > 0) resultat[jour] = valides
        }
        return resultat
    } catch {
        return {} // stockage indisponible ou contenu abîmé
    }
}

// Jours et moments où la personne est libre
export function useDispo() {
    const [dispos, setDispos] = useState<Dispo>(lire)

    useEffect(() => {
        try {
            localStorage.setItem(CLE, JSON.stringify(dispos))
        } catch {
            // pas grave : le choix reste valable le temps de la visite
        }
    }, [dispos])

    const basculer = useCallback(
        (jour: string, moment: Moment) => setDispos((d) => basculerMoment(d, jour, moment)),
        [],
    )
    const effacer = useCallback(() => setDispos({}), [])

    return { dispos, basculer, effacer }
}
