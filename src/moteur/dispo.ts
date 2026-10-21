import type { SeanceFestival } from './seances'

export type Moment = 'matin' | 'apres-midi' | 'soir'

export const MOMENTS: { id: Moment; nom: string; precision: string; debutMin: number; finMin: number }[] = [
    { id: 'matin', nom: 'Matin', precision: 'avant 12h', debutMin: 0, finMin: 12 * 60 },
    { id: 'apres-midi', nom: 'Après-midi', precision: '12h – 18h', debutMin: 12 * 60, finMin: 18 * 60 },
    // le soir va jusqu'à 3h du matin : une séance qui finit après minuit reste une séance du soir
    { id: 'soir', nom: 'Soir', precision: 'dès 18h', debutMin: 18 * 60, finMin: 27 * 60 },
]

// Pour chaque jour, les moments où la personne est libre
export type Dispo = Record<string, Moment[]>

export function aDesDispo(dispos: Dispo): boolean {
    return Object.values(dispos).some((moments) => moments.length > 0)
}

/** Plages libres d'un jour ; les moments qui se suivent (matin + après-midi…) sont réunis en une seule. */
function plagesLibres(moments: Moment[]): [number, number][] {
    const plages: [number, number][] = []
    for (const m of MOMENTS.filter((m) => moments.includes(m.id))) {
        const derniere = plages[plages.length - 1]
        if (derniere && derniere[1] === m.debutMin) {derniere[1] = m.finMin}
        else {plages.push([m.debutMin, m.finMin])}
    }
    return plages
}

/**
 * La séance tient-elle entièrement dans les moments libres de ce jour-là ?
 * Heure non publiée : on la propose si la personne est libre ce jour-là
 */
export function estLibre(seance: SeanceFestival, dispos: Dispo): boolean {
    const moments = dispos[seance.jour] ?? []
    if (moments.length === 0) return false
    const { debutMin, finMin } = seance
    if (debutMin === null || finMin === null) return true
    return plagesLibres(moments).some(([debut, fin]) => debutMin >= debut && finMin <= fin)
}

// ajoute ou retire un moment pour un jour
export function basculerMoment(dispos: Dispo, jour: string, moment: Moment): Dispo {
    const actuels = dispos[jour] ?? []
    const suivants = actuels.includes(moment) ? actuels.filter((m) => m !== moment) : [...actuels, moment]
    const { [jour]: _ancien, ...autres } = dispos
    return suivants.length > 0 ? { ...autres, [jour]: suivants } : autres
}
