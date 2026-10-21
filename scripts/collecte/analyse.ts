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
    annee: number | null
    duree_min: number | null
    version: string | null
}

// Extraction des informations d'un film à partir d'une ligne de texte
// Ligne du type "Kosovo, Suisse, 2026, 1h41, vostf"
export function lireLigneInfos(ligne: string): Infos | null {
    if (ligne.length > 150) {return null}                               // ligne trop longue pour contenir des informations fiables
    const dureeSeule = ligne.match(/^(?:durée\s*:\s*)?(\d+\s*h\s*\d{0,2}|\d+\s*min)\s*(?:,|$)/i)
    
    if (dureeSeule) {
        return { pays: [], annee: null, duree_min: lireDuree(dureeSeule[1]), version: null }
    }

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

// Films en plusieurs parties 
export function lireDureeParties(lignes: string[]): number | null {
    let total = 0
    let trouve = false
    for (const ligne of lignes) {
        if (!/^\d+\s*(?:ère|ere|re|ème|eme|e|er)\s+partie/i.test(ligne)) {continue}
        const m = ligne.match(/\((?:durée\s*:\s*)?(\d+\s*h\s*\d{0,2}|\d+\s*min)\)/i)
        const duree = m ? lireDuree(m[1]) : null
        if (duree !== null) {
            total += duree
            trouve = true
        }
    }
    return trouve ? total : null
}

// Détection d'un programme de courts-métrages
export function estProgrammeCourts(lignes: string[]): boolean {
    return lignes.some((l) => /^un programme de \d+ courts?[- ]?m[ée]trages?/i.test(l))
}


// SEANCES // 

// Constante pour détecter les dates dans le texte
const JOUR_NOVEMBRE = /(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)\s+\d{1,2}(?:er)?\s+novembre/i
 
export function ressembleASeance(ligne: string): boolean {
    return ligne.length < 200 && JOUR_NOVEMBRE.test(ligne)
}
 
const NOMS_JOURS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi']


// Jours mal notés dans le programme 2026
export function jourIncompatible2026(ligne: string): boolean {
    const re = /(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)\s+(\d{1,2})(?:er)?\s+novembre/gi
    for (const m of ligne.matchAll(re)) {
        const jour = new Date(Date.UTC(2026, 10, Number(m[2]))).getUTCDay()
        if (NOMS_JOURS[jour] !== m[1].toLowerCase()) {return true}
    }
    return false
}


// Extraction des lignes de texte qui ressemblent à des séances de projection
export function lireSeancesBrutes(lignes: string[]): string[] {
    const resultat: string[] = []
    lignes.forEach((ligne, i) => {
        if (ressembleASeance(ligne)) {
            resultat.push(ligne)
            const suivante = lignes[i + 1]
            if (suivante && /^\**\s*en présence/i.test(suivante)) {resultat.push(suivante)}
        }
    })
    return resultat
}

// Interface pour une séance de projection
export interface Seance {
    debut: string 
    lieu: string | null
    presence: string | null
    statut: 'ok' | 'a_verifier'
    duree_min?: number | null // durée de la séance quand la fiche donne une plage horaire (« de 23h à 1h »)
}

const OCCURRENCE_SEANCE =
/(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)\s+(\d{1,2})(?:er)?\s+novembre(?:\s+2026)?(?:\s*(?:à\s*)?(\d{1,2})\s*h\s*(\d{2})?)?/gi
 
const deuxChiffres = (n: number | string) => String(n).padStart(2, '0')

// Normalisation du nom du lieu de projection
export function normaliserLieu(brut: string): string {
    const propre = nettoyer(brut.split(/\s+en présence|\s*\(/i)[0]).replace(/[\s*.,;]+$/g, '')
    const cle = slugify(propre)
    if (cle.includes('casino')) {return "Casino d'Arras"}
    if (cle.includes('megarama')) {return 'Megarama Arras'}
    if (cle.includes('chapelle')) {return 'Chapelle du Pôle culturel Saint-Pierre'}
    if (cle.includes('village')) {return 'Village du festival'}
    if (cle.includes('churchill')) {return "Université d'Artois - Amphithéâtre Churchill"}
    return propre
}

// Extraction de la présence d'une personne 
function extrairePresence(texte: string): string | null {
    const m = texte.match(/en présence\s+(?:de\s+|d['’]\s*)?(.+?)[\s*]*$/i)
    return m ? nettoyer(m[1]) : null
}

// Plage horaire écrite sur la ligne qui suit une date : « De 23h à 1h au Village du festival »
// (aussi « À partir de 23h », « À 21h30 au Casino d'Arras »)
const PLAGE_HORAIRE =
/^(?:de|à partir de|dès|à)\s+(\d{1,2})\s*h\s*(\d{2})?(?:\s+(?:à|jusqu['’]à)\s+(?:(\d{1,2})\s*h\s*(\d{2})?|(minuit)))?(?:\s+(?:(?:au|aux|à la|à)\s+|à l['’])(.+))?$/i

export interface PlageHoraire {
    heure: string // « 23:00 »
    duree_min: number | null // « de 23h à 1h » → 120 (la fin peut tomber après minuit)
    lieu: string | null
}

export function lirePlageHoraire(ligne: string): PlageHoraire | null {
    const m = ligne.match(PLAGE_HORAIRE)
    if (!m) {return null}
    const debut = Number(m[1]) * 60 + Number(m[2] ?? 0)
    let duree: number | null = null
    if (m[3] || m[5]) {
        let fin = m[5] ? 24 * 60 : Number(m[3]) * 60 + Number(m[4] ?? 0)
        if (fin <= debut) {fin += 24 * 60}
        duree = fin - debut
    }
    return {
        heure: `${deuxChiffres(m[1])}:${m[2] ?? '00'}`,
        duree_min: duree,
        lieu: m[6] ? normaliserLieu(m[6]) : null,
    }
}

// Une séance lue dans une ligne, avec un indicateur : l'heure est-elle suivie d'un astérisque ?
// (« Samedi 14 novembre à 13h15* » : une ligne « *en présence de… » suit alors, et ne concerne que cette séance)
interface SeanceLue {
    seance: Seance
    etoile: boolean
}

function lireSeancesDeLaLigne(ligne: string): SeanceLue[] {
    const trouvees = [...ligne.matchAll(OCCURRENCE_SEANCE)]
    if (trouvees.length === 0) {return []}

    const restes = trouvees.map((m, i) => {
        const debutReste = (m.index ?? 0) + m[0].length
        const finReste = trouvees[i + 1]?.index ?? ligne.length
        return ligne.slice(debutReste, finReste)
    })

    // Le lieu suit l'heure (« au Megarama Arras », « - Megarama »), parfois après un astérisque
    const lieux: (string | null)[] = restes.map((reste) => {
        const m = reste.match(/^\s*\**\s*(?:(?:au|aux|à la|à)\s+|à l['’]|[-–—]\s*)(.+)$/i)
        return m ? normaliserLieu(m[1]) : null
    })

    // Un lieu écrit une seule fois à la fin s'applique aux séances qui précèdent
    let suivant: string | null = null
    for (let i = lieux.length - 1; i >= 0; i--) {
        if (lieux[i] === null) {lieux[i] = suivant}
        else {suivant = lieux[i]}
    }

    return trouvees.map((m, i) => {
        const heure = m[3] ? `T${deuxChiffres(m[3])}:${m[4] ?? '00'}` : ''
        return {
            etoile: /^\s*\*/.test(restes[i]),
            seance: {
                debut: `2026-11-${deuxChiffres(m[2])}${heure}`,
                lieu: lieux[i],
                presence: extrairePresence(restes[i]),
                statut: jourIncompatible2026(`${m[1]} ${m[2]} novembre`) ? 'a_verifier' : 'ok',
            },
        }
    })
}

export function lireLigneSeances(ligne: string): Seance[] {
    return lireSeancesDeLaLigne(ligne).map((l) => l.seance)
}

// Extraction des séances à partir des lignes visibles ; une ligne « en présence de… » qui suit s'y rattache
export function lireSeances(lignes: string[]): Seance[] {
    const seances: Seance[] = []
    lignes.forEach((ligne, index) => {
        if (!ressembleASeance(ligne)) {return}
        const lues = lireSeancesDeLaLigne(ligne)
        const suivante = lignes[index + 1]

        // Date seule, puis l'horaire sur la ligne suivante : « Lundi 9 novembre 2026 » / « De 23h à 1h au Village du festival »
        const sansHeure = lues.filter((l) => l.seance.debut.length === 10)
        const plage = sansHeure.length === 1 && suivante ? lirePlageHoraire(suivante) : null
        if (plage) {
            const s = sansHeure[0].seance
            s.debut = `${s.debut}T${plage.heure}`
            s.duree_min = plage.duree_min
            s.lieu = s.lieu ?? plage.lieu
        }

        if (suivante && /^\**\s*en présence/i.test(suivante)) {
            const presence = extrairePresence(suivante)
            // Avec un astérisque, la présence ne concerne que les séances marquées ; sinon, toutes
            const marquees = lues.some((l) => l.etoile)
            for (const l of lues) {
                if (!marquees || l.etoile) {l.seance.presence ??= presence}
            }
        }
        seances.push(...lues.map((l) => l.seance))
    })
    return seances
}

// Complète les séances visibles avec le résumé public de la fiche (meta description) :
// il donne le lieu quand la séance n'en a pas, et les dates des événements dont seul le jour est publié
export function fusionnerSeances(visibles: Seance[], resume: Seance[]): Seance[] {
    const resultat = visibles.map((s) => ({ ...s }))
    for (const r of resume) {
        const jour = r.debut.slice(0, 10)
        const memeJour = resultat.filter((s) => s.debut.slice(0, 10) === jour)
        if (memeJour.length === 0) {resultat.push({ ...r })}
        else for (const s of memeJour) {s.lieu ??= r.lieu}
    }

    // Une date sans heure ne sert à rien quand ce jour a déjà une séance avec heure :
    // on en garde le lieu, puis on la retire
    const avecHeure = resultat.filter((s) => s.debut.length > 10)
    for (const s of resultat.filter((s) => s.debut.length === 10)) {
        for (const o of avecHeure.filter((o) => o.debut.slice(0, 10) === s.debut)) {o.lieu ??= s.lieu}
    }
    return resultat
        .filter((s) => s.debut.length > 10 || !avecHeure.some((o) => o.debut.slice(0, 10) === s.debut))
        .sort((a, b) => a.debut.localeCompare(b.debut))
}


// Lieu par défaut d'une section dont tous les événements ont lieu au même endroit
// (par exemple les afters musicaux : le village du festival). Un lieu déjà lu n'est pas remplacé.
export function appliquerLieuParDefaut(seances: Seance[], lieu: string | undefined): Seance[] {
    if (!lieu) {return seances}
    return seances.map((s) => ({ ...s, lieu: s.lieu ?? lieu }))
}


// Interface pour le résultat de l'analyse d'une fiche film
export interface ResultatFiche {
    infos: Infos | null
    realisation: string[]
    seances_brutes: string[]
    seances: Seance[]
    programme_courts: boolean
}

// Analyse d'une fiche film à partir d'un texte brut
export function analyserFiche(texte: string, description: string | null = null): ResultatFiche {
    const lignes = texte
        .split(/\r?\n/)
        .map(nettoyer)
        .filter(Boolean)
    let infos = lignes.map(lireLigneInfos).find((i) => i !== null) ?? null

    if (infos && infos.duree_min === null) {
        const parties = lireDureeParties(lignes)
        if (parties !== null) {infos = { ...infos, duree_min: parties }}
    }

    const resume = description ? lireLigneSeances(nettoyer(description)) : []

    return {
        infos,
        realisation: lireRealisation(lignes),
        seances_brutes: lireSeancesBrutes(lignes),
        seances: fusionnerSeances(lireSeances(lignes), resume),
        programme_courts: estProgrammeCourts(lignes),
    }
}

