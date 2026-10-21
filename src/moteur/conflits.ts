import { MARGE_MIN, trajetEntre } from './regles'
import type { SeanceFestival } from './seances'

/**
 * - chevauche : les deux séances se recouvrent ;
 * - trop_juste : pas de chevauchement, mais moins que la marge de sécurité (+ le trajet si les lieux diffèrent).
 */
export type TypeConflit = 'chevauche' | 'trop_juste'

export interface Conflit {
    type: TypeConflit
    avec: SeanceFestival
}

// Conflit entre deux séances ou null
export function conflitEntre(a: SeanceFestival, b: SeanceFestival): TypeConflit | null {
    if (a.id === b.id || a.jour !== b.jour) {return null}
    const debutA = a.debutMin
    const debutB = b.debutMin
    if (debutA === null || debutB === null) {return null}

    const [premiere, seconde, debutSeconde] = debutA <= debutB ? [a, b, debutB] : [b, a, debutA]
    const finPremiere = premiere.finMin ?? Math.min(debutA, debutB)

    if (debutSeconde < finPremiere) {return 'chevauche'}
    // trajet entre les deux lieux (lieu inconnu : on suppose qu'il faut un trajet)
    const trajet = trajetEntre(premiere.seance.lieu, seconde.seance.lieu)
    return debutSeconde < finPremiere + MARGE_MIN + trajet ? 'trop_juste' : null
}

// Conflits d'une séance avec une liste de séances déjà choisies
export function conflitsAvec(candidate: SeanceFestival, selection: SeanceFestival[]): Conflit[] {
    const resultat: Conflit[] = []
    for (const autre of selection) {
        const type = conflitEntre(candidate, autre)
        if (type) {resultat.push({ type, avec: autre })}
    }
    return resultat
}

// Paires en conflit à l'intérieur d'une sélection. 
export function conflitsDansSelection(selection: SeanceFestival[]): { a: SeanceFestival; b: SeanceFestival; type: TypeConflit }[] {
    const resultat: { a: SeanceFestival; b: SeanceFestival; type: TypeConflit }[] = []
    selection.forEach((a, i) => {
        for (const b of selection.slice(i + 1)) {
            const type = conflitEntre(a, b)
            if (type) {resultat.push({ a, b, type })}
        }
    })
    return resultat
}
