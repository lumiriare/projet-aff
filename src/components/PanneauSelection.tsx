import { jourCourt, numeroJour, formaterHeure } from '../format'
import { conflitsDansSelection } from '../moteur/conflits'
import type { SeanceFestival } from '../moteur/seances'
import type { Evenement } from '../types'

interface Props {
    selection: SeanceFestival[]
    filmsAPlacer: Evenement[] // films « à voir » qui n'ont pas encore de séance choisie
    onRetirer: (id: string) => void
    onRetirerFilm: (id: string) => void
    onVoirPlanning: (proposer?: boolean) => void // true : ouvre la page avec les propositions déjà calculées
}

export default function PanneauSelection({ selection, filmsAPlacer, onRetirer, onRetirerFilm, onVoirPlanning }: Props) {
    const conflits = conflitsDansSelection(selection)
    const nbFilms = new Set([...filmsAPlacer.map((f) => f.id), ...selection.map((s) => s.evenement.id)]).size

    return (
        <section aria-labelledby="titre-selection">
            <h2 id="titre-selection" className="text-xl font-bold">
                Mon planning · {nbFilms}
            </h2>

            {nbFilms === 0 && (
                <p className="text-secondaire mt-3">
                    Rien pour le moment.
                </p>
            )}

            {filmsAPlacer.length > 0 && (
                <div className="mt-3">
                    <h3 className="font-bold">Films à voir · {filmsAPlacer.length}</h3>
                    <ul>
                        {filmsAPlacer.map((f) => (
                            <li key={f.id} className="flex items-center justify-between gap-2 border-b border-filet py-2">
                                <p className="min-w-0 font-bold">{f.titre}</p>
                                <button
                                    type="button"
                                    aria-label={`Retirer ${f.titre} de mes films à voir`}
                                    onClick={() => onRetirerFilm(f.id)}
                                    className="min-h-11 min-w-11 shrink-0 border-2 border-encre font-bold"
                                >
                                    ✕
                                </button>
                            </li>
                        ))}
                    </ul>
                    <button
                        type="button"
                        onClick={() => onVoirPlanning(true)}
                        className="mt-3 min-h-11 w-full border-2 border-encre bg-encre px-3 font-bold text-papier"
                    >
                        Proposer un planning ›
                    </button>
                </div>
            )}

            {selection.length > 0 && (
                <div className="mt-4">
                    <h3 className="font-bold">Séances choisies · {selection.length}</h3>
                    <ul>
                        {selection.map((s) => (
                            <li key={s.id} className="flex items-start justify-between gap-2 border-b border-filet py-2">
                                <div className="min-w-0">
                                    <p className="font-bold">
                                        {jourCourt(s.jour)} {numeroJour(s.jour)}
                                        {s.debutMin !== null && ` · ${formaterHeure(s.debutMin)}`}
                                    </p>
                                    <p className="text-secondaire text-[0.9rem] leading-snug">
                                        {s.evenement.titre} · {s.seance.lieu ?? 'Lieu à confirmer'}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    aria-label={`Retirer ${s.evenement.titre} de ma sélection`}
                                    onClick={() => onRetirer(s.id)}
                                    className="min-h-11 min-w-11 shrink-0 border-2 border-encre font-bold"
                                >
                                    ✕
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {conflits.length > 0 && (
                <p className="mt-3 font-bold">
                    {conflits.length} conflit{conflits.length > 1 ? 's' : ''} dans votre sélection.
                </p>
            )}

            <button
                type="button"
                onClick={() => onVoirPlanning()}
                disabled={nbFilms === 0}
                className="mt-4 min-h-11 w-full border-2 border-encre px-3 font-bold disabled:border-dashed disabled:text-secondaire"
            >
                Voir mon planning ›
            </button>
        </section>
    )
}
