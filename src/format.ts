// Date.getDay() : 0 = dimanche (et non lundi)
const NOMS_JOURS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi']

// jours du festival : 6 au 15 novembre 2026
export const JOURS_FESTIVAL = Array.from({ length: 10 }, (_, i) => `2026-11-${String(6 + i).padStart(2, '0')}`)

function dateDe(jour: string) {
    return new Date(`${jour}T12:00:00`)
}

export function numeroJour(jour: string): number {
    return dateDe(jour).getDate()
}

// dim
export function jourCourt(jour: string): string {
    return NOMS_JOURS[dateDe(jour).getDay()].slice(0, 3)
}

// dimanche 8 novembre
export function jourLong(jour: string): string {
    const d = dateDe(jour)
    const nom = NOMS_JOURS[d.getDay()]
    return `${nom[0].toUpperCase()}${nom.slice(1)} ${d.getDate()} novembre`
}

// heures de la journée comme durée
export function formaterHeure(minutes: number): string {
  return `${Math.floor(minutes / 60) % 24}h${String(minutes % 60).padStart(2, '0')}`
}

export function normaliser(texte: string): string {
    return texte
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
}

// formatage de la présence
export function formaterPresence(presence: string): string {
    return /^(du|des|de|d['’])/i.test(presence) ? presence : `de ${presence}`
}
