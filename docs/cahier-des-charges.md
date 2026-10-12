# Cahier des charges : Programme Interactif - Arras Film Festival
 
| | |
|---|---|
| **Version** | 0.1 (brouillon) |
| **Date** | 10 octobre 2026 |
| **Statut** | Projet de bénévole, non officiel |
| **Événement** | 27e édition, du 6 au 15 novembre 2026 |
| **Source de référence** | Ce fichier. Toute copie (PDF, Doc) est générée à partir de lui. |

## 1 – Introduction
 
### Objet
 
Ce document décrit le besoin, le périmètre et les exigences d'un site web pour aider les gens lors de leur réservation de séances pour l'Arras Film Festival. Il sert de référence commune pour concevoir, développer, tester et faire valider le projet.
 
### Objectifs
 
- Aider les spectateurs à s'y retrouver dans un programme dense (plusieurs cinémas, salles, thématiques et horaires)
- Leur permettre de composer leur propre planning de séances, sans conflit d'horaires et en prenant en compte les trajets 
- Donner de la visibilité au festival et au projet (partage, bouche-à-oreille)
- Proposer à l'équipe du festival un outil qu'elle pourra reprendre pour les prochaines éditions

### Périmètre
 
**Inclus :**
 
- Programme filtrable par thématique, jour, lieu et mot-clé (déjà effectué par le site de base)
- Fiches films et pages invités (déjà effectué par le site de base)
- Sélection de films (« ma sélection »), saisie de disponibilités et proposition de plannings
- Planning partageable et imprimable
- Renvoi vers la billetterie officielle

**Exclu :**
 
- Vente de billets ou paiement en ligne.
- Comptes utilisateurs et collecte de données personnelles.
- Application mobile native.

## 2 – Contexte

- Le festival est organisé par l'association Plan-Séquence à Arras. L'édition 2026 compte une centaine de films et événements répartis en une quinzaine de sections (compétition, rétrospectives, avant-premières, ciné-concerts, afters musicaux…) et une vingtaine d'invités.
- Le programme est complexe : plusieurs cinémas et salles à des endroits différents, et parfois plusieurs séances pour un même film.
- Le site officiel propose déjà un catalogue de films et d'invités filtrable par section, mais sans outil pour organiser ses séances
- Les spectateurs réservent surtout sur place, la réservation en ligne étant jugée compliquée par un public assez âgé
- Certaines fiches films contiennent des informations de séance dans du texte masqué (non affiché au public) : elles ne sont **pas** utilisées, car non publiées et potentiellement erronées
- Le projet est mené à titre bénévole et indépendant !! Il sera présenté à l'équipe du festival une fois opérationnel.

### Utilisateurs cibles
 
| Profil | Besoins |
|---|---|
| **Spectateur fidèle** (souvent 50 ans et plus) | Affichage lisible et simple, planning imprimable, réserve souvent au guichet |
| **Spectateur occasionnel** | Utilise surtout son téléphone, veut trouver vite quoi voir |
| **Famille** | Séances adaptées aux enfants (section « Festival en famille ») |
 
## 3 – Mise en place

### 3.1 Fonctionnalités
 
| Réf | Fonctionnalité | Description |
|---|---|---|
| F1 | Programme interactif | Calendrier et liste filtrables par thématique, jour, lieu et horaire |
| F2 | Fiche film | Informations, bande-annonce, mention de la présence de l'équipe |
| F3 | Ma sélection | L'utilisateur ajoute des films à un panier |
| F4 | Planning optimisé | À partir de la sélection, plannings sans conflit (même cinéma, même jour, trajets limités) |
| F5 | Disponibilités | L'utilisateur indique ses créneaux libres et ne voit que les séances compatibles |
| F6 | Partage et impression | Planning imprimable et partageable par lien |
| F7 | Pages invités | Invités liés aux films et aux séances |

### 3.2 User stories
 
Format habituel : *En tant que [profil], je veux [action] afin de [bénéfice].*


