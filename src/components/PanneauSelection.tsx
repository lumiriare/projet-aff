import { jourCourt, numeroJour, formaterHeure } from '../format'
import { conflitsDansSelection } from '../moteur/conflits'
import type { SeanceFestival } from '../moteur/seances'

interface Props {
    selection: SeanceFestival[]
    onRetirer: (id: string) => void
    onVoirPlanning: () => void
}

export default function PanneauSelection({ selection, onRetirer, onVoirPlanning }: Props) {
    const conflits = conflitsDansSelection(selection)

    return (
        <section aria-labelledby="titre-selection">
            <h2 id="titre-selection" className="text-xl font-bold">
                Ma sélection · {selection.length}
            </h2>

            {selection.length === 0 ? (
                <p className="text-secondaire mt-3">Aucune séance pour le moment. Ajoutez-en depuis la liste.</p>
            ) : (
                <ul className="mt-3">
                    {selection.map((s) => (
                        <li key={s.id} className="flex items-start justify-between gap-2 border-b border-filet py-2">
                            <div className="min-w-0">
                                <p className="font-bold">
                                    {jourCourt(s.jour)} {numeroJour(s.jour)}
                                    {s.debutMin !== null && ` · ${formaterHeure(s.debutMin)}`}
                                </p>
                                <p className="text-secondaire text-[0.85rem] leading-snug">
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
            )}

            {conflits.length > 0 && (
                <p className="mt-3 font-bold">
                    {conflits.length} conflit{conflits.length > 1 ? 's' : ''} dans votre sélection.
                </p>
            )}

            <button
                type="button"
                onClick={onVoirPlanning}
                disabled={selection.length === 0}
                className="mt-4 min-h-11 w-full border-2 border-encre bg-encre px-3 font-bold text-papier disabled:border-dashed disabled:bg-papier disabled:text-secondaire"
            >
                Voir mon planning ›
            </button>
        </section>
    )
}
