// Règles du planning
// Valeurs PROVISOIRES lol

// Marge de sécurité entre la fin d'une séance et le début de la suivante en minutes
export const MARGE_MIN = 10

// Temps de trajet entre deux lieux différents en minutes
export const TRAJET_ENTRE_LIEUX_MIN = 10

// Nom du lieu tel que l'écrit la collecte (scripts/collecte/analyse.ts)
export const UNIVERSITE = "Université d'Artois - Amphithéâtre Churchill"

// L'Université d'Artois est à 25-30 minutes à pied des autres lieux : on compte le haut de la fourchette
export const TRAJET_UNIVERSITE_MIN = 30

// Durée supposée quand la fiche n'en donne pas en minutes
export const DUREE_PAR_DEFAUT_MIN = 120

// Temps de trajet entre deux lieux en minutes
// (0 dans le même lieu, 10 par défaut, 30 depuis ou vers l'Université)
export function trajetEntre(lieuA: string | null, lieuB: string | null): number {
    if (lieuA !== null && lieuA === lieuB) {return 0}
    if (lieuA === UNIVERSITE || lieuB === UNIVERSITE) {return TRAJET_UNIVERSITE_MIN}
    return TRAJET_ENTRE_LIEUX_MIN // lieux différents ou lieu inconnu : on suppose un trajet
}
