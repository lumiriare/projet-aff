// Scraping du programme de l'Arras Film Festival (contenu PUBLIC et VISIBLE uniquement)
// Lancez : npm run collecte
//
// 1. Ouvre la page programme et relève les liens vers les fiches.
// 2. Ouvre chaque fiche dans un navigateur et lit le texte AFFICHÉ (pas le code brut)
// 3. Écrit data/programme.json et un rapport dans data/raw/

import { chromium, type Page } from "playwright"
import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { analyserFiche, nettoyer, slugify } from "./analyse.ts"

// Constantes pour la collecte des données
const URL_PROGRAMME = 'https://www.arrasfilmfestival.com/pages/le-festival/programme-edition/'
const PREFIXE_FICHES = 'https://www.arrasfilmfestival.com/blog/films-de-l-edition-2026/'

// Identification de la collecte dans les journaux du site
const USER_AGENT = 'projet-aff-collecte (projet de bénévole, non officiel)'
const PAUSE_MS = 800

// Dossier de stockage des données collectées
const DOSSIER_DONNEES = path.resolve('data')
const DOSSIER_BRUT = path.join(DOSSIER_DONNEES, 'raw')

type TypeEvenement = 'film' | 'rencontre' | 'cine-concert' | 'after'

// Configuration des sections du programme
interface SectionConfig {
    id: string
    nom: string
    parent: string | null
    type: TypeEvenement
    dossiers: string[] // dossiers d'adresse correspondants sur le site officiel
}


// Les noms de dossiers viennent des adresses du site (certains contiennent des coquilles)
const SECTIONS: SectionConfig[] = [
    { 
        id: 'ouverture', 
        nom: "Film d'ouverture", 
        parent: null, type: 'film', 
        dossiers: ['film-d-ouverture'] 
    },
    { 
        id: 'cloture', 
        nom: 'Film de clôture', 
        parent: null, 
        type: 'film', 
        dossiers: ['film-de-cloture'] 
    },
    { 
        id: 'competition-europeenne', 
        nom: 'Compétition européenne', 
        parent: null, 
        type: 'film', 
        dossiers: ['competition-europeennes'] 
    },
    { 
        id: 'invites-d-honneur', 
        nom: "Invité.es d'honneur", 
        parent: null, 
        type: 'film', 
        dossiers: ['inviteoes-d-honneur'] 
    },
    { 
        id: 'avant-premieres', 
        nom: 'Avant-premières', 
        parent: null, 
        type: 'film', 
        dossiers: ['avant-premieres'] 
    },
    { 
        id: 'toiles-de-maitres', 
        nom: 'Toiles de maîtres', 
        parent: 'avant-premieres', 
        type: 'film', 
        dossiers: ['avant-premieres/toiles-de-maitres'] 
    },
    { 
        id: 'focus-belgique', 
        nom: 'Focus Belgique', 
        parent: null, 
        type: 'film', 
        dossiers: ['focus-belgique'] 
    },
    { 
        id: 'cinemas-du-monde', 
        nom: 'Cinémas du monde', 
        parent: null, 
        type: 'film', 
        dossiers: ['cinemas-du-monde'] 
    },
    { 
        id: 'visions-de-l-est', 
        nom: "Visions de l'Est", 
        parent: null, 
        type: 'film', 
        dossiers: ['visions-de-l-est'] 
    },
    { 
        id: 'decouvertes-europeennes', 
        nom: 'Découvertes européennes', 
        parent: null, 
        type: 'film', 
        dossiers: ['decouvertes-europeennes'] 
    },
    { 
        id: 'perspectives-du-cinema-francais', 
        nom: 'Perspectives du cinéma français', 
        parent: null, 
        type: 'film', 
        dossiers: ['perspectives-du-cinema-francais'] 
    },
    { 
        id: 'retro-crime-a-l-italienne', 
        nom: "Rétrospective Crime à l'italienne", 
        parent: null, 
        type: 'film', 
        dossiers: ['retro-crime-a-l-italienne'] 
    },
    { 
        id: 'retro-ouvriers-patrons-revolutions', 
        nom: 'Rétrospective Ouvriers, patrons & révolutions', 
        parent: null, 
        type: 'film', 
        dossiers: ['retro-ouvriers-patrons-revolutions'] 
    },
    { 
        id: 'festival-en-famille',
        nom: 'Festival en famille', 
        parent: null, 
        type: 'film', 
        dossiers: ['festival-des-familles'] 
    },
    // Le filtre du site n'a qu'une section "Séances spéciales Rencontres" + les adresses utilisent deux dossiers (à confirmer)
    { 
        id: 'seances-speciales-rencontres', 
        nom: 'Séances spéciales Rencontres', 
        parent: null, 
        type: 'rencontre', 
        dossiers: ['rencontres', 'seances-speciales'] 
    },
    { 
        id: 'cine-concerts', 
        nom: 'Ciné-concerts', 
        parent: null, 
        type: 'cine-concert', 
        dossiers: ['cine-concerts'] 
    },
    { 
        id: 'afters-musicaux', 
        nom: 'Afters musicaux', 
        parent: null, 
        type: 'after', 
        dossiers: ['afters-musicaux'] 
    },
]


// Interface pour les informations extraites d'une fiche film
interface Evenement {
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
    seances: string[]
}

const attendre = (ms: number) => new Promise((r) => setTimeout(r, ms))


