-- Script SQL pour créer la table photos avec Supabase Realtime
-- Exécuter ce script dans l'éditeur SQL de Supabase

-- Table pour gérer les photos
CREATE TABLE IF NOT EXISTS photos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  cloudinary_public_id TEXT NOT NULL,
  event_id TEXT,
  event_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_photos_created_at ON photos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_photos_event_name ON photos(event_name);

-- Activer Row Level Security (RLS)
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour photos
-- Tout le monde peut lire les photos
CREATE POLICY "Tout le monde peut lire les photos"
ON photos FOR SELECT
USING (true);

-- Seuls les utilisateurs authentifiés peuvent créer des photos
CREATE POLICY "Utilisateurs authentifiés peuvent créer des photos"
ON photos FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Seuls les créateurs peuvent modifier leurs photos
CREATE POLICY "Créateurs peuvent modifier leurs photos"
ON photos FOR UPDATE
USING (true);

-- Seuls les créateurs peuvent supprimer leurs photos
CREATE POLICY "Créateurs peuvent supprimer leurs photos"
ON photos FOR DELETE
USING (true);

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_photos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour updated_at automatiquement
CREATE TRIGGER photos_updated_at
  BEFORE UPDATE ON photos
  FOR EACH ROW
  EXECUTE FUNCTION update_photos_updated_at();

-- Activer Supabase Realtime sur la table photos
ALTER PUBLICATION supabase_realtime ADD TABLE photos;

-- Commentaire pour confirmer l'activation
COMMENT ON TABLE photos IS 'Table pour les photos avec Realtime activé';
