import { useCallback, useEffect, useState } from 'react'

const CLE = 'projet-aff:selection'

function lire(): string[] {
    try {
        const brut = localStorage.getItem(CLE)
        const valeur: unknown = brut ? JSON.parse(brut) : []
        return Array.isArray(valeur) ? valeur.filter((v): v is string => typeof v === 'string') : []
    } catch {
        // stockage indisponible ou contenu abîmé : on repart d'une sélection vide
        return [] 
    }
}

// sélection de séances (identifiants), conservée dans le navigateur
export function useSelection() {
    const [ids, setIds] = useState<string[]>(lire)

    useEffect(() => {
        try {
            localStorage.setItem(CLE, JSON.stringify(ids))
        } catch {
            // pas grave : la sélection reste valable le temps de la visite
        }
    }, [ids])

    const ajouter = useCallback((id: string) => setIds((c) => (c.includes(id) ? c : [...c, id])), [])
    const retirer = useCallback((id: string) => setIds((c) => c.filter((x) => x !== id)), [])
    const vider = useCallback(() => setIds([]), [])

    return { ids, ajouter, retirer, vider }
}