// Lecture d'une fiche film à partir de son URL
async function lireFiche(page: Page, url: string, alertes: string[]): Promise<Evenement> {

    // Chargement de la page et lecture du texte affiché
    await page.goto(url, { waitUntil: 'domcontentloaded' })
    const titre = nettoyer(await page.locator('h1').first().innerText())                                // innerText ne renvoie que le texte réellement affiché : les blocs masqués sont ignorés
    const texte = await page.evaluate(() => document.body.innerText)
    const affiche = await page.evaluate(
        () => document.querySelector('meta[property="og:image"]')?.getAttribute('content') ?? null,
    )
    
    // Écriture du texte brut dans un fichier pour inspection ultérieure
    const chemin = url.replace(PREFIXE_FICHES, '').replace(/\.html$/, '')
    const morceaux = chemin.split('/')
    const slug = morceaux.pop() as string
    const dossier = morceaux.join('/')
    await writeFile(path.join(DOSSIER_BRUT, `${dossier.replace(/\//g, '_')}__${slug}.txt`), texte, 'utf-8')
    
    // Analyse du texte pour extraire les informations
    const section = SECTIONS.find((s) => s.dossiers.includes(dossier))
    if (!section) {alertes.push(`Dossier inconnu « ${dossier} » : ${url}`)}                             // si le dossier n'est pas dans la configuration, on signale une alerte

    // Analyse du texte pour extraire les informations
    const { infos, realisation, seances } = analyserFiche(texte)
    const type = section?.type ?? 'film'

    // Si le type est film, on vérifie que les informations essentielles sont présentes et on signale les alertes si nécessaire
    if (type === 'film' && !infos) {
        alertes.push(`Ligne pays/année/durée introuvable : ${titre} (${url})`)
    } else if (type === 'film' && infos && infos.duree_min === null) {
        alertes.push(`Durée introuvable : ${titre} (${url})`)
    }
    if (type === 'film' && realisation.length === 0) {
        alertes.push(`Réalisation introuvable : ${titre} (${url})`)
    }

    return {
        id: slugify(titre),
        titre,
        section: section?.id ?? 'inconnue',
        type,
        lien_officiel: url,
        affiche: affiche ? affiche.replace(/^http:\/\//, 'https://') : null,
        realisation,
        pays: infos?.pays ?? [],
        annee: infos?.annee ?? null,
        duree_min: infos?.duree_min ?? null,
        version: infos?.version ?? null,
        seances,
    }
}


// Fonction principale de collecte des données
async function main() {

    // Création du dossier de stockage des données brutes
    await mkdir(DOSSIER_BRUT, { recursive: true })
    const navigateur = await chromium.launch()
    const contexte = await navigateur.newContext({ userAgent: USER_AGENT, locale: 'fr-FR' })
    const page = await contexte.newPage()
    const alertes: string[] = []
    
    // Lecture de la page programme et extraction des liens vers les fiches
    console.log('Lecture de la page programme…')
    await page.goto(URL_PROGRAMME, { waitUntil: 'networkidle' })
    const liens = await page.$$eval('a[href]', (as) => as.map((a) => (a as HTMLAnchorElement).href))
    const fiches = [...new Set(liens.filter((l) => l.startsWith(PREFIXE_FICHES) && l.endsWith('.html')))].sort()
    console.log(`${fiches.length} fiches trouvées.`)

    const evenements: Evenement[] = []
    const ids = new Set<string>()
    
    // Pour chaque fiche, on lit la page et on extrait les informations
    for (const [i, url] of fiches.entries()) {
        console.log(`[${i + 1}/${fiches.length}] ${url.replace(PREFIXE_FICHES, '')}`)
        try {
            const evenement = await lireFiche(page, url, alertes)
            let id = evenement.id
            for (let n = 2; ids.has(id); n++) id = `${evenement.id}-${n}`
            ids.add(id)
            evenements.push({ ...evenement, id })
        } catch (erreur) {
            alertes.push(`Échec de lecture : ${url} (${String(erreur)})`)
        }
        await attendre(PAUSE_MS)
    }
    await navigateur.close()
    
    // Tri des événements par section et par titre
    const ordre = new Map(SECTIONS.map((s, i) => [s.id, i]))
    evenements.sort(
        (a, b) => (ordre.get(a.section) ?? 99) - (ordre.get(b.section) ?? 99) || a.titre.localeCompare(b.titre, 'fr'),
    )
    
    // Écriture du fichier JSON final et du rapport
    const programme = {
        sections: SECTIONS.map(({ id, nom, parent }) => ({ id, nom, parent })),
        evenements,
    }
    await writeFile(path.join(DOSSIER_DONNEES, 'programme.json'), JSON.stringify(programme, null, 2), 'utf-8')

    const parSection = SECTIONS.map(
        (s) => `${String(evenements.filter((e) => e.section === s.id).length).padStart(3)}  ${s.nom}`,
    )
    const avecSeances = evenements.filter((e) => e.seances.length > 0).length
    const rapport = [
        `Fiches lues : ${evenements.length} / ${fiches.length}`,
        `Fiches avec séances visibles : ${avecSeances}`,
        '',
        'Par section :',
        ...parSection,
        '',
        `Alertes (${alertes.length}) :`,
        ...alertes.map((a) => `- ${a}`),
    ].join('\n')
    await writeFile(path.join(DOSSIER_BRUT, 'rapport.txt'), rapport, 'utf-8')
    console.log('\n' + rapport)
}
 

// Lancement de la collecte
main().catch((erreur) => {
    console.error(erreur)
    process.exit(1)
})