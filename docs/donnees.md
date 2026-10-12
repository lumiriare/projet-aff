# Données
 
Ce document décrit d'où viennent les données du site, comment elles sont structurées, comment on les garde fiables,...
 
## 1 – Sources
 
Toutes les données proviennent du site officiel de l'Arras Film Festival (édition 2026) :
 
| Source | Contenu |
|---|---|
| Page « Les films et les invités de l'édition 2026 » | Liste des films et événements, section de chacun, lien vers sa fiche |
| Fiche de chaque film | Titre, section, réalisateur, pays, année, durée, version, casting, synopsis (FR et EN), séance(s) en texte libre, fiche technique, affiche |
| Page « Les invités 2026 » | Nom, métiers, nationalité, photo et lien de chaque invité |
| Fiche de chaque invité | Détails à explorer (non analysée à ce jour) |
 
À compléter lorsque les infos seront disponibles : lieux et salles, temps de trajet entre lieux,...

Règle : seul le contenu affiché publiquement est utilisé. Certaines fiches contiennent du texte présent dans le code de la page mais masqué à l'écran (séance, invité). Ce texte n'est pas publié, il est donc ignoré. Les séances viendront du calendrier officiel une fois publié.
 
## 2 – Modèle de données
 
### Film
 
| Champ | Type | Remarque |
|---|---|---|
| `id` | texte | Identifiant stable, par exemple `dua` |
| `titre` | texte | |
| `sections` | liste de textes | Un film peut appartenir à plusieurs sections |
| `realisation` | liste de textes | |
| `pays` | liste de textes | |
| `annee` | nombre | |
| `duree_min` | nombre | Sert à calculer la fin d'une séance |
| `version` | texte | Par exemple `vostf` |
| `lien_officiel` | URL | Page de la fiche sur le site du festival |
| `bande_annonce` | URL ou vide | Saisie manuelle |
 
Les contenus protégés (synopsis, affiche, casting détaillé) ne sont pas versionnés dans le dépôt. 
 
### Séance
 
| Champ | Type | Remarque |
|---|---|---|
| `film` | `id` du film | |
| `debut` | date et heure | Format ISO, par exemple `2026-11-15T10:30` |
| `lieu` | `id` du lieu | |
| `salle` | texte ou vide | Souvent absent de la fiche |
| `invites` | liste d'`id` d'invités | Présences annoncées |
| `statut` | `ok` ou `a_verifier` | Posé par les contrôles de qualité |
| `raison` | texte ou vide | Motif si `a_verifier` |
 
### Invité
 
| Champ | Type | Remarque |
|---|---|---|
| `id` | texte | Basé sur le nom affiché, pas sur l'adresse de la page |
| `nom` | texte | |
| `metiers` | liste de textes | Par exemple `acteur`, `réalisateur` |
| `nationalite` | texte | |
| `invite_d_honneur` | booléen | |
| `lien_officiel` | URL | |
 
### Lieu
 
| Champ | Type | Remarque |
|---|---|---|
| `id` | texte | Par exemple `casino-arras` |
| `nom`, `adresse` | texte | |
| `trajets_min` | table `id` du lieu → minutes | Saisie manuelle |
 
### Section
 
| Champ | Type | Remarque |
|---|---|---|
| `id`, `nom` | texte | |
| `parent` | `id` de section ou vide | Par exemple Toiles de maîtres sous les avant-premières |
 
## 3 – Exemple
 
Exemple illustratif d'un film (informations affichées sur sa fiche) et d'une séance **fictive**, car le calendrier officiel n'est pas encore publié.
 
```json
{
  "film": {
    "id": "dua",
    "titre": "DUA",
    "sections": ["visions-de-l-est"],
    "realisation": ["Blerta Basholli"],
    "pays": ["Kosovo", "Suisse"],
    "annee": 2026,
    "duree_min": 101,
    "version": "vostf",
    "lien_officiel": "https://www.arrasfilmfestival.com/blog/films-de-l-edition-2026/visions-de-l-est/dua.html",
    "bande_annonce": null
  },
  "seance_fictive": {
    "film": "exemple-film",
    "debut": "2026-11-08T14:00",
    "lieu": "lieu-exemple",
    "salle": null,
    "invites": [],
    "statut": "ok",
    "raison": null
  }
}
```
 
## 4 – Qualité des données
 
Constats faits lors de l'analyse du site officiel :
 
- Les adresses des pages ne correspondent pas toujours au titre ou au nom affiché (par exemple la page du film *Daens* a une adresse contenant `matewan-1`, celle d'une invitée contient le nom d'une autre) :  **l'identité d'un film ou d'un invité se base donc sur le contenu de la page, pas sur son adresse.**
- **Du contenu est masqué à l'affichage** : certaines fiches (par exemple celle de *Dua*) contiennent, dans le code de la page, une séance (jour, heure, lieu) et une mention d'invité qui n'apparaissent pas à l'écran. Ces informations ne sont pas publiées et semblent incohérentes (jour de la semaine qui ne correspond pas à la date, invitée absente de la liste officielle). Elles ne sont donc **pas utilisables** pour l'instant.
- À ce jour, les seules dates repérées sur la page programme sont celles de l'ouverture (6 novembre), de la clôture (15 novembre) et de la leçon de cinéma de Jean-Pierre Jeunet (13 novembre), à confirmer à l'écran.
- La liste des invités peut encore évoluer.


### Contrôles automatiques (rapport d'anomalies)
 
Pour l'instant, on peut signaler :
 
- des films sans durée, sans section ou sans séance exploitable
- du contenu présent dans le code mais masqué à l'affichage 
- des séances dont le jour de la semaine ne correspond pas à la date
- des séances en dehors des dates du festival
- des invités cités dans une séance mais absents de la liste officielle
- des doublons (même film sous deux sections, mêmes invités sous deux entrées)
- des titres ou adresses qui changent d'une collecte à l'autre.

## 5 – Mise à jour
 
1. **Collecter** : le script parcourt la page programme, les fiches films et les pages invités
2. **Normaliser** : extraction des champs du texte visible, lecture des séances une fois le calendrier officiel publié
3. **Valider** : contrôles de qualité et rapport d'anomalies
4. **Comparer** : rapport des différences avec la version précédente
5. **Publier** : génération des fichiers utilisés par le site.

### Bonnes pratiques de collecte (important !!)
 
- Extraire uniquement le **texte visible** (rendu dans un navigateur automatisé comme Playwright), jamais le contenu masqué
- Script identifiable (nom de projet et contact dans l'identifiant de requête)
- Pause entre les requêtes, pas de collecte parallèle massive
- Résultats bruts conservés localement (`data/raw/`), jamais dans le dépôt

## 6 – Arborescence prévue
 
```
data/
  raw/                # collecte brute (ignorée par Git)
  corrections.json    # corrections manuelles
  lieux.json          # lieux et temps de trajet (saisis à la main)
  programme.json      # faits : titres, durées, séances, liens
```