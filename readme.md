# Programme interactif - Arras Film Festival

> **Projet de bénévole, indépendant et non officiel.** 

Tout d'abord, je précise que ce site n'est pas affilié à l'association Plan-Séquence ni à l'Arras Film Festival. Toutes les informations renvoient vers le [site officiel](https://www.arrasfilmfestival.com/).

J'ai décidé de développer ça après une discussion avec des amis, sur à quel point la réservation pendant la période du festival peut être compliquée. J'ai donc eu l'idée d'un site pour permettre d'optimiser cette réservation.

## Ce que le site permet (prévu)

- Parcourir le programme par thématique, jour, lieu ou mot-clé.
- Ouvrir la fiche d'un film (infos, bande-annonce, présence de l'équipe ou d'invités).
- Composer sa sélection de films et obtenir des **plannings sans conflit**, avec le moins de déplacements possible.
- Indiquer **ses disponibilités** pour ne voir que les séances compatibles.
- Imprimer ou partager son planning.
- Être renvoyé vers la billetterie officielle pour réserver.

Pas de compte, pas de collecte de données personnelles : la sélection reste dans le navigateur.

## État du projet

- Statut actuel : en cadrage (10/10/2026). 
- Cahier des charges rédigé
- Modèle de données rédigé

## Documentation

| Document | Contenu |
|---|---|
| [`docs/cahier-des-charges.md`](docs/cahier-des-charges.md) | Objectifs, périmètre, user stories, exigences, planning, risques |
| [`docs/donnees.md`](docs/donnees.md) | Sources, modèle de données, qualité, mise à jour |

## Stack prévue

- **Site** : Vite, React, TypeScript et Tailwind CSS
- **Données** : fichiers JSON générés par un script de collecte
- **Moteur de filtre et de planning** : TypeScript pur, exécuté dans le navigateur
- **Hébergement** : Codeberg Pages (site statique)

## Données et droits

Le code de ce dépôt est open-source. **Les contenus du festival (synopsis, affiches, textes, photos) appartiennent à leurs auteurs** et ne sont pas redistribués ici : le site renvoie vers les pages officielles. 


## Licence

À définir (une licence pour le code sera ajoutée dans un fichier `LICENSE`). Elle ne couvre pas les contenus du festival.