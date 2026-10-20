import { useMemo, useState } from 'react'
import programmeJson from '../data/programme.json'
import type { Programme, TypeEvenement, Seance } from './types'
 
const programme = programmeJson as Programme
 
const LIBELLES_TYPE: Record<TypeEvenement, string | null> = {
    film: null,
    rencontre: 'Rencontre',
    'cine-concert': 'Ciné-concert',
    after: 'After musical',
}
 
// Formatage d'une durée en minutes en chaîne de caractères "XhYY"
function formaterDuree(minutes: number) {
    return `${Math.floor(minutes / 60)}h${String(minutes % 60).padStart(2, '0')}`
}

// Formatage d'une séance en chaîne de caractères "jour à heure · lieu · (à vérifier)"
function formaterSeance(s: Seance) {
    const date = new Date(s.debut)
    const jour = date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
    const heure = `${date.getHours()}h${String(date.getMinutes()).padStart(2, '0')}`
    return [`${jour} à ${heure}`, s.lieu, s.statut === 'a_verifier' ? '(à vérifier)' : null]
        .filter(Boolean)
        .join(' · ')
}

// Normalisation d'une chaîne de texte pour la recherche (suppression des accents et conversion en minuscules)
function normaliser(texte: string) {
    return texte.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}
 
export default function App() {

    // États pour la section sélectionnée et le texte de recherche
    const [section, setSection] = useState('')
    const [recherche, setRecherche] = useState('')
    
    // Création d'une map pour accéder rapidement aux noms des sections par leur ID
    const nomSection = useMemo(
        () => new Map(programme.sections.map((s) => [s.id, s.nom])),
        [],
    )
    
    // Filtrage des événements en fonction de la section sélectionnée et du texte de recherche
    const resultats = useMemo(() => {

        // Choisir "Avant-premières" inclut aussi ses sous-sections (Toiles de maîtres)
        const sectionsChoisies = new Set([
            section,
            ...programme.sections.filter((s) => s.parent === section).map((s) => s.id),
        ])
        const q = normaliser(recherche.trim())

        return programme.evenements.filter((e) => {
            const dansSection = !section || sectionsChoisies.has(e.section)
            const correspond = !q || normaliser(e.titre).includes(q)
            return dansSection && correspond
        })
        
    }, [section, recherche])
    
    return (
        <main className="mx-auto max-w-3xl p-6">
            <h1 className="text-3xl font-bold">Arras Film Festival – Programme interactif</h1>
            <p className="mt-4">
                Projet de bénévole, indépendant et non officiel. Informations sur le{' '}
                <a className="underline" href="https://www.arrasfilmfestival.com/">
                site officiel
                </a>
                .
            </p>
        
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-1 font-semibold">
                Section
                <select
                    className="rounded border-2 border-black p-3 font-normal"
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                >
                    <option value="">Toutes les sections</option>
                    {programme.sections.map((s) => (
                    <option key={s.id} value={s.id}>
                        {s.nom}
                    </option>
                    ))}
                </select>
                </label>
        
                <label className="flex flex-col gap-1 font-semibold">
                Titre
                <input
                    type="search"
                    className="rounded border-2 border-black p-3 font-normal"
                    value={recherche}
                    onChange={(e) => setRecherche(e.target.value)}
                    placeholder="Rechercher un titre"
                />
                </label>
            </div>
        
            <p className="mt-6" aria-live="polite">
                {resultats.length} résultat{resultats.length > 1 ? 's' : ''}
            </p>
        
            <ul className="mt-4 space-y-3">
                {resultats.map((e) => (
                <li key={e.id} className="rounded border-2 border-black p-4">
                    <a
                    className="text-xl font-bold underline"
                    href={e.lien_officiel}
                    target="_blank"
                    rel="noopener noreferrer"
                    >
                    {e.titre}
                    </a>
                    <p className="mt-1">
                    {nomSection.get(e.section)}
                    {LIBELLES_TYPE[e.type] && ` · ${LIBELLES_TYPE[e.type]}`}
                    </p>
                    {e.realisation.length > 0 && (
                    <p className="mt-1">De {e.realisation.join(', ')}</p>
                    )}
                    <p className="mt-1">
                    {[
                        e.pays.join(', '),
                        e.annee,
                        e.duree_min ? formaterDuree(e.duree_min) : null,
                        e.version,
                    ]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                    {e.seances.length > 0 && (
                    <ul className="mt-2 space-y-1">
                        {e.seances.map((s) => (
                        <li key={s.debut + (s.lieu ?? '')} className="font-semibold">
                            {formaterSeance(s)}
                        </li>
                        ))}
                    </ul>
                    )}
                </li>
                ))}
            </ul>
        </main>
    )
}