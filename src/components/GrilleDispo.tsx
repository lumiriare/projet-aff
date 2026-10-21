import { JOURS_FESTIVAL, jourCourt, jourLong, numeroJour } from '../format'
import { MOMENTS, aDesDispo, type Dispo, type Moment } from '../moteur/dispo'

interface Props {
    dispos: Dispo
    nbSeancesPossibles: number
    onBasculer: (jour: string, moment: Moment) => void
    onEffacer: () => void
}

// Replié par défaut : la grille ne s'ouvre que quand on veut dire quand on est libre,
// et le nombre de créneaux choisis reste visible quand elle est fermée
export default function GrilleDispo({ dispos, nbSeancesPossibles, onBasculer, onEffacer }: Props) {
    const actif = aDesDispo(dispos)
    const nbCreneaux = Object.values(dispos).reduce((n, moments) => n + moments.length, 0)

    return (
        <details className="group">
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 font-bold [&::-webkit-details-marker]:hidden">
                <span>Je suis libre</span>
                <span className="flex items-center gap-2">
                    {nbCreneaux > 0 && (
                        <span className="border-2 border-encre px-2 text-[0.85rem]">
                            {nbCreneaux} créneau{nbCreneaux > 1 ? 'x' : ''}
                        </span>
                    )}
                    <span aria-hidden="true" className="group-open:hidden">
                        +
                    </span>
                    <span aria-hidden="true" className="hidden group-open:inline">
                        −
                    </span>
                </span>
            </summary>

            <p className="text-secondaire text-[0.85rem] leading-snug">
                Touchez autant de cases que vous voulez : plusieurs jours, plusieurs moments.
            </p>

            <table className="mt-2 w-full border-separate border-spacing-1">
                <thead>
                    <tr>
                        <td />
                        {MOMENTS.map((m) => (
                            <th key={m.id} scope="col" className="text-[0.75rem] leading-tight font-bold">
                                {m.nom}
                                <br />
                                <span className="font-normal">{m.precision}</span>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {JOURS_FESTIVAL.map((jour) => (
                        <tr key={jour}>
                            <th scope="row" className="pr-1 text-left text-[0.85rem] font-bold whitespace-nowrap">
                                {jourCourt(jour)} {numeroJour(jour)}
                            </th>
                            {MOMENTS.map((m) => {
                                const choisi = (dispos[jour] ?? []).includes(m.id)
                                return (
                                    <td key={m.id}>
                                        <button
                                            type="button"
                                            aria-pressed={choisi}
                                            aria-label={`${jourLong(jour)}, ${m.nom.toLowerCase()} (${m.precision})`}
                                            onClick={() => onBasculer(jour, m.id)}
                                            className={`min-h-10 w-full border-2 border-encre font-bold ${choisi ? 'bg-encre text-papier' : 'bg-papier'}`}
                                        >
                                            {choisi ? '✓' : ''}
                                        </button>
                                    </td>
                                )
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>

            {actif && (
                <div className="mt-2 flex items-center justify-between gap-2">
                    <p aria-live="polite">
                        <strong>{nbSeancesPossibles}</strong> séance{nbSeancesPossibles > 1 ? 's' : ''} possible
                        {nbSeancesPossibles > 1 ? 's' : ''}
                    </p>
                    <button type="button" onClick={onEffacer} className="min-h-10 border-2 border-encre px-2 font-bold">
                        Tout effacer
                    </button>
                </div>
            )}
        </details>
    )
}