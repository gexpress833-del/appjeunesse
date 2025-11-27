-- Politiques RLS pour Supabase Storage
-- Exécutez ce script après avoir créé les buckets dans l'interface Supabase
-- 
-- IMPORTANT: Ces politiques permettent l'accès public car l'application
-- utilise un système d'authentification personnalisé (pas Supabase Auth)

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

-- Note: Ces politiques sont publiques car l'application utilise
-- un système d'authentification personnalisé. La sécurité est gérée
-- au niveau de l'application (vérification des rôles dans le code).

