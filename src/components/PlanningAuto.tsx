import { useMemo, useState } from 'react'
import { formaterHeure, jourCourt, numeroJour } from '../format'
import { aDesDispo, type Dispo } from '../moteur/dispo'
import { proposerPlannings, type Plan } from '../moteur/planning'
import type { SeanceFestival } from '../moteur/seances'
import type { Evenement } from '../types'

interface Props {
    films: Evenement[]
    seancesParEvenement: Map<string, SeanceFestival[]>
    selection: SeanceFestival[]
    dispos: Dispo
    onRetirerFilm: (id: string) => void
    onAjouterSeances: (ids: string[]) => void
    proposerAuto?: boolean // arrive depuis « Proposer un planning » : on affiche tout de suite les propositions
}

function titreCriteres(plan: Plan): string {
    if (plan.criteres.length > 1) return 'Le moins de jours et de déplacements'
    return plan.criteres[0] === 'peu_de_jours' ? 'Le moins de jours' : 'Le moins de déplacements'
}

export default function PlanningAuto({ films, seancesParEvenement, selection, dispos, onRetirerFilm, onAjouterSeances, proposerAuto = false }: Props) {
    const [propose, setPropose] = useState(proposerAuto)

    const plans = useMemo(
        () => (propose ? proposerPlannings({ films, seancesParEvenement, fixes: selection, dispos }) : null),
        [propose, films, seancesParEvenement, selection, dispos],
    )

    return (
        <section aria-labelledby="titre-a-voir" className="mt-6 border-2 border-encre p-4 print:hidden">
            <h3 id="titre-a-voir" className="text-xl font-bold">
                Films à voir · {films.length}
            </h3>

            {films.length === 0 ? (
                <p className="text-secondaire mt-2">
                    Aucun film pour le moment. Dans « Par thème », cliquez sur « À voir » sur les films qui vous
                    intéressent, puis revenez ici : le site vous propose un planning.
                </p>
            ) : (
                <>
                    <ul className="mt-2">
                        {films.map((f) => {
                            const dejaPlace = selection.some((s) => s.evenement.id === f.id)
                            const avecHeure = (seancesParEvenement.get(f.id) ?? []).filter((s) => s.debutMin !== null).length
                            return (
                                <li key={f.id} className="flex items-center justify-between gap-3 border-b border-filet py-2">
                                    <div className="min-w-0">
                                        <p className="font-bold">{f.titre}</p>
                                        <p className="text-secondaire text-[0.9rem]">
                                            {dejaPlace
                                                ? 'Déjà dans votre sélection'
                                                : avecHeure === 0
                                                  ? 'Horaire non publié : à choisir à la main'
                                                  : `${avecHeure} séance${avecHeure > 1 ? 's' : ''}`}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        aria-label={`Retirer ${f.titre} de mes films à voir`}
                                        onClick={() => onRetirerFilm(f.id)}
                                        className="min-h-11 min-w-11 shrink-0 border-2 border-encre font-bold"
                                    >
                                        ✕
                                    </button>
                                </li>
                            )
                        })}
                    </ul>

                    {aDesDispo(dispos) && (
                        <p className="text-secondaire mt-2 text-[0.9rem]">
                            Seuls vos moments libres (« Je suis libre ») sont utilisés.
                        </p>
                    )}

                    <button
                        type="button"
                        onClick={() => setPropose(true)}
                        className="mt-3 min-h-11 w-full border-2 border-encre bg-encre px-3 font-bold text-papier"
                    >
                        Proposer un planning
                    </button>
                </>
            )}

            {plans !== null && (
                <div className="mt-4" aria-live="polite">
                    {plans.length === 0 ? (
                        <p className="font-bold">Ces films sont déjà dans votre sélection.</p>
                    ) : (
                        plans.map((plan, i) => (
                            <article key={plan.seances.map((s) => s.id).join('+') || `vide-${i}`} className="mt-3 border-2 border-encre p-3">
                                <h4 className="font-bold">
                                    Proposition {i + 1} · {titreCriteres(plan)}
                                </h4>
                                <p className="text-secondaire text-[0.9rem]">
                                    {plan.nbJours} jour{plan.nbJours > 1 ? 's' : ''} · {plan.nbDeplacements} déplacement
                                    {plan.nbDeplacements > 1 ? 's' : ''}
                                </p>

                                {plan.seances.length === 0 ? (
                                    <p className="mt-2 font-bold">Aucune combinaison possible avec votre sélection actuelle.</p>
                                ) : (
                                    <ul className="mt-2">
                                        {plan.seances.map((s) => (
                                            <li key={s.id} className="py-1">
                                                <strong>
                                                    {jourCourt(s.jour)} {numeroJour(s.jour)}
                                                    {s.debutMin !== null && ` · ${formaterHeure(s.debutMin)}`}
                                                </strong>{' '}
                                                {s.evenement.titre} · {s.seance.lieu ?? 'Lieu à confirmer'}
                                            </li>
                                        ))}
                                    </ul>
                                )}

                                {plan.sansPlace.length > 0 && (
                                    <p className="mt-2 font-bold">
                                        Pas de place pour : {plan.sansPlace.map((f) => f.titre).join(', ')}
                                    </p>
                                )}

                                {plan.seances.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            onAjouterSeances(plan.seances.map((s) => s.id))
                                            setPropose(false)
                                        }}
                                        className="mt-3 min-h-11 border-2 border-encre bg-encre px-3 font-bold text-papier"
                                    >
                                        Choisir cette proposition
                                    </button>
                                )}
                            </article>
                        ))
                    )}
                </div>
            )}
        </section>
    )
}
