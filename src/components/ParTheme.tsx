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
}

// "sam 14 - 13h15" (ou seulement le jour quand l'heure n'est pas publiée)
function libelleSeance(s: SeanceFestival): string {
    const jour = `${jourCourt(s.jour)} ${numeroJour(s.jour)}`
    return s.debutMin === null ? jour : `${jour} - ${formaterHeure(s.debutMin)}`
}

export default function ParTheme({ sections, evenements, seancesParEvenement, selection, onBasculer }: Props) {
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
                <p className="text-secondaire mt-2" aria-live="polite">
                    {nbFilms} film{nbFilms > 1 ? 's' : ''} dans {themes.length} thème{themes.length > 1 ? 's' : ''}
                </p>
            </div>

            {themes.map(({ section, films }) => (
                // la clé change avec la recherche : les thèmes s'ouvrent quand on cherche, se referment sinon
                <details key={`${section.id}${termes ? '-recherche' : ''}`} open={termes !== ''} className="border-t-2 border-encre">
                    <summary className="flex min-h-12 cursor-pointer items-center justify-between gap-3 px-4 py-2 text-lg font-bold">
                        <span>{section.nom}</span>
                        <span className="text-secondaire text-[0.85rem] font-normal">
                            {films.length} film{films.length > 1 ? 's' : ''}
                        </span>
                    </summary>

                    <ul>
                        {films.map((e) => {
                            const seances = seancesParEvenement.get(e.id) ?? []
                            return (
                                <li key={e.id} className="border-t border-filet px-4 py-3">
                                    <h3 className="text-lg font-bold leading-snug">
                                        <a
                                            href={e.lien_officiel}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="underline decoration-transparent underline-offset-4 hover:decoration-current"
                                        >
                                            {e.titre}
                                        </a>
                                    </h3>
                                    <p className="text-secondaire text-[0.85rem] leading-snug">
                                        {[e.realisation.join(', '), e.duree_min ? formaterHeure(e.duree_min) : null]
                                            .filter(Boolean)
                                            .join(' · ')}
                                    </p>

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
                                                            aria-pressed={ajoutee}
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
                                                                <span className="text-[0.85rem] font-normal">
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
