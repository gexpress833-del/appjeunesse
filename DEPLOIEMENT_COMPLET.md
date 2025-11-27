# 🚀 Guide de Déploiement Complet - AppJeune avec Supabase

Ce guide vous accompagne étape par étape pour déployer l'application AppJeune avec Supabase.

## 📋 Prérequis

- Un compte Supabase (gratuit) : [supabase.com](https://supabase.com)
- Un compte GitHub (pour le déploiement)
- Les fichiers du projet AppJeune

## 🗄️ ÉTAPE 1 : Configuration de Supabase

### 1.1 Créer un projet Supabase

1. Allez sur [supabase.com](https://supabase.com)
2. Créez un compte ou connectez-vous
3. Cliquez sur **"New Project"**
4. Remplissez les informations :
   - **Name** : `appjeune-kzi` (ou votre nom)
   - **Database Password** : Choisissez un mot de passe fort (⚠️ **SAVEZ-LE**)
   - **Region** : Choisissez la région la plus proche
5. Cliquez sur **"Create new project"**
6. Attendez 2-3 minutes que le projet soit créé

### 1.2 Exécuter le schéma SQL

1. Dans votre projet Supabase, allez dans **SQL Editor** (menu de gauche)
2. Cliquez sur **"New Query"**
3. Ouvrez le fichier `supabase/schema.sql` de ce projet
4. **Copiez TOUT le contenu** et collez-le dans l'éditeur SQL
5. Cliquez sur **"Run"** (ou appuyez sur F5)
6. Vérifiez qu'il n'y a pas d'erreurs
7. Allez dans **Table Editor** pour vérifier que les tables sont créées :
   - ✅ `users` (4 utilisateurs par défaut)
   - ✅ `departments` (7 départements)
   - ✅ `members`
   - ✅ `events`
   - ✅ `attendances`

### 1.3 Créer les buckets de stockage

1. Dans Supabase, allez dans **Storage** (menu de gauche)
2. Cliquez sur **"New bucket"**

#### Bucket 1 : `event-photos`
- **Name** : `event-photos`
- **Public bucket** : ✅ **OUI** (cochez la case)
- Cliquez sur **"Create bucket"**

#### Bucket 2 : `user-profiles`
- **Name** : `user-profiles`
- **Public bucket** : ✅ **OUI** (cochez la case)
- Cliquez sur **"Create bucket"**

### 1.4 Configurer les politiques de stockage

1. Allez dans **SQL Editor**
2. Ouvrez le fichier `supabase/storage-policies.sql`
3. **Copiez TOUT le contenu** et collez-le dans l'éditeur SQL
4. Cliquez sur **"Run"**
5. Vérifiez qu'il n'y a pas d'erreurs

### 1.5 Récupérer les clés API

1. Dans Supabase, allez dans **Settings** > **API**
2. Copiez les valeurs suivantes :
   - **Project URL** (ex: `https://xxxxx.supabase.co`)
   - **anon public** key (une longue chaîne de caractères)

## ⚙️ ÉTAPE 2 : Configuration de l'application

### 2.1 Configurer les clés Supabase

1. Ouvrez le fichier `js/config.js`
2. Remplacez les valeurs par vos clés :

```javascript
const SUPABASE_CONFIG = {
  url: 'https://votre-projet.supabase.co',  // ← Votre Project URL
  anonKey: 'votre_cle_anon_ici'              // ← Votre anon key
};
```

**⚠️ IMPORTANT** : Ne commitez jamais ces clés dans un dépôt public GitHub !

### 2.2 Vérifier la structure des fichiers

Assurez-vous que tous ces fichiers existent :
- ✅ `js/config.js`
- ✅ `js/supabase.js`
- ✅ `js/storage.js`
- ✅ `js/data.js`
- ✅ `supabase/schema.sql`
- ✅ `supabase/storage-policies.sql`

## 🧪 ÉTAPE 3 : Test local

### 3.1 Tester la connexion

1. Ouvrez `login.html` dans votre navigateur
2. Ouvrez la console (F12)
3. Vous devriez voir : `✅ Client Supabase initialisé`
4. Connectez-vous avec :
   - Username: `admin`
   - Password: `admin123`

### 3.2 Tester les fonctionnalités

1. **Créer un événement avec photo** :
   - Allez dans "Événements"
   - Créez un événement et uploadez une photo
   - Vérifiez que la photo s'affiche

2. **Modifier la photo de profil** :
   - Allez dans "Mon Profil"
   - Uploadez une photo
   - Vérifiez qu'elle s'affiche

3. **Vérifier les données dans Supabase** :
   - Allez dans Supabase > **Table Editor**
   - Vérifiez que les données sont bien sauvegardées
   - Allez dans **Storage** > `event-photos` et `user-profiles`
   - Vérifiez que les images sont bien uploadées

## 📦 ÉTAPE 4 : Préparation pour GitHub

### 4.1 Créer un fichier .env.local (optionnel)

Créez un fichier `.env.local` à la racine (ne sera pas commité grâce à .gitignore) :

```env
SUPABASE_URL=https://votre-projet.supabase.co
SUPABASE_ANON_KEY=votre_cle_anon_ici
```

### 4.2 Vérifier .gitignore

Assurez-vous que `.gitignore` contient :
```
.env
.env.local
.env.production
```

### 4.3 Initialiser Git

```bash
git init
git add .
git commit -m "Initial commit - AppJeune avec Supabase"
```

## 🌐 ÉTAPE 5 : Déploiement sur GitHub

### 5.1 Créer le dépôt GitHub

1. Allez sur [github.com](https://github.com)
2. Cliquez sur **"New repository"**
3. Remplissez :
   - **Repository name** : `appjeune-kzi`
   - **Description** : "Application de gestion d'équipe - La Parole Eternelle"
   - **Visibility** : Public ou Private (selon vos besoins)
4. **NE COCHEZ PAS** "Initialize with README"
5. Cliquez sur **"Create repository"**

### 5.2 Pousser le code

```bash
git remote add origin https://github.com/votre-username/appjeune-kzi.git
git branch -M main
git push -u origin main
```

### 5.3 Activer GitHub Pages

1. Dans votre dépôt GitHub, allez dans **Settings** > **Pages**
2. Sous **Source**, sélectionnez :
   - **Branch** : `main`
   - **Folder** : `/ (root)`
3. Cliquez sur **"Save"**
4. Votre application sera accessible à : `https://votre-username.github.io/appjeune-kzi/`

## 🔒 ÉTAPE 6 : Sécurité des clés (IMPORTANT)

### Option 1 : Variables d'environnement (Recommandé pour production)

Pour GitHub Pages, vous pouvez utiliser :
- **Netlify** : Variables d'environnement dans les paramètres
- **Vercel** : Variables d'environnement dans les paramètres
- **Cloudflare Pages** : Variables d'environnement

### Option 2 : Configuration directe (Pour démo/test)

Si vous utilisez GitHub Pages directement, vous devrez configurer les clés dans `js/config.js`. 

**⚠️ ATTENTION** : Si votre dépôt est public, vos clés seront visibles. Utilisez cette méthode uniquement pour des tests.

## ✅ Checklist de vérification

Avant de considérer le déploiement comme terminé, vérifiez :

- [ ] Le schéma SQL a été exécuté sans erreur
- [ ] Les buckets `event-photos` et `user-profiles` sont créés et publics
- [ ] Les politiques de stockage sont configurées
- [ ] Les clés Supabase sont configurées dans `js/config.js`
- [ ] L'application se connecte à Supabase (console du navigateur)
- [ ] Les utilisateurs peuvent se connecter
- [ ] Les événements peuvent être créés avec photos
- [ ] Les photos de profil peuvent être uploadées
- [ ] Les données sont bien sauvegardées dans Supabase
- [ ] Les images sont bien stockées dans Supabase Storage
- [ ] Le code est poussé sur GitHub
- [ ] GitHub Pages est activé

## 🐛 Dépannage

### Erreur : "Supabase n'est pas configuré"

1. Vérifiez `js/config.js` - les clés sont-elles correctes ?
2. Vérifiez que `js/config.js` est chargé avant `js/supabase.js`
3. Vérifiez la console du navigateur pour les erreurs

### Erreur : "relation does not exist"

- Le schéma SQL n'a pas été exécuté
- Retournez à l'ÉTAPE 1.2

### Les images ne s'affichent pas

1. Vérifiez que les buckets sont **publics**
2. Vérifiez que les politiques de stockage sont configurées
3. Vérifiez les URLs dans la console du navigateur

### Erreur lors de l'upload d'image

1. Vérifiez la taille du fichier (max 5MB pour événements, 2MB pour profils)
2. Vérifiez le format (JPG, PNG, WebP uniquement)
3. Vérifiez les politiques RLS dans Supabase Storage

## 📚 Ressources

- [Documentation Supabase](https://supabase.com/docs)
- [Guide Supabase Storage](https://supabase.com/docs/guides/storage)
- [GitHub Pages Documentation](https://docs.github.com/en/pages)

## 🎉 Félicitations !

Votre application est maintenant prête à être utilisée avec Supabase !

---

**Note** : Pour toute question ou problème, consultez les fichiers de documentation :
- `SETUP.md` - Installation rapide
- `GUIDE_STOCKAGE_IMAGES.md` - Gestion des images
- `INTEGRATION_SUPABASE.md` - Détails techniques

