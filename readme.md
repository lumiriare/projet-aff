# Programme interactif - Arras Film Festival

> **Projet de bénévole, indépendant et non officiel.** 

Tout d'abord, je précise que ce site n'est pas affilié à l'association Plan-Séquence ni à l'Arras Film Festival. Toutes les informations renvoient vers le [site officiel](https://www.arrasfilmfestival.com/).

J'ai décidé de développer ça après une discussion avec des amis, sur à quel point la réservation pendant la période du festival peut être compliquée. J'ai donc eu l'idée d'un site pour permettre d'optimiser cette réservation.

**Le site : https://lumiriare.codeberg.page/projet-aff/** (adresse provisoire)

## Ce que le site permet (prévu)

- Parcourir le programme **jour par jour** ou **par thème** (17 sections), avec recherche et filtres par lieu
- Voir pour chaque séance l'heure, le lieu, la durée, la présence d'invités et, pour les afters, l'entrée gratuite
- Choisir ses séances : le site signale celles qui **se chevauchent** ou qui laissent trop peu de temps pour changer de lieu
- Marquer des films **« À voir »** : le site propose un **planning sans conflit** (le moins de jours, le moins de déplacements)
- Indiquer **ses disponibilités** (jours et moments de la journée) pour ne voir que les séances compatibles
- Garder son planning : **imprimer**, ou **partager / copier en texte** depuis un téléphone

Pas de compte, pas de collecte de données personnelles : la sélection reste dans le navigateur

## État du projet

- Statut actuel : en phase de tests (22/10/2026). 
- Site en ligne, version de test, testé sur ordinateur et téléphone
- Données collectées automatiquement depuis les pages publiques du festival (122 films et événements, 17 sections, 5 lieux)
- Tests automatiques du moteur de planning et de la lecture des fiches, audit d'accessibilité automatique réalisé
- Reste à faire : lien partageable du planning, calendrier interactif (ordinateur), essais avec des spectateurs

## Documentation

| Document | Contenu |
|---|---|
| [`docs/cahier-des-charges.md`](docs/cahier-des-charges.md) | Objectifs, périmètre, user stories, exigences, planning, risques |
| [`docs/donnees.md`](docs/donnees.md) | Sources, modèle de données, qualité, mise à jour |
| [`docs/guide-exploitation.md`](docs/guide-exploitation.md) | Mettre à jour les horaires, lire le rapport, publier, dépanner |

## Stack
 
- **Site** : Vite, React, TypeScript et Tailwind CSS
- **Données** : fichiers JSON générés par un script de collecte (Node, Playwright)
- **Moteur de filtre et de planning** : TypeScript pur, exécuté dans le navigateur
- **Hébergement** : Codeberg Pages (site statique)

## Développement
 
```powershell
npm install        # une seule fois
npm run dev        # lancer le site en local
npm test           # lancer les tests
npm run collecte   # relire le programme sur le site du festival
npm run build      # construire le site
```

## Données et droits

Le code de ce dépôt est open-source. **Les contenus du festival (synopsis, affiches, textes, photos) appartiennent à leurs auteurs** et ne sont pas redistribués ici : le site renvoie vers les pages officielles. 


## Licence

À définir (une licence pour le code sera ajoutée dans un fichier `LICENSE`). Elle ne couvre pas les contenus du festival.