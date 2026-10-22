import { useMemo, useState } from 'react'
import { formaterHeure, jourCourt, normaliser, numeroJour } from '../format'
import { conflitsAvec } from '../moteur/conflits'
import type { SeanceFestival } from '../moteur/seances'
import type { Evenement, Section } from '../types'

interface Props {
    sections: Section[]
    evenements: Evenement[]
    seancesParEvenement: Map<string, SeanceFestival[]>
    selection: SeanceFestival[]
    onBasculer: (seance: SeanceFestival) => void
    aVoir: string[] // identifiants des films à voir
    onBasculerAVoir: (id: string) => void
}

// « sam 14 · 13h15 » (ou seulement le jour quand l'heure n'est pas publiée)
function libelleSeance(s: SeanceFestival): string {
    const jour = `${jourCourt(s.jour)} ${numeroJour(s.jour)}`
    return s.debutMin === null ? jour : `${jour} · ${formaterHeure(s.debutMin)}`
}

// « 7 films », mais « 7 événements » pour les afters, les ciné-concerts ou les rencontres
function libelleCompte(films: Evenement[]): string {
    const nom = films.every((f) => f.type === 'film') ? 'film' : 'événement'
    return `${films.length} ${nom}${films.length > 1 ? 's' : ''}`
}

export default function ParTheme({ sections, evenements, seancesParEvenement, selection, onBasculer, aVoir, onBasculerAVoir }: Props) {
    const [recherche, setRecherche] = useState('')
    const idsChoisis = new Set(selection.map((s) => s.id))
    const termes = normaliser(recherche.trim())

    // Les thèmes qui contiennent au moins un film correspondant à la recherche
    const themes = useMemo(
        () =>
            sections
                .map((section) => ({
                    section,
                    films: evenements
                        .filter((e) => e.section === section.id)
                        .filter((e) => !termes || normaliser([e.titre, ...e.realisation, ...e.pays].join(' ')).includes(termes))
                        .sort((a, b) => a.titre.localeCompare(b.titre, 'fr')),
                }))
                .filter(({ films }) => films.length > 0),
        [sections, evenements, termes],
    )
    const nbFilms = themes.reduce((n, t) => n + t.films.length, 0)

    return (
        <div className="min-w-0">
            <h2 className="sr-only">Films par thème</h2>
            <div className="px-4 py-4">
                <label htmlFor="recherche-theme" className="block font-bold">
                    Rechercher
                </label>
                <input
                    id="recherche-theme"
                    type="search"
                    value={recherche}
                    onChange={(e) => setRecherche(e.target.value)}
                    placeholder="Titre, réalisateur, pays…"
                    className="mt-1 min-h-11 w-full border-2 border-encre bg-papier px-3"
                />
                <p className="mt-2 font-bold">
                    Touchez « À voir » sur les films qui vous intéressent : le site peut vous proposer un planning.
                </p>
                <p className="text-secondaire mt-2" aria-live="polite">
                    {nbFilms} titre{nbFilms > 1 ? 's' : ''} dans {themes.length} thème{themes.length > 1 ? 's' : ''}
                </p>
            </div>

            {themes.map(({ section, films }) => (
                // la clé change avec la recherche : les thèmes s'ouvrent quand on cherche, se referment sinon
                <details key={`${section.id}${termes ? '-recherche' : ''}`} open={termes !== ''} className="border-t-2 border-encre">
                    <summary className="flex min-h-12 cursor-pointer items-center justify-between gap-3 px-4 py-2 text-lg font-bold">
                        <span>{section.nom}</span>
                        <span className="text-secondaire text-[0.9rem] font-normal">
                            {libelleCompte(films)}
                        </span>
                    </summary>

                    <ul>
                        {films.map((e) => {
                            const seances = seancesParEvenement.get(e.id) ?? []
                            return (
                                <li key={e.id} className="border-t border-filet px-4 py-3">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                        <h3 className="text-lg font-bold leading-snug">
                                            <a
                                                href={e.lien_officiel}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="underline decoration-transparent underline-offset-4 hover:decoration-current"
                                            >
                                                {e.titre}
                                                <span className="sr-only"> (page officielle, nouvel onglet)</span>
                                            </a>
                                        </h3>
                                        <p className="text-secondaire text-[0.9rem] leading-snug">
                                            {[e.realisation.join(', '), e.duree_min ? formaterHeure(e.duree_min) : null, e.type === 'after' ? 'Entrée gratuite' : null]
                                                .filter(Boolean)
                                                .join(' · ')}
                                        </p>
                                        </div>
                                        {/* Un after (concert, DJ set) n'est pas un film à placer : on touche directement sa séance */}
                                        {e.type !== 'after' && (
                                            <button
                                                type="button"
                                                aria-label={
                                                    aVoir.includes(e.id)
                                                        ? `Retirer ${e.titre} de mes films à voir`
                                                        : `Ajouter ${e.titre} à mes films à voir`
                                                }
                                                onClick={() => onBasculerAVoir(e.id)}
                                                className={`min-h-11 shrink-0 border-2 border-encre px-2 font-bold whitespace-nowrap ${aVoir.includes(e.id) ? 'bg-encre text-papier' : 'bg-papier'}`}
                                            >
                                                {aVoir.includes(e.id) ? '★ À voir' : '☆ À voir'}
                                            </button>
                                        )}
                                    </div>

                                    {seances.length === 0 ? (
                                        <p className="text-secondaire mt-2">Horaires à venir</p>
                                    ) : (
                                        <ul className="mt-2 grid grid-cols-[repeat(auto-fill,minmax(14rem,1fr))] gap-2">
                                            {seances.map((s) => {
                                                const ajoutee = idsChoisis.has(s.id)
                                                const chevauche =
                                                    !ajoutee && conflitsAvec(s, selection).some((c) => c.type === 'chevauche')
                                                return (
                                                    <li key={s.id}>
                                                        <button
                                                            type="button"
                                                            disabled={chevauche}
                                                            aria-label={
                                                                ajoutee
                                                                    ? `Retirer ${e.titre}, ${libelleSeance(s)}, de ma sélection`
                                                                    : `Ajouter ${e.titre}, ${libelleSeance(s)}, à ma sélection`
                                                            }
                                                            onClick={() => onBasculer(s)}
                                                            className={[
                                                                'flex min-h-12 w-full items-center justify-between gap-3 border-2 border-encre px-3 text-left font-bold',
                                                                ajoutee ? 'bg-encre text-papier' : 'bg-papier text-encre',
                                                                chevauche ? 'border-dashed text-secondaire' : '',
                                                            ].join(' ')}
                                                        >
                                                            <span>
                                                                {libelleSeance(s)}
                                                                <br />
                                                                <span className="text-[0.9rem] font-normal">
                                                                    {chevauche ? 'Chevauche' : (s.seance.lieu ?? 'Lieu à confirmer')}
                                                                </span>
                                                            </span>
                                                            <span aria-hidden="true" className="text-xl">
                                                                {ajoutee ? '✓' : '+'}
                                                            </span>
                                                        </button>
                                                    </li>
                                                )
                                            })}
                                        </ul>
                                    )}
                                </li>
                            )
                        })}
                    </ul>
                </details>
            ))}
        </div>
    )
}
