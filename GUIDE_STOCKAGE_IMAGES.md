# 📸 Guide de Stockage des Images

## 📍 Où sont stockées les images actuellement ?

### ❌ Situation actuelle (non optimale)

1. **Photos d'événements** :
   - Stockées en **base64** dans le champ `photo_url` de la table `events` dans Supabase
   - Problème : Les images base64 prennent beaucoup de place dans la base de données
   - Problème : Ralentit les requêtes et augmente les coûts

2. **Photos de profils utilisateurs** :
   - Stockées en **base64** dans `localStorage` (clé `userProfiles`)
   - Problème : Limité à ~5-10MB par navigateur
   - Problème : Perdues si l'utilisateur vide le cache

### ✅ Solution recommandée : Supabase Storage

**Supabase Storage** est un service de stockage de fichiers cloud intégré à Supabase, similaire à AWS S3.

## 🚀 Configuration de Supabase Storage

### Étape 1 : Créer les buckets dans Supabase

1. Allez dans votre projet Supabase
2. Cliquez sur **Storage** dans le menu de gauche
3. Créez deux buckets :

#### Bucket 1 : `event-photos`
- **Nom** : `event-photos`
- **Public** : ✅ Oui (pour que les images soient accessibles publiquement)
- **File size limit** : 5 MB
- **Allowed MIME types** : `image/jpeg, image/png, image/webp`

#### Bucket 2 : `user-profiles`
- **Nom** : `user-profiles`
- **Public** : ✅ Oui
- **File size limit** : 2 MB
- **Allowed MIME types** : `image/jpeg, image/png, image/webp`

### Étape 2 : Configurer les politiques RLS (Row Level Security)

Pour chaque bucket, allez dans **Policies** et créez :

#### Pour `event-photos` :
```sql
-- Permettre la lecture publique
CREATE POLICY "Public read access" ON storage.objects
FOR SELECT USING (bucket_id = 'event-photos');

-- Permettre l'upload aux utilisateurs authentifiés
CREATE POLICY "Authenticated users can upload" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'event-photos' AND
  auth.role() = 'authenticated'
);

-- Permettre la mise à jour aux utilisateurs authentifiés
CREATE POLICY "Authenticated users can update" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'event-photos' AND
  auth.role() = 'authenticated'
);

-- Permettre la suppression aux utilisateurs authentifiés
CREATE POLICY "Authenticated users can delete" ON storage.objects
FOR DELETE USING (
  bucket_id = 'event-photos' AND
  auth.role() = 'authenticated'
);
```

#### Pour `user-profiles` :
```sql
-- Permettre la lecture publique
CREATE POLICY "Public read access" ON storage.objects
FOR SELECT USING (bucket_id = 'user-profiles');

-- Permettre l'upload aux utilisateurs authentifiés
CREATE POLICY "Users can upload own profile" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'user-profiles' AND
  auth.role() = 'authenticated'
);

-- Permettre la mise à jour de sa propre photo
CREATE POLICY "Users can update own profile" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'user-profiles' AND
  auth.role() = 'authenticated'
);
```

### Étape 3 : Structure des fichiers

Les images seront stockées avec cette structure :

```
event-photos/
  ├── event_1_1640995200000.jpg
  ├── event_2_1641081600000.png
  └── ...

user-profiles/
  ├── user_admin_1640995200000.jpg
  ├── user_secretariat_1641081600000.png
  └── ...
```

## 📊 Avantages de Supabase Storage

✅ **Performance** : Les images sont servies via CDN
✅ **Scalabilité** : Pas de limite de taille de base de données
✅ **Coût** : Gratuit jusqu'à 1 GB, puis payant selon l'usage
✅ **Sécurité** : Contrôle d'accès via RLS
✅ **URLs publiques** : Accès direct aux images via URL

## 🔄 Migration depuis base64

Un script de migration sera fourni pour :
1. Extraire les images base64 existantes
2. Les uploader vers Supabase Storage
3. Mettre à jour les URLs dans la base de données

## 📝 Utilisation dans le code

Voir `js/storage.js` pour les fonctions d'upload et de gestion des images.

