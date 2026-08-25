# 👥 AppJeune-KZI - Gestion d'Équipe

Application web de gestion d'équipe pour La Parole Éternelle Kolwezi, basée sur **Supabase** pour l'authentification et la persistance des données.

## 🚀 Fonctionnalités

- **Authentification Supabase** : Connexion sécurisée via Supabase Auth (pas de mots de passe en clair)
- **Gestion des Rôles** : Admin, Secrétariat, Responsable, Utilisateur avec RLS (Row Level Security)
- **Gestion d'Équipe** : Membres, départements, profils utilisateurs
- **Présences** : Suivi des attendances aux événements
- **Événements** : Création et gestion des événements avec photos
- **Rapports** : Génération de rapports PDF
- **Stockage Cloud** : Intégration Cloudinary pour les images (via Supabase Edge Functions)

## 📁 Structure du Projet

```
├── index.html                 # Page d'accueil
├── supabase-config.html       # Configuration initiale Supabase
├── login.html                # Page de connexion (Supabase Auth)
├── register.html             # Page d'inscription (Supabase Auth)
├── admin.html                # Tableau de bord administrateur
├── secretariat.html          # Interface secrétariat
├── responsable.html          # Interface responsable
├── user.html                 # Interface utilisateur
├── members.html              # Gestion des membres
├── departments.html          # Gestion des départements
├── events.html               # Gestion des événements
├── attendances.html          # Gestion des présences
├── reports.html              # Gestion des rapports
├── css/
│   └── styles.css           # Styles principaux
├── js/
│   ├── config.js            # Configuration Supabase
│   ├── supabase.js          # Interface legacy Supabase
│   ├── auth.js              # Authentification
│   ├── data.js              # Gestion des données (appState)
│   ├── storage.js           # Stockage images (Cloudinary)
│   ├── users.js             # Gestion des utilisateurs
│   ├── members.js           # Gestion des membres
│   ├── departments.js       # Gestion des départements
│   ├── events.js            # Gestion des événements
│   ├── attendances.js       # Gestion des présences
│   ├── pdf-reports.js       # Génération de rapports PDF
│   └── services/            # Services Supabase modulaires
│       ├── supabase-client.js
│       ├── auth.service.js
│       ├── profiles.service.js
│       ├── departments.service.js
│       ├── members.service.js
│       ├── events.service.js
│       ├── attendances.service.js
│       └── home-contents.service.js
└── supabase/
    └── schema.sql           # Schéma PostgreSQL avec RLS
```

## 🔐 Rôles et Permissions

- **Admin** : Accès complet, gestion des utilisateurs et rôles
- **Secrétariat** : Gestion des données, rapports, événements
- **Responsable** : Supervision d'équipe, présences
- **User** : Accès basique en lecture seule

Les permissions sont appliquées au niveau de la base de données via **Row Level Security (RLS)**.

## 🚀 Installation et Configuration

### Prérequis

- Un compte [Supabase](https://supabase.com)
- Un compte [Cloudinary](https://cloudinary.com) (optionnel, pour les images)

### Étape 1 : Créer un projet Supabase

1. Allez sur [supabase.com](https://supabase.com)
2. Créez un nouveau projet
3. Notez votre **Project URL** et **anon key** (Settings → API)

### Étape 2 : Configurer la base de données

1. Dans votre projet Supabase, allez dans **SQL Editor**
2. Ouvrez le fichier `supabase/schema.sql`
3. Copiez et exécutez tout le contenu dans l'éditeur SQL
4. Vérifiez que les tables sont créées (Table Editor)

Le schéma inclut :
- Table `profiles` (liée à `auth.users`)
- Tables `departments`, `members`, `events`, `attendances`, `home_contents`
- Politiques RLS pour chaque table
- Triggers pour `updated_at`

### Étape 3 : Configurer l'application

#### Option A : Via l'interface web (recommandé)

1. Ouvrez `supabase-config.html` dans votre navigateur
2. Entrez vos clés Supabase
3. Sauvegardez la configuration
4. La configuration sera stockée dans localStorage

#### Option B : Via fichier de configuration

Créez un fichier `.env` à la racine (basé sur `.env.example`) :

```env
SUPABASE_URL=https://votre-projet.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
CLOUDINARY_CLOUD_NAME=votre-cloud-name
CLOUDINARY_UPLOAD_PRESET=unsigned
```

### Étape 4 : Créer le premier utilisateur admin

Puisque Supabase Auth gère les utilisateurs, vous devez créer le premier admin :

1. Ouvrez `register.html`
2. Inscrivez-vous avec votre email et mot de passe
3. Contactez un admin existant pour vous assigner le rôle `admin`
4. Ou exécutez manuellement dans Supabase SQL Editor :

```sql
-- Créer un utilisateur admin (remplacez l'email)
INSERT INTO public.profiles (id, username, full_name, role, status)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'admin@exemple.com'),
  'admin',
  'Administrateur',
  'admin',
  'active'
);
```

### Étape 5 : Lancer l'application

1. Ouvrez `index.html` dans votre navigateur
2. Connectez-vous via `login.html`
3. Naviguez selon votre rôle

## 🛠️ Architecture Technique

### Supabase Auth

- Utilisation de `supabase.auth.signUp()` pour l'inscription
- Utilisation de `supabase.auth.signInWithPassword()` pour la connexion
- Gestion automatique des sessions via cookies
- Table `profiles` liée à `auth.users` pour les métadonnées

### Row Level Security (RLS)

Toutes les tables sont protégées par des politiques RLS :
- Les utilisateurs ne peuvent voir/modifier que les données autorisées
- Les admins ont accès complet
- Les rôles sont vérifiés au niveau de la base de données

### Services Modulaires

L'application utilise une architecture de services dans `js/services/` :
- `auth.service.js` : Authentification et sessions
- `profiles.service.js` : Gestion des profils utilisateurs
- `departments.service.js` : Gestion des départements
- `members.service.js` : Gestion des membres
- `events.service.js` : Gestion des événements
- `attendances.service.js` : Gestion des présences
- `home-contents.service.js` : Contenu de la page d'accueil

### Interface Legacy

Le fichier `js/supabase.js` fournit une interface compatible avec l'ancien code pour faciliter la transition.

## 🌐 Déploiement

### GitHub Pages

1. Pushez votre code sur GitHub
2. Activez GitHub Pages dans Settings → Pages
3. Configurez Supabase via `supabase-config.html` après déploiement

### Netlify / Vercel

Ces plateformes supportent les variables d'environnement pour sécuriser vos clés Supabase.

## ⚠️ Sécurité

- **Jamais** de mots de passe en clair dans la base de données
- Utilisation de Supabase Auth pour l'authentification
- RLS activé sur toutes les tables
- Clés Cloudinary stockées dans Edge Functions (pas dans le frontend)
- Validation des entrées côté serveur

## 🐛 Dépannage

### Erreur de connexion Supabase

1. Vérifiez vos clés dans `supabase-config.html`
2. Vérifiez que le schéma SQL a été exécuté
3. Consultez la console du navigateur pour les erreurs

### RLS bloque les opérations

1. Vérifiez que l'utilisateur a un profil dans la table `profiles`
2. Vérifiez que le rôle est correctement assigné
3. Consultez les politiques RLS dans Supabase

## 📄 Licence

Ce projet est destiné à un usage interne pour La Parole Éternelle Kolwezi.

---

**Auteur** : AppJeune Team  
**Date** : 2026  
**Version** : 2.0 (Architecture Supabase)
