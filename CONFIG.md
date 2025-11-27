# Configuration Supabase

## Variables d'environnement

Créez un fichier `.env` à la racine du projet avec les valeurs suivantes :

```env
SUPABASE_URL=https://votre-projet.supabase.co
SUPABASE_ANON_KEY=votre_cle_anon_ici
```

## Configuration dans le code

Vous pouvez également configurer directement dans `js/config.js` :

```javascript
const SUPABASE_CONFIG = {
  url: 'https://votre-projet.supabase.co',
  anonKey: 'votre_cle_anon_ici'
};
```

## Où trouver vos clés Supabase

1. Allez sur [supabase.com](https://supabase.com)
2. Connectez-vous à votre projet
3. Allez dans **Settings** > **API**
4. Copiez :
   - **Project URL** → `SUPABASE_URL`
   - **anon public** key → `SUPABASE_ANON_KEY`