Priorités MoSCoW : **M** = indispensable, **S** = important, **C** = souhaitable.
 
Chaque story est suivie dans une issue GitHub. Cette liste reste la référence des critères.

#### Programme et recherche
 
- **US-01 (M)** En tant que spectateur, je veux parcourir le programme par thématique afin de découvrir les films d'une section (compétition, rétrospective…).
  - Critères : toutes les sections du site officiel sont proposées ; un film peut appartenir à plusieurs sections ; le nombre de résultats est affiché.
- **US-02 (M)** En tant que spectateur, je veux voir le programme jour par jour afin de savoir ce qui passe le jour où je viens.
  - Critères : une vue par jour du 6 au 15 novembre ; séances triées par heure ; lieu visible pour chaque séance.
- **US-03 (M)** En tant que spectateur, je veux filtrer par cinéma ou lieu afin de rester près de chez moi ou de mon point de chute.
- **US-04 (S)** En tant que spectateur, je veux rechercher par titre, réalisateur ou acteur afin de retrouver rapidement un film.
- **US-05 (S)** En tant que spectateur, je veux combiner plusieurs filtres (thème + jour + lieu) afin d'affiner ma recherche.

#### Fiches films et invités
 
- **US-06 (M)** En tant que spectateur, je veux ouvrir la fiche d'un film afin de voir son synopsis, sa durée, sa version, son réalisateur, son casting et son affiche.
  - Critères : la fiche s'ouvre en un clic ; un lien mène à la page officielle du film.
- **US-07 (S)** En tant que spectateur, je veux voir la bande-annonce afin de choisir plus facilement.
- **US-08 (M)** En tant que spectateur, je veux savoir si l'équipe ou un invité est présent à une séance afin de privilégier ces rencontres.
  - Critères : la mention est visible dans la liste et sur la fiche ; elle indique la séance concernée.
- **US-09 (S)** En tant que spectateur, je veux consulter la page d'un invité afin de voir ses films et ses séances au festival.
#### Ma sélection et planning
 
- **US-10 (M)** En tant que spectateur, je veux ajouter un film à ma sélection afin de préparer mon festival.
  - Critères : ajout et retrait en un clic ; la sélection reste visible sur toutes les pages.
- **US-11 (M)** En tant que spectateur, je veux que le site signale les conflits (chevauchement, trajet trop court entre deux lieux) afin d'éviter un planning impossible.
- **US-12 (M)** En tant que spectateur, je veux obtenir un planning optimisé à partir de ma sélection afin de limiter les déplacements et regrouper mes séances.
  - Critères : jusqu'à trois propositions classées selon un critère explicite (moins de déplacements, moins de jours, plus de films vus) ; un film sans solution compatible est signalé avec la raison.
- **US-13 (M)** En tant que spectateur, je veux indiquer mes disponibilités afin de ne voir que les séances qui tiennent dans mes créneaux.
  - Critères : une séance n'est proposée que si elle tient entièrement dans un créneau libre (début + durée du film).
- **US-14 (M)** En tant que spectateur, je veux être renvoyé vers la billetterie officielle afin de réserver mes places.
- **US-15 (S)** En tant que spectateur, je veux imprimer mon planning sur une page afin de l'emporter au cinéma.
- **US-16 (S)** En tant que spectateur, je veux partager mon planning par un lien afin de le montrer à mes proches.
- **US-17 (C)** En tant que spectateur, je veux exporter mes séances vers mon agenda (fichier .ics) afin de les retrouver sur mon téléphone.
- **US-18 (S)** En tant que spectateur, je veux retrouver ma sélection quand je reviens sur le site afin de ne pas tout refaire.
#### Accessibilité et usage
 
- **US-19 (M)** En tant que spectateur sur téléphone, je veux utiliser le site sans créer de compte afin d'aller droit au but.
- **US-20 (M)** En tant que spectateur âgé ou malvoyant, je veux un texte lisible et des contrastes forts afin de lire le programme sans effort.
- **US-21 (C)** En tant que spectateur étranger, je veux une version anglaise afin de comprendre le programme.
#### Administration
 
