import type { ReactNode } from 'react'
import type { Section } from '../types'

export interface Filtres {
    sections: string[]
    lieux: string[]
    recherche: string
}

export const FILTRES_VIDES: Filtres = { sections: [], lieux: [], recherche: '' }

interface Props {
    filtres: Filtres
    sections: Section[]
    lieux: string[]
    onChange: (filtres: Filtres) => void
}

function basculer(liste: string[], valeur: string) {
    return liste.includes(valeur) ? liste.filter((v) => v !== valeur) : [...liste, valeur]
}

// Un groupe de filtres replié par défaut : le nombre de choix actifs reste visible quand il est fermé
function Groupe({ titre, nombre, children }: { titre: string; nombre: number; children: ReactNode }) {
    return (
        <details className="group border-t border-filet">
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 font-bold [&::-webkit-details-marker]:hidden">
                <span>{titre}</span>
                <span className="flex items-center gap-2">
                    {nombre > 0 && <span className="border-2 border-encre px-2 text-[0.85rem]">{nombre}</span>}
                    <span aria-hidden="true" className="group-open:hidden">
                        +
                    </span>
                    <span aria-hidden="true" className="hidden group-open:inline">
                        −
                    </span>
                </span>
            </summary>
            <div className="pb-2">{children}</div>
        </details>
    )
}

export default function PanneauFiltres({ filtres, sections, lieux, onChange }: Props) {
    const actif = filtres.sections.length > 0 || filtres.lieux.length > 0 || filtres.recherche !== ''

    return (
        <div className="space-y-4">
            <div>
                <label htmlFor="recherche" className="block font-bold">
                    Rechercher
                </label>
                <input
                    id="recherche"
                    type="search"
                    value={filtres.recherche}
                    onChange={(e) => onChange({ ...filtres, recherche: e.target.value })}
                    placeholder="Titre, réalisateur, pays…"
                    className="mt-1 min-h-11 w-full border-2 border-encre bg-papier px-3"
                />
            </div>

            <div>
                <Groupe titre="Thèmes" nombre={filtres.sections.length}>
                    <fieldset>
                        <legend className="sr-only">Thèmes</legend>
                        {sections.map((s) => (
                            <label key={s.id} className="flex items-start gap-2 py-1">
                                <input
                                    type="checkbox"
                                    className="mt-1 size-5 shrink-0 accent-encre"
                                    checked={filtres.sections.includes(s.id)}
                                    onChange={() => onChange({ ...filtres, sections: basculer(filtres.sections, s.id) })}
                                />
                                <span>{s.nom}</span>
                            </label>
                        ))}
                    </fieldset>
                </Groupe>

                <Groupe titre="Lieux" nombre={filtres.lieux.length}>
                    <fieldset>
                        <legend className="sr-only">Lieux</legend>
                        {lieux.map((lieu) => (
                            <label key={lieu} className="flex items-start gap-2 py-1">
                                <input
                                    type="checkbox"
                                    className="mt-1 size-5 shrink-0 accent-encre"
                                    checked={filtres.lieux.includes(lieu)}
                                    onChange={() => onChange({ ...filtres, lieux: basculer(filtres.lieux, lieu) })}
                                />
                                <span>{lieu}</span>
                            </label>
                        ))}
                    </fieldset>
                </Groupe>
            </div>

            {actif && (
                <button
                    type="button"
                    onClick={() => onChange(FILTRES_VIDES)}
                    className="min-h-11 w-full border-2 border-encre px-3 font-bold"
                >
                    Effacer les filtres
                </button>
            )}
        </div>
    )
}