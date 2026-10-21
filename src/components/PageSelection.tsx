import { formaterHeure, formaterPresence, jourLong } from '../format'
import { conflitsDansSelection } from '../moteur/conflits'
import type { SeanceFestival } from '../moteur/seances'

interface Props {
    selection: SeanceFestival[]
    onRetirer: (id: string) => void
    onVider: () => void
    onRetour: () => void
}

export default function PageSelection({ selection, onRetirer, onVider, onRetour }: Props) {
    const conflits = conflitsDansSelection(selection)

    const parJour = new Map<string, SeanceFestival[]>()
    for (const s of selection) parJour.set(s.jour, [...(parJour.get(s.jour) ?? []), s])

    return (
        <div className="mx-auto max-w-3xl px-4 py-6">
            <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
                <button type="button" onClick={onRetour} className="min-h-11 border-2 border-encre px-3 font-bold">
                    ‹ Retour au programme
                </button>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => window.print()}
                        disabled={selection.length === 0}
                        className="min-h-11 border-2 border-encre bg-encre px-3 font-bold text-papier disabled:border-dashed disabled:bg-papier disabled:text-secondaire"
                    >
                        Imprimer
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            if (window.confirm('Vider toute votre sélection ?')) onVider()
                        }}
                        disabled={selection.length === 0}
                        className="min-h-11 border-2 border-encre px-3 font-bold disabled:border-dashed disabled:text-secondaire"
                    >
                        Tout retirer
                    </button>
                </div>
            </div>

            <h2 className="mt-6 text-3xl font-bold">Mon planning</h2>
            <p className="text-secondaire mt-1">
                Arras Film Festival · du 6 au 15 novembre 2026 · projet non officiel
            </p>

            {selection.length === 0 && (
                <p className="mt-8">Votre sélection est vide. Ajoutez des séances depuis le programme.</p>
            )}

            {conflits.length > 0 && (
                <div className="mt-6 border-2 border-encre p-3">
                    <p className="font-bold">À vérifier</p>
                    <ul className="mt-1 list-disc pl-5">
                        {conflits.map((c) => (
                            <li key={`${c.a.id}-${c.b.id}`}>
                                {c.type === 'chevauche' ? 'Chevauchement' : 'Peu de temps'} entre {c.a.evenement.titre} et{' '}
                                {c.b.evenement.titre}.
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {[...parJour.entries()].map(([jour, seances]) => (
                <section key={jour} className="mt-8">
                    <h3 className="border-b-2 border-encre pb-1 text-xl font-bold">{jourLong(jour)}</h3>
                    <ul>
                        {seances.map((s) => (
                            <li key={s.id} className="flex items-start justify-between gap-3 border-b border-filet py-3">
                                <div className="min-w-0">
                                    <p className="font-bold">
                                        {s.debutMin === null
                                            ? 'Heure à confirmer'
                                            : `${formaterHeure(s.debutMin)}${s.finMin !== null && !s.dureeEstimee ? ` – ${formaterHeure(s.finMin)}` : ''}`}{' '}
                                        · {s.evenement.titre}
                                    </p>
                                    <p className="text-secondaire text-[0.85rem]">
                                        {s.seance.lieu ?? 'Lieu à confirmer'}
                                        {s.seance.presence && ` · En présence ${formaterPresence(s.seance.presence)}`}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => onRetirer(s.id)}
                                    className="min-h-11 shrink-0 border-2 border-encre px-3 font-bold print:hidden"
                                >
                                    Retirer
                                </button>
                            </li>
                        ))}
                    </ul>
                </section>
            ))}

            <p className="text-secondaire mt-10 text-[0.85rem] print:mt-6">
                Les horaires sont à vérifier auprès du festival. Réservation et billetterie :
                arrasfilmfestival.com.
            </p>
        </div>
    )
}
