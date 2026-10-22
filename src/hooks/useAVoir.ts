import { useCallback, useEffect, useState } from 'react'

const CLE = 'projet-aff:a-voir'

function lire(): string[] {
    try {
        const brut = localStorage.getItem(CLE)
        const valeur: unknown = brut ? JSON.parse(brut) : []
        return Array.isArray(valeur) ? valeur.filter((v): v is string => typeof v === 'string') : []
    } catch {
        return [] // stockage indisponible ou contenu abîmé
    }
}

// Les films qu'on veut voir (identifiants), conservés dans le navigateur
export function useAVoir() {
    const [ids, setIds] = useState<string[]>(lire)

    useEffect(() => {
        try {
            localStorage.setItem(CLE, JSON.stringify(ids))
        } catch {
            // pas grave : la liste reste valable le temps de la visite
        }
    }, [ids])

    const basculer = useCallback(
        (id: string) => setIds((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id])),
        [],
    )

    return { ids, basculer }
}
