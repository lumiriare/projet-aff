import { formaterHeure, formaterPresence } from '../format'
import { conflitsAvec } from '../moteur/conflits'
import type { SeanceFestival } from '../moteur/seances'

interface Props {
    seances: SeanceFestival[]
    selection: SeanceFestival[]
    nomSection: Map<string, string>
    onBasculer: (seance: SeanceFestival) => void
}

interface Groupe {
    cle: string
    titre: string
    seances: SeanceFestival[]
}

function grouperParHeure(seances: SeanceFestival[]): Groupe[] {
    const groupes: Groupe[] = []
    for (const s of seances) {
        const cle = s.debutMin === null ? 'sans-heure' : String(s.debutMin)
        const dernier = groupes[groupes.length - 1]
        if (dernier && dernier.cle === cle) dernier.seances.push(s)
        else {
            groupes.push({
                cle,
                titre: s.debutMin === null ? 'Heure à confirmer' : formaterHeure(s.debutMin),
                seances: [s],
            })
        }
    }
    return groupes
}

export default function ListeJour({ seances, selection, nomSection, onBasculer }: Props) {
    const idsChoisis = new Set(selection.map((s) => s.id))

    return (
        <div>
            {grouperParHeure(seances).map((groupe) => (
                <section key={groupe.cle} aria-label={groupe.titre}>
                    <h3 className="bg-fond-leger px-4 py-1.5 text-lg font-bold">{groupe.titre}</h3>
                    <ul>
                        {groupe.seances.map((s) => {
                            const ajoutee = idsChoisis.has(s.id)
                            const conflits = ajoutee ? [] : conflitsAvec(s, selection)
                            const chevauche = conflits.find((c) => c.type === 'chevauche')
                            const juste = conflits.find((c) => c.type === 'trop_juste')
                            const e = s.evenement
                            const duree = s.seance.duree_min ?? e.duree_min

                            return (
                                <li
                                    key={s.id}
                                    className="flex items-center justify-between gap-4 border-b border-filet px-4 py-3"
                                >
                                    <div className="min-w-0 flex-1">
                                        <h4 className="text-lg font-bold leading-snug">
                                            <a
                                                href={e.lien_officiel}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="underline decoration-transparent underline-offset-4 hover:decoration-current"
                                            >
                                                {e.titre}
                                            </a>
                                        </h4>
                                        <p className="text-secondaire text-[0.85rem] leading-snug">
                                            {[
                                                s.seance.lieu ?? 'Lieu à confirmer',
                                                duree ? formaterHeure(duree) : null,
                                                nomSection.get(e.section),
                                                e.type === 'after' ? 'Entrée gratuite' : null,
                                            ]
                                                .filter(Boolean)
                                                .join(' · ')}
                                        </p>
                                        {s.seance.presence && (
                                            <p className="text-secondaire text-[0.85rem] leading-snug">
                                                En présence {formaterPresence(s.seance.presence)}
                                            </p>
                                        )}
                                        {s.seance.statut === 'a_verifier' && (
                                            <p className="text-[0.85rem] font-bold">Horaire à vérifier</p>
                                        )}
                                        {chevauche && (
                                            <p className="text-[0.85rem] font-bold">
                                                Chevauche {chevauche.avec.evenement.titre}
                                            </p>
                                        )}
                                        {juste && (
                                            <p className="text-[0.85rem] font-bold">
                                                Peu de temps avec {juste.avec.evenement.titre}
                                            </p>
                                        )}
                                    </div>

                                    <button
                                        type="button"
                                        disabled={Boolean(chevauche)}
                                        aria-pressed={ajoutee}
                                        aria-label={
                                            ajoutee
                                                ? `Retirer ${e.titre} de ma sélection`
                                                : `Ajouter ${e.titre} à ma sélection`
                                        }
                                        onClick={() => onBasculer(s)}
                                        className={[
                                            'min-h-11 w-28 shrink-0 border-2 border-encre px-1 font-bold whitespace-nowrap',
                                            ajoutee ? 'bg-encre text-papier' : 'bg-papier text-encre',
                                            chevauche ? 'border-dashed text-secondaire' : '',
                                        ].join(' ')}
                                    >
                                        {ajoutee ? '✓ Ajouté' : chevauche ? 'Chevauche' : '+ Ajouter'}
                                    </button>
                                </li>
                            )
                        })}
                    </ul>
                </section>
            ))}
        </div>
    )
}
