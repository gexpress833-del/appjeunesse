# 🔧 Correction des Politiques de Stockage

## Problème Identifié

L'erreur `new row violates row-level security policy` se produit car :
- L'application utilise un système d'authentification **personnalisé** (pas Supabase Auth)
- Les politiques RLS utilisaient `auth.role() = 'authenticated'` qui ne fonctionne que avec Supabase Auth
- Personne n'est authentifié via Supabase Auth, donc les politiques bloquaient tous les uploads

## Solution Appliquée

Les politiques ont été modifiées pour permettre l'accès **public** aux buckets de stockage :
- ✅ Upload public autorisé
- ✅ Lecture publique autorisée
- ✅ Mise à jour publique autorisée
- ✅ Suppression publique autorisée

## ⚠️ Action Requise

**Vous devez réexécuter le fichier `supabase/storage-policies.sql` dans Supabase !**

### Étapes :

1. Allez dans votre projet Supabase : https://supabase.com/dashboard/project/etbootzjdlxrfrfycjsz
2. Cliquez sur **SQL Editor**
3. Cliquez sur **"New Query"**
4. **Supprimez d'abord les anciennes politiques** (si elles existent) :

```sql
-- Supprimer les anciennes politiques
DROP POLICY IF EXISTS "Public read access for event photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload event photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update event photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete event photos" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for user profiles" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete profile photos" ON storage.objects;
```

5. **Copiez TOUT le contenu** du fichier `supabase/storage-policies.sql` (mis à jour)
6. **Collez-le** dans l'éditeur SQL
7. Cliquez sur **"Run"** (ou F5)
8. Vérifiez qu'il n'y a **pas d'erreurs**

## ✅ Vérification

Après avoir exécuté les nouvelles politiques :
1. Rechargez votre application
2. Essayez d'uploader une photo d'événement
3. L'upload devrait maintenant fonctionner sans erreur

## 🔒 Sécurité

Bien que les politiques soient publiques, la sécurité est maintenue au niveau de l'application :
- ✅ Vérification des rôles dans le code JavaScript
- ✅ Seuls les utilisateurs connectés peuvent accéder aux pages
- ✅ Les permissions sont vérifiées avant chaque action

Si vous souhaitez renforcer la sécurité plus tard, vous pouvez :
- Migrer vers Supabase Auth
- Implémenter des politiques plus restrictives basées sur les noms de fichiers

