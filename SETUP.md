# Guide d'Installation Rapide - AppJeune

## 🚀 Installation en 5 minutes

### 1. Cloner ou télécharger le projet

```bash
git clone https://github.com/votre-username/appjeune-kzi.git
cd appjeune-kzi
```

### 2. Configurer Supabase

#### A. Créer un compte Supabase

1. Allez sur [supabase.com](https://supabase.com)
2. Créez un compte gratuit
3. Créez un nouveau projet (gratuit jusqu'à 500 MB)

#### B. Exécuter le schéma SQL

1. Dans votre projet Supabase, cliquez sur **SQL Editor**
2. Cliquez sur **New Query**
3. Ouvrez le fichier `supabase/schema.sql` de ce projet
4. Copiez tout le contenu et collez-le dans l'éditeur SQL
5. Cliquez sur **Run** (ou F5)
6. Vérifiez que les tables sont créées dans **Table Editor**

#### C. Récupérer vos clés API

1. Dans Supabase, allez dans **Settings** > **API**
2. Copiez :
   - **Project URL** (ex: `https://xxxxx.supabase.co`)
   - **anon public** key (une longue chaîne de caractères)

### 3. Configurer l'application

Ouvrez `js/config.js` et remplacez :

```javascript
const SUPABASE_CONFIG = {
  url: 'https://votre-projet.supabase.co',  // ← Votre Project URL
  anonKey: 'votre_cle_anon_ici'              // ← Votre anon key
};
```

### 4. Tester l'application

1. Ouvrez `login.html` dans votre navigateur
2. Connectez-vous avec :
   - Username: `admin`
   - Password: `admin123`
3. Si tout fonctionne, vous verrez le tableau de bord admin

## ✅ Vérification

### Vérifier la connexion Supabase

1. Ouvrez la console du navigateur (F12)
2. Vous devriez voir : `✅ Client Supabase initialisé`
3. Si vous voyez une erreur, vérifiez vos clés dans `js/config.js`

### Vérifier les données

1. Dans Supabase, allez dans **Table Editor**
2. Vous devriez voir les tables : `users`, `members`, `departments`, `events`, `attendances`
3. La table `users` devrait contenir 4 utilisateurs par défaut

## 🔄 Migration depuis localStorage

Si vous avez déjà des données dans localStorage :

1. L'application utilisera Supabase pour les nouvelles données
2. Les anciennes données restent dans localStorage
3. Pour migrer manuellement, utilisez la fonction `syncToSupabase()` dans la console

## 🐛 Problèmes courants

### Erreur : "Client Supabase non initialisé"

- Vérifiez que `js/config.js` contient vos vraies clés
- Vérifiez que le script Supabase est chargé avant `js/supabase.js`

### Erreur : "relation does not exist"

- Le schéma SQL n'a pas été exécuté
- Retournez à l'étape 2.B et exécutez le schéma SQL

### Les données ne s'affichent pas

- Vérifiez la console du navigateur pour les erreurs
- Vérifiez que les tables existent dans Supabase
- L'application basculera vers localStorage si Supabase échoue

## 📚 Prochaines étapes

- Lisez le [README.md](README.md) pour plus d'informations
- Consultez [CONFIG.md](CONFIG.md) pour les options avancées
- Consultez [GUIDE_UTILISATEURS.md](GUIDE_UTILISATEURS.md) pour utiliser l'application

---

**Besoin d'aide ?** Ouvrez une issue sur GitHub ou consultez la documentation Supabase.

