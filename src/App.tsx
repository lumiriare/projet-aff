import { useMemo, useState } from 'react'
import programmeJson from '../data/programme.json'
import PanneauFiltres, { FILTRES_VIDES, type Filtres } from './components/Filtres'
import GrilleDispo from './components/GrilleDispo'
import ListeJour from './components/ListeJour'
import PageSelection from './components/PageSelection'
import PanneauSelection from './components/PanneauSelection'
import { JOURS_FESTIVAL, jourCourt, jourLong, normaliser, numeroJour } from './format'
import { useDispo } from './hooks/useDispo'
import { useSelection } from './hooks/useSelection'
import { aDesDispo, estLibre } from './moteur/dispo'
import { aplatir, type SeanceFestival } from './moteur/seances'
import type { Evenement, Programme } from './types'

const programme = programmeJson as Programme
const TOUTES_LES_SEANCES = aplatir(programme)
const SEANCES_PAR_ID = new Map(TOUTES_LES_SEANCES.map((s) => [s.id, s]))
const LIEUX = [...new Set(TOUTES_LES_SEANCES.map((s) => s.seance.lieu).filter((l): l is string => l !== null))].sort()
const NOM_SECTION = new Map(programme.sections.map((s) => [s.id, s.nom]))

type Vue = 'programme' | 'selection'

