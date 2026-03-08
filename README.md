# Flash Roll

Flash Roll est une solution de gestion d'appels et de présences destinée aux établissements scolaires. Elle permet aux enseignants de générer des QR codes dynamiques et aux étudiants de valider leur présence instantanément via leur smartphone.

## Technologies utilisées

- **Frontend & Mobile** : [Tamagui](https://tamagui.dev/) (UI Suite), React Native / Expo.
- **Backend & Base de données** : [Firebase](https://firebase.google.com/) (Firestore pour les données temps réel, Firebase Auth pour la sécurité).
- **Langage** : TypeScript pour un typage rigoureux et une meilleure maintenance.
- **Outils tiers** : `react-native-qrcode-svg` pour la génération de QR codes.

## Fonctionnalités

### Pour les Enseignants

- **Génération de QR Codes dynamiques** : Création d'un QR code qui s'actualise toutes les 5 secondes pour empêcher le partage de photos entre étudiants.
- **Appel Manuel** : Possibilité de marquer manuellement un étudiant comme présent, en retard ou absent via une interface dédiée.
- **Gestion des Sessions** : Création, démarrage et clôture des sessions de cours.
- **Import d'Emploi du Temps** : Support de l'importation de fichiers au format `.ics` pour automatiser la création des cours.

### Pour les Étudiants

- **Scan de Présence** : Validation de la présence en scannant le QR code de l'enseignant.
- **Emploi du Temps personnel** : Visualisation des cours à venir selon le groupe ou sous-groupe assigné.
- **Justificatifs** : Soumission de justificatifs d'absence (en attente de validation par l'administration).

### Authentification & Sécurité

- **Système d'invitation** : Inscription liée à un pré-import CSV effectué par l'administration. Les données métiers (nom, groupe) sont automatiquement liées lors de la création du compte.
- **Validation Admin** : Les nouveaux utilisateurs non invités doivent être validés manuellement par un administrateur.
- **Rôles** : Gestion stricte des accès entre Étudiants, Intervenants et Administrateurs.

## Structure du projet

```text
flash-roll/
├── apps/
│   └── (Mobile/Web app utilisant Tamagui)
├── packages/
│   └── ui/ (Composants partagés Tamagui)
├── services/
│   ├── auth-service.ts       # Gestion des inscriptions, login et rôles
│   ├── session-service.ts    # Logique de création et gestion des appels
│   ├── group-service.ts      # Gestion des classes et sous-groupes
│   ├── import-service.ts     # Traitement des fichiers ICS et CSV
│   └── dashboard-service.ts  # Statistiques temps réel pour l'admin
└── utils/
    └── firebase.ts           # Configuration du SDK Firebase

```

## Prérequis

Pour lancer le projet en local, vous aurez besoin de :

1. **Node.js** (v16+) et **npm** ou **yarn**.
2. **Expo CLI** installé globalement (`npm install -g expo-cli`).
3. Un projet **Firebase** configuré :

- Activer l'authentification (Email/Password, Google).
- Créer une base de données Firestore.
- Ajouter vos identifiants dans un fichier d'environnement ou dans `utils/firebase.ts`.

## Installation

1. Cloner le dépôt :

```bash
git clone https://github.com/Viturna/flashroll.git
cd flashroll

```

2. Installer les dépendances :

```bash
yarn install

```

3. Lancer l'application :

```bash
npx expo start

```
