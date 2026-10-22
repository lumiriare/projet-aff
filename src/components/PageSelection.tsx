import { useState, type ReactNode } from 'react'
import { formaterHeure, formaterPresence, jourLong } from '../format'
import { conflitsDansSelection } from '../moteur/conflits'
import { texteDuPlanning } from '../moteur/planning'
import type { SeanceFestival } from '../moteur/seances'

interface Props {
    selection: SeanceFestival[]
    onRetirer: (id: string) => void
    onVider: () => void
    onRetour: () => void
    bloc?: ReactNode // affiché sous le titre (films à voir et planning automatique)
}

export default function PageSelection({ selection, onRetirer, onVider, onRetour, bloc }: Props) {
    const conflits = conflitsDansSelection(selection)
    const [message, setMessage] = useState('')
    const peutPartager = typeof navigator !== 'undefined' && typeof navigator.share === 'function'

    // « Imprimer » ne fait rien dans le navigateur intégré à une application (messagerie, réseau social…) :
    // « Partager » (ou « Copier ») donne le planning en texte, utilisable partout
    async function partager() {
        const texte = texteDuPlanning(selection)
        try {
            if (peutPartager) {
                await navigator.share({ title: 'Mon planning – Arras Film Festival', text: texte })
            } else {
                await navigator.clipboard.writeText(texte)
                setMessage('Planning copié : collez-le dans un message ou une note.')
            }
        } catch (erreur) {
            if (!(erreur instanceof DOMException && erreur.name === 'AbortError')) {
                setMessage("Le partage n'a pas fonctionné. Réessayez, ou imprimez la page.")
            }
        }
    }

    const parJour = new Map<string, SeanceFestival[]>()
    for (const s of selection) parJour.set(s.jour, [...(parJour.get(s.jour) ?? []), s])

    return (
        <main className="mx-auto max-w-3xl px-4 py-6">
            <div className="grid grid-cols-2 gap-2 print:hidden sm:flex sm:flex-wrap">
                <button
                    type="button"
                    onClick={onRetour}
                    className="col-span-2 min-h-11 border-2 border-encre px-3 font-bold sm:mr-auto"
                >
                    ‹ Retour au programme
                </button>
                <button
                    type="button"
                    onClick={() => window.print()}
                    disabled={selection.length === 0}
                    className="min-h-11 w-full border-2 border-encre bg-encre px-3 font-bold text-papier disabled:border-dashed disabled:bg-papier disabled:text-secondaire sm:w-auto"
                >
                    Imprimer
                </button>
                <button
                    type="button"
                    onClick={partager}
                    disabled={selection.length === 0}
                    className="min-h-11 w-full border-2 border-encre px-3 font-bold disabled:border-dashed disabled:text-secondaire sm:w-auto"
                >
                    {peutPartager ? 'Partager' : 'Copier'}
                </button>
            </div>
            {message && (
                <p role="status" className="mt-2 font-bold print:hidden">
                    {message}
                </p>
            )}
            <p className="text-secondaire mt-2 text-[0.9rem] print:hidden">
                Si « Imprimer » ne répond pas (c'est le cas dans le navigateur intégré à une application), ouvrez le
                site dans Safari ou Chrome, ou utilisez « {peutPartager ? 'Partager' : 'Copier'} ».
            </p>

            <h2 className="mt-6 text-3xl font-bold">Mon planning</h2>
            <p className="text-secondaire mt-1">
                Arras Film Festival · du 6 au 15 novembre 2026 · projet non officiel
            </p>

            {bloc}

            {selection.length === 0 && (
                <p className="mt-8">Aucune séance choisie pour le moment. Ajoutez-en depuis le programme, ou proposez un planning à partir de vos films à voir.</p>
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
                                    <p className="text-secondaire text-[0.9rem]">
                                        {s.seance.lieu ?? 'Lieu à confirmer'}
                                        {s.evenement.type === 'after' && ' · Entrée gratuite'}
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

            {selection.length > 0 && (
                <button
                    type="button"
                    onClick={() => {
                        if (window.confirm('Vider toute votre sélection ?')) onVider()
                    }}
                    className="mt-8 min-h-11 border-2 border-encre px-3 font-bold print:hidden"
                >
                    Tout retirer
                </button>
            )}

            <p className="text-secondaire mt-10 text-[0.9rem] print:mt-6">
                Les horaires sont à vérifier auprès du festival. Réservation et billetterie :
                <a href="https://www.arrasfilmfestival.com" target="_blank" rel="noopener noreferrer" className="text-encre underline">
                    arrasfilmfestival.com
                </a>
            </p>
        </main>
    )
}