export default function App() {
    const [vue, setVue] = useState<Vue>('programme')
    const [filtres, setFiltres] = useState<Filtres>(FILTRES_VIDES)
    const [jour, setJour] = useState(
        () => JOURS_FESTIVAL.find((j) => TOUTES_LES_SEANCES.some((s) => s.jour === j)) ?? JOURS_FESTIVAL[0],
    )
    const { ids, ajouter, retirer, vider } = useSelection()
    const { dispos, basculer: basculerDispo, effacer: effacerDispos } = useDispo()
    const dispoActives = aDesDispo(dispos)

    const selection = useMemo(
        () =>
            ids
                .map((id) => SEANCES_PAR_ID.get(id))
                .filter((s): s is SeanceFestival => s !== undefined)
                .sort((a, b) => a.jour.localeCompare(b.jour) || (a.debutMin ?? -1) - (b.debutMin ?? -1)),
        [ids],
    )

    // Un film correspond aux filtres de thème et de recherche ?
    const correspond = useMemo(() => {
        const sectionsChoisies = new Set([
            ...filtres.sections,
            ...programme.sections.filter((s) => s.parent && filtres.sections.includes(s.parent)).map((s) => s.id),
        ])
        const termes = normaliser(filtres.recherche.trim())
        return (e: Evenement) =>
            (filtres.sections.length === 0 || sectionsChoisies.has(e.section)) &&
            (!termes || normaliser([e.titre, ...e.realisation, ...e.pays].join(' ')).includes(termes))
    }, [filtres.sections, filtres.recherche])

    const seancesFiltrees = useMemo(
        () =>
            TOUTES_LES_SEANCES.filter(
                (s) =>
                    correspond(s.evenement) &&
                    (filtres.lieux.length === 0 || (s.seance.lieu !== null && filtres.lieux.includes(s.seance.lieu))) &&
                    (!dispoActives || estLibre(s, dispos)),
            ),
        [correspond, filtres.lieux, dispoActives, dispos],
    )
    const joursAvecSeances = new Set(seancesFiltrees.map((s) => s.jour))
    const seancesDuJour = seancesFiltrees.filter((s) => s.jour === jour)
    const sansSeance = programme.evenements.filter((e) => e.seances.length === 0 && correspond(e))

    function basculer(s: SeanceFestival) {
        if (ids.includes(s.id)) retirer(s.id)
        else ajouter(s.id)
    }

    return (
        <div className="min-h-screen pb-24 lg:pb-0">
            <header className="border-b-2 border-encre print:hidden">
                <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
                    <p className="text-xl font-bold">AFF - Programme Interactif</p>
                    <nav aria-label="Navigation principale" className="flex gap-2">
                        <button
                            type="button"
                            aria-current={vue === 'programme' ? 'page' : undefined}
                            onClick={() => setVue('programme')}
                            className={`min-h-11 border-2 border-encre px-3 font-bold ${vue === 'programme' ? 'bg-encre text-papier' : ''}`}
                        >
                            Programme
                        </button>
                        <button
                            type="button"
                            aria-current={vue === 'selection' ? 'page' : undefined}
                            onClick={() => setVue('selection')}
                            className={`min-h-11 border-2 border-encre px-3 font-bold ${vue === 'selection' ? 'bg-encre text-papier' : ''}`}
                        >
                            Ma sélection · {selection.length}
                        </button>
                    </nav>
                </div>
            </header>

            {vue === 'selection' ? (
                <PageSelection
                    selection={selection}
                    onRetirer={retirer}
                    onVider={vider}
                    onRetour={() => setVue('programme')}
                />
            ) : (
                <main className="mx-auto grid max-w-7xl lg:grid-cols-[16rem_minmax(0,1fr)_19rem]">
                    <aside className="hidden border-r-2 border-encre p-4 lg:block">
                        <PanneauFiltres
                            filtres={filtres}
                            sections={programme.sections}
                            lieux={LIEUX}
                            onChange={setFiltres}
                        />
                        <div className="mt-6 border-t-2 border-encre pt-4">
                            <GrilleDispo
                                dispos={dispos}
                                nbSeancesPossibles={seancesFiltrees.length}
                                onBasculer={basculerDispo}
                                onEffacer={effacerDispos}
                            />
                        </div>
                    </aside>

                    <div className="min-w-0">
                        <details className="border-b border-filet px-4 py-3 lg:hidden">
                            <summary className="min-h-11 cursor-pointer font-bold">
                                Filtrer le programme{dispoActives ? ' · je suis libre' : ''}
                            </summary>
                            <div className="pt-3">
                                <PanneauFiltres
                                    filtres={filtres}
                                    sections={programme.sections}
                                    lieux={LIEUX}
                                    onChange={setFiltres}
                                />
                                <div className="mt-5 border-t-2 border-encre pt-4">
                                    <GrilleDispo
                                    dispos={dispos}
                                    nbSeancesPossibles={seancesFiltrees.length}
                                    onBasculer={basculerDispo}
                                    onEffacer={effacerDispos}
                            />
                                </div>
                            </div>
                        </details>

                        <div
                            role="group"
                            aria-label="Choisir un jour"
                            className="flex gap-1.5 overflow-x-auto border-b border-filet px-4 py-3"
                        >
                            {JOURS_FESTIVAL.map((j) => (
                                <button
                                    key={j}
                                    type="button"
                                    aria-pressed={j === jour}
                                    aria-label={jourLong(j)}
                                    onClick={() => setJour(j)}
                                    className={`min-h-11 min-w-14 shrink-0 border-2 border-encre px-1 leading-tight font-bold ${j === jour ? 'bg-encre text-papier' : ''} ${joursAvecSeances.has(j) ? '' : 'border-dashed text-secondaire'}`}
                                >
                                    {jourCourt(j)}
                                    <br />
                                    {numeroJour(j)}
                                </button>
                            ))}
                        </div>

                        <div className="px-4 pt-4 pb-2">
                            <h2 className="text-2xl font-bold">{jourLong(jour)}</h2>
                            <p className="text-secondaire" aria-live="polite">
                                {seancesDuJour.length} séance{seancesDuJour.length > 1 ? 's' : ''}
                            </p>
                        </div>

                        {seancesDuJour.length === 0 ? (
                            <p className="px-4 py-6">
                                Aucune séance publiée ce jour-là{dispoActives ? ' dans vos disponibilités' : filtres.sections.length + filtres.lieux.length > 0 || filtres.recherche ? ' avec ces filtres' : ''}.
                            </p>
                        ) : (
                            <ListeJour
                                seances={seancesDuJour}
                                selection={selection}
                                nomSection={NOM_SECTION}
                                onBasculer={basculer}
                            />
                        )}

                        {sansSeance.length > 0 && (
                            <details className="border-t-2 border-encre px-4 py-3">
                                <summary className="min-h-11 cursor-pointer font-bold">
                                    Horaires à venir · {sansSeance.length} film{sansSeance.length > 1 ? 's' : ''}
                                </summary>
                                <ul className="mt-2">
                                    {sansSeance.map((e) => (
                                        <li key={e.id} className="py-1">
                                            <a
                                                href={e.lien_officiel}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="underline underline-offset-4"
                                            >
                                                {e.titre}
                                            </a>
                                            <span className="text-secondaire"> · {NOM_SECTION.get(e.section)}</span>
                                        </li>
                                    ))}
                                </ul>
                            </details>
                        )}
                    </div>

                    <aside className="hidden border-l-2 border-encre p-4 lg:block">
                        <div className="sticky top-4">
                            <PanneauSelection
                                selection={selection}
                                onRetirer={retirer}
                                onVoirPlanning={() => setVue('selection')}
                            />
                        </div>
                    </aside>
                </main>
            )}

            {vue === 'programme' && (
                <div className="fixed inset-x-0 bottom-0 flex items-center justify-between gap-3 border-t-2 border-encre bg-papier px-4 py-3 lg:hidden">
                    <span>
                        <strong>{selection.length}</strong> séance{selection.length > 1 ? 's' : ''} choisie
                        {selection.length > 1 ? 's' : ''}
                    </span>
                    <button
                        type="button"
                        onClick={() => setVue('selection')}
                        className="min-h-11 border-2 border-encre bg-encre px-3 font-bold text-papier"
                    >
                        Voir mon planning ›
                    </button>
                </div>
            )}

            <footer className="text-secondaire border-t-2 border-encre px-4 py-4 text-[0.85rem] print:hidden">
                Ce programme interactif est un projet bénévole indépendant et non officiel. Les informations du programme
                sont à vérifier auprès du festival.
            </footer>
        </div>
    )
}
