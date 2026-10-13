// Fonctions pour analyser le texte d'une fiche film

// Nettoyage du texte
export function nettoyer(texte: string): string {
    return texte
        .replace(/[\u200e\u200f]/g, '')     // marques invisibles (présentes dans certains titres)
        .replace(/\u00a0/g, ' ')            // espaces insécables
        .replace(/\s+/g, ' ')               // plusieurs espaces consécutifs
        .trim()
}

// Transformation du texte en slug 
export function slugify(texte: string): string {
    return texte
        .normalize('NFD')                   // décomposition des caractères accentués
        .replace(/[\u0300-\u036f]/g, '')    // suppression des diacritiques
        .toLowerCase()                      // conversion en minuscules
        .replace(/[^a-z0-9]+/g, '-')        // remplacement des caractères non alphanumériques par des tirets
        .replace(/^-+|-+$/g, '')            // suppression des tirets en début et fin de chaîne
}

// Extraction de la durée en minutes à partir d'une chaîne de texte
// Exemples du type "1h41", "2h", "95 min", "95'"
export function lireDuree(texte: string): number | null {
    const t = texte.toLowerCase().replace(/\s+/g, '')                           
    const heures = t.match(/^(\d+)h(\d{1,2})?(?:min)?$/)                        
    if (heures) { return Number(heures[1]) * 60 + Number(heures[2] ?? 0) }      
    const minutes = t.match(/^(\d+)(?:min|')$/)                                 
    if (minutes) { return Number(minutes[1])}                                  
    return null
}

// Interface pour les informations extraites d'une ligne de texte
export interface Infos {
    pays: string[]
    annee: number
    duree_min: number | null
    version: string | null
}

// Extraction des informations d'un film à partir d'une ligne de texte
// Ligne du type "Kosovo, Suisse, 2026, 1h41, vostf"
export function lireLigneInfos(ligne: string): Infos | null {
    if (ligne.length > 150) {return null}                               // ligne trop longue pour contenir des informations fiables
    const morceaux = ligne.split(',').map(nettoyer)                     // nettoyage des morceaux de texte
    const iAnnee = morceaux.findIndex((m) => /^(19|20)\d{2}$/.test(m))  // recherche de l'année (4 chiffres commençant par 19 ou 20)
    if (iAnnee < 1) {return null}                                       // si l'année est absente ou en première position, on ne peut pas extraire d'informations fiables
    
    let duree: number | null = null                                     // variable pour stocker la durée en minutes
    const reste: string[] = []                                          // tableau pour stocker les morceaux restants après l'année

    for (const morceau of morceaux.slice(iAnnee + 1)) {                 // pour chaque morceau après l'année, on cherche la durée et on stocke le reste
        const d = lireDuree(morceau)                                    // lecture de la durée en minutes
        if (d !== null && duree === null) {duree = d}                   // si on trouve une durée, on la stocke (on ne garde que la première trouvée)
        else reste.push(morceau)                                        // sinon on stocke le morceau dans le reste
    }

    return {                                                            
        pays: morceaux.slice(0, iAnnee),
        annee: Number(morceaux[iAnnee]),
        duree_min: duree,
        version: reste.join(', ') || null,
    }
}

// Séparation des noms de personnes dans une chaîne de texte
function separerNoms(texte: string): string[] {
    return texte
        .split(/\s*(?:,|&| et )\s*/)
        .map(nettoyer)
        .filter(Boolean)
}

// Extraction des noms de réalisateurs à partir d'un tableau de lignes de texte
// "Réalisation : X" (fiche technique), sinon "Film de X"
export function lireRealisation(lignes: string[]): string[] {
    for (const ligne of lignes) {                                                   // pour chaque ligne, on cherche un motif de type "Réalisation : X"
        const m = ligne.match(/^réalisation\s*:\s*(.+)$/i)                          
        if (m) {return separerNoms(m[1])}                                           // si on trouve un motif, on retourne les noms séparés
    }
    for (const ligne of lignes) {                                                   // pour chaque ligne, on cherche un motif de type "Film de X" (ou "un film de X")
        const m = ligne.match(/^(?:un )?film de\s+(.+)$/i)
        if (m && !/arras film festival/i.test(m[1])) {return separerNoms(m[1])}     // si on trouve un motif, on retourne les noms séparés
    }
    return []
}

// Constante pour détecter les dates dans le texte
const JOUR_NOVEMBRE = /(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)\s+\d{1,2}(?:er)?\s+novembre/i
 
// Extraction des lignes de texte qui ressemblent à des séances de projection
export function lireSeances(lignes: string[]): string[] {
    const resultat: string[] = []
    lignes.forEach((ligne, i) => {                                                      // pour chaque ligne, on cherche un motif de type "Jour Mois" (ex: "Samedi 15 novembre")
        if (JOUR_NOVEMBRE.test(ligne) && ligne.length < 200) {                          // si on trouve un motif, on ajoute la ligne au résultat (si elle n'est pas trop longue)
            resultat.push(ligne)
            const suivante = lignes[i + 1]
            if (suivante && /^en présence/i.test(suivante)) {resultat.push(suivante)}   // si la ligne suivante commence par "En présence", on l'ajoute aussi au résultat
        }
    })
    return resultat
}

// Interface pour le résultat de l'analyse d'une fiche film
export interface ResultatFiche {
    infos: Infos | null
    realisation: string[]
    seances: string[]
}

// Analyse d'une fiche film à partir d'un texte brut
export function analyserFiche(texte: string): ResultatFiche {
    const lignes = texte
        .split(/\r?\n/)
        .map(nettoyer)
        .filter(Boolean)
    return {
        infos: lignes.map(lireLigneInfos).find((i) => i !== null) ?? null,
        realisation: lireRealisation(lignes),
        seances: lireSeances(lignes),
    }
}

