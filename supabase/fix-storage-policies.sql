-- Script de correction des politiques de stockage
-- Exécutez ce script pour corriger l'erreur "new row violates row-level security policy"
-- 
-- Ce script supprime les anciennes politiques et crée les nouvelles

-- ==================== SUPPRESSION DES ANCIENNES POLITIQUES ====================

DROP POLICY IF EXISTS "Public read access for event photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload event photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update event photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete event photos" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for user profiles" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete profile photos" ON storage.objects;

-- ==================== CRÉATION DES NOUVELLES POLITIQUES ====================

-- ==================== BUCKET: event-photos ====================

-- Permettre la lecture publique des photos d'événements
CREATE POLICY "Public read access for event photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'event-photos');

-- Permettre l'upload public (nécessaire car pas d'auth Supabase)
CREATE POLICY "Public upload access for event photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'event-photos');

-- Permettre la mise à jour publique
CREATE POLICY "Public update access for event photos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'event-photos')
WITH CHECK (bucket_id = 'event-photos');

-- Permettre la suppression publique
CREATE POLICY "Public delete access for event photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'event-photos');

-- ==================== BUCKET: user-profiles ====================

-- Permettre la lecture publique des photos de profil
CREATE POLICY "Public read access for user profiles"
ON storage.objects FOR SELECT
USING (bucket_id = 'user-profiles');

-- Permettre l'upload public (nécessaire car pas d'auth Supabase)
CREATE POLICY "Public upload access for user profiles"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'user-profiles');

-- Permettre la mise à jour publique
CREATE POLICY "Public update access for user profiles"
ON storage.objects FOR UPDATE
USING (bucket_id = 'user-profiles')
WITH CHECK (bucket_id = 'user-profiles');

-- Permettre la suppression publique
CREATE POLICY "Public delete access for user profiles"
ON storage.objects FOR DELETE
USING (bucket_id = 'user-profiles');

