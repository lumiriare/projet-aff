export type TypeEvenement = 'film' | 'rencontre' | 'cine-concert' | 'after'

export interface Seance {
    debut: string
    lieu: string | null
    statut: 'ok' | 'a_verifier'
}

export interface Section {
    id: string
    nom: string
    parent: string | null
}

export interface Evenement {
    id: string
    titre: string
    section: string
    type: TypeEvenement
    lien_officiel: string
    affiche: string | null
    realisation: string[]
    pays: string[]
    annee: number | null
    duree_min: number | null
    version: string | null
    seances_brutes: string[]
    seances: Seance[]
}

export interface Programme {
    sections: Section[]
    evenements: Evenement[]
}