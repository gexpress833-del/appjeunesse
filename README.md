# 👥 AppJeune - Gestion d'Équipe

Une application web complète de gestion d'équipe avec gestion des rôles, des présences, des événements et des rapports.

## 🚀 Fonctionnalités

- **Authentification** : Système de login sécurisé avec rôles
- **Gestion des Rôles** : Admin, Secrétariat, Responsable, Utilisateur
- **Gestion d'Équipe** : Membres, départements, profils
- **Présences** : Suivi des attendances
- **Événements** : Création et gestion des événements
- **Rapports** : Génération de rapports PDF
- **Stockage** : Gestion des photos et des données
- **Base de données** : Intégration Supabase pour la persistance des données

## 📁 Structure du Projet

```
├── index.html                 # Page d'accueil/redirection
├── login.html                # Page de connexion
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
│   ├── supabase.js          # Module Supabase
│   ├── auth.js              # Authentification
│   ├── data.js              # Gestion des données
│   ├── users.js             # Gestion des utilisateurs
│   ├── members.js           # Gestion des membres
│   ├── departments.js       # Gestion des départements
│   ├── events.js            # Gestion des événements
│   ├── attendances.js       # Gestion des présences
│   ├── pdf-reports.js       # Génération de rapports PDF
│   └── autres fichiers...
└── supabase/
    └── schema.sql           # Schéma de base de données
```

## 🔐 Rôles Disponibles

- **Admin** : Accès complet au système
- **Secrétariat** : Gestion des données, rapports
- **Responsable** : Supervision d'équipe
- **User** : Accès basique

## 💾 Stockage des Données

L'application supporte deux modes de stockage :

1. **Supabase** (recommandé) : Base de données cloud PostgreSQL
2. **localStorage** (fallback) : Stockage local du navigateur

L'application bascule automatiquement vers localStorage si Supabase n'est pas configuré.

## 🚀 Installation et Configuration

### Option 1 : Avec Supabase (Recommandé)

#### Étape 1 : Créer un projet Supabase

1. Allez sur [supabase.com](https://supabase.com)
2. Créez un compte ou connectez-vous
3. Créez un nouveau projet
4. Notez votre **Project URL** et **anon key** (Settings > API)

#### Étape 2 : Configurer la base de données

1. Dans votre projet Supabase, allez dans **SQL Editor**
2. Ouvrez le fichier `supabase/schema.sql`
3. Copiez et exécutez tout le contenu dans l'éditeur SQL
4. Vérifiez que les tables sont créées (Table Editor)

#### Étape 3 : Configurer l'application

1. Ouvrez `js/config.js`
2. Remplacez les valeurs par vos clés Supabase :

```javascript
const SUPABASE_CONFIG = {
  url: 'https://votre-projet.supabase.co',
  anonKey: 'votre_cle_anon_ici'
};
```

**OU** créez un fichier `.env` à la racine :

```env
SUPABASE_URL=https://votre-projet.supabase.co
SUPABASE_ANON_KEY=votre_cle_anon_ici
```

#### Étape 4 : Lancer l'application

1. Ouvrez `index.html` ou `login.html` dans votre navigateur
2. L'application se connectera automatiquement à Supabase

### Option 2 : Sans Supabase (localStorage uniquement)

1. Ouvrez simplement `index.html` dans votre navigateur
2. L'application utilisera localStorage automatiquement
3. Les données seront stockées localement dans le navigateur

## 🌐 Utilisation

1. Ouvrez `login.html` dans votre navigateur
2. Connectez-vous avec vos identifiants
3. Naviguez selon votre rôle

### Identifiants par Défaut

Les utilisateurs par défaut sont créés automatiquement dans Supabase via le schéma SQL :

- **Admin** : `admin` / `admin123`
- **Secrétariat** : `secretariat` / `secret123`
- **Responsable** : `responsable` / `resp123`
- **Utilisateur** : `user` / `user123`

## 🛠️ Technologies Utilisées

- **HTML5** : Structure
- **CSS3** : Mise en forme et design
- **JavaScript Vanilla** : Logique et interactivité
- **Supabase** : Base de données PostgreSQL cloud
- **LocalStorage** : Persistance locale (fallback)

## 📊 Fonctionnalités Avancées

- Génération de rapports PDF
- Optimisation de la performance
- Gestion des photos utilisateur
- Système de notifications
- Analyse du stockage local
- Synchronisation cloud avec Supabase

## 📝 Documentation

- `SETUP.md` : Guide d'installation rapide
- `CONFIG.md` : Guide de configuration Supabase
- `GUIDE_UTILISATEURS.md` : Guide complet d'utilisation
- `LOGO_INSTRUCTIONS.md` : Instructions pour les logos
- `DEPANNAGE_ROLES.md` : Résolution des problèmes de rôles
- `supabase/schema.sql` : Schéma de base de données

## 🔧 Déploiement sur GitHub

### Préparer le dépôt

1. Créez un nouveau dépôt sur GitHub
2. Initialisez git dans votre projet :

```bash
git init
git add .
git commit -m "Initial commit - AppJeune avec Supabase"
git branch -M main
git remote add origin https://github.com/votre-username/votre-repo.git
git push -u origin main
```

### Configuration pour GitHub Pages

1. Allez dans **Settings** > **Pages** de votre dépôt
2. Sélectionnez la branche `main` comme source
3. Votre application sera accessible à `https://votre-username.github.io/votre-repo/`

### ⚠️ Sécurité des clés Supabase

**IMPORTANT** : Ne commitez jamais vos clés Supabase dans le dépôt public !

1. Utilisez des variables d'environnement ou configurez directement dans `js/config.js`
2. Pour GitHub Pages, vous pouvez :
   - Utiliser des variables d'environnement via un service comme Netlify ou Vercel
   - Ou configurer directement dans `js/config.js` (moins sécurisé mais fonctionnel)

## 🐛 Dépannage

### L'application ne se connecte pas à Supabase

1. Vérifiez que vos clés sont correctes dans `js/config.js`
2. Vérifiez la console du navigateur pour les erreurs
3. Assurez-vous que le schéma SQL a été exécuté dans Supabase
4. L'application basculera automatiquement vers localStorage en cas d'erreur

### Les données ne se synchronisent pas

1. Vérifiez votre connexion internet
2. Vérifiez les permissions RLS dans Supabase si activées
3. Consultez la console du navigateur pour les erreurs

## 📄 Licence

Ce projet est destiné à un usage interne.

---

**Auteur** : AppJeune Team  
**Date** : 2025