- **US-22 (M)** En tant qu'administrateur, je veux mettre à jour le programme en relançant un script afin de suivre les changements du site officiel.
- **US-23 (M)** En tant qu'administrateur, je veux corriger une donnée à la main sans qu'elle soit écrasée à la prochaine mise à jour.
- **US-24 (S)** En tant qu'administrateur, je veux un rapport des anomalies et des différences afin de repérer ce qui a changé ou ce qui est douteux.


### 3.3 Règles métier du moteur de planning
 
- La fin d'une séance est égale à son début plus la durée du film
- Deux séances sont incompatibles si elles se chevauchent (plus de 10-15 minutes), ou si l'écart entre elles est inférieur à la marge de sécurité plus le temps de trajet entre leurs lieux
- Les temps de trajet entre lieux sont saisis à la main dans une matrice
- Marge de sécurité par défaut : 10-15 minutes 
- Un film dont aucune séance n'est compatible est signalé à l'utilisateur
- Le planning propose plusieurs options plutôt qu'une seule, avec le critère de classement indiqué

### 3.4 Design
 
- Mobile d'abord, avec texte de grande taille et contrastes forts
- Navigation simple : un clic pour atteindre une fiche, et un parcours « Mon planning » toujours accessible
- Style sobre, sans logo ni visuels officiels tant que le festival n'a pas validé le projet, avec la mention « projet de bénévole, non officiel »
- Affiches affichées à partir du site officiel, avec lien vers les pages d'origine
- Résultat de planning imprimable sur une page

### 3.5 Stack technique (proposition)
 
- Site statique (HTML et JavaScript ??)
- Données dans des fichiers JSON générés par un script de collecte
- Moteur de filtre et de planning exécuté dans le navigateur
- Stockage de la sélection dans le navigateur (pas de compte, pas de base de données)
- Versionnage avec Git et déploiement automatique
 
## 4 – Données
 
Le détail est dans [`donnees.md`](donnees.md). En résumé :
 
- **Sources** : page programme 2026, fiches de chaque film, page et fiches des invités du site officiel
- **Entités** : Film, Séance, Invité, Lieu, Section
- **Points de vigilance** : adresses de pages qui ne correspondent pas toujours au titre, contenus masqués à ignorer, erreurs ponctuelles sur certaines fiches, liste d'invités encore ouverte

## 5 – Exigences non fonctionnelles (habitudes)
 
- **Performance** : affichage utilisable en moins de 3 secondes sur un téléphone en 4G
- **Accessibilité** : respect visé des critères WCAG 2.1 niveau AA (contrastes, navigation au clavier, textes agrandissables)
- **Compatibilité** : dernières versions des principaux navigateurs, mobile et ordinateur
- **Vie privée** : aucun compte, aucun suivi publicitaire ; la sélection reste sur l'appareil de l'utilisateur
- **Droits** : affiches et textes renvoient vers le site officiel ; pas de reprise massive de contenus
- **Contenus publics uniquement** : seules les informations visibles publiquement sur le site officiel sont utilisées ; les contenus masqués ou non publiés sont ignorés
- **Maintenance** : hébergement gratuit ou peu coûteux, mise à jour du programme en une commande
- **Langue** : français, anglais en option


## 6 – Planning prévisionnel
 
| Période | Livrables |
|---|---|
| **Mi-octobre** | Modèle de données, script de collecte, rapport qualité, programme filtrable et fiches |
| **Fin octobre** | Sélection, disponibilités, planning optimisé, impression et partage / Essai par quelques personnes (dont une proche du public cible), corrections, envoi du lien à l'équipe du festival |
| **Début novembre** | Mises à jour du programme si nécessaire |
 
En cas de retard, l'ordre de sacrifice est : export agenda, version anglaise, bandes-annonces, puis pages invités. Le planning optimisé et le filtre par disponibilités passent avant tout le reste.