-- Script SQL pour créer la table live_streams et modifier les tables existantes
-- Exécuter ce script dans l'éditeur SQL de Supabase

-- Table pour gérer l'historique des live streams
CREATE TABLE IF NOT EXISTS live_streams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  stream_id TEXT UNIQUE NOT NULL, -- ID unique pour identifier le stream (utilisé pour les commentaires/likes)
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  is_live BOOLEAN DEFAULT true,
  view_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_live_streams_stream_id ON live_streams(stream_id);
CREATE INDEX IF NOT EXISTS idx_live_streams_started_at ON live_streams(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_live_streams_is_live ON live_streams(is_live);
CREATE INDEX IF NOT EXISTS idx_live_streams_created_by ON live_streams(created_by);

-- Activer Row Level Security (RLS)
ALTER TABLE live_streams ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour live_streams
-- Tout le monde peut lire les lives
CREATE POLICY "Tout le monde peut lire les lives"
ON live_streams FOR SELECT
USING (true);

-- Seuls les utilisateurs authentifiés peuvent créer des lives
CREATE POLICY "Utilisateurs authentifiés peuvent créer des lives"
ON live_streams FOR INSERT
WITH CHECK (auth.uid() = created_by);

-- Seuls les créateurs ou les admins peuvent modifier les lives
CREATE POLICY "Créateurs peuvent modifier leurs lives"
ON live_streams FOR UPDATE
USING (auth.uid() = created_by);

-- Seuls les créateurs ou les admins peuvent supprimer les lives
CREATE POLICY "Créateurs peuvent supprimer leurs lives"
ON live_streams FOR DELETE
USING (auth.uid() = created_by);

-- Insérer un enregistrement par défaut pour le stream_id 'main' (pour satisfaire les contraintes existantes)
INSERT INTO live_streams (title, description, video_url, stream_id, is_live, view_count)
VALUES (
  'Live Stream Principal',
  'Live stream principal pour les commentaires et likes existants',
  '',
  'main',
  false,
  0
)
ON CONFLICT (stream_id) DO NOTHING;

-- Modifier la table live_comments pour référencer live_streams
-- D'abord, supprimer les contraintes existantes si nécessaire
ALTER TABLE live_comments DROP CONSTRAINT IF EXISTS live_comments_stream_id_fkey;

-- Ajouter la clé étrangère vers live_streams
ALTER TABLE live_comments 
ADD CONSTRAINT live_comments_stream_id_fkey 
FOREIGN KEY (stream_id) REFERENCES live_streams(stream_id) ON DELETE CASCADE;

-- Modifier la table live_likes pour référencer live_streams
-- D'abord, supprimer les contraintes existantes si nécessaire
ALTER TABLE live_likes DROP CONSTRAINT IF EXISTS live_likes_stream_id_fkey;

-- Ajouter la clé étrangère vers live_streams
ALTER TABLE live_likes 
ADD CONSTRAINT live_likes_stream_id_fkey 
FOREIGN KEY (stream_id) REFERENCES live_streams(stream_id) ON DELETE CASCADE;

-- Activer Supabase Realtime sur la table live_streams
ALTER PUBLICATION supabase_realtime ADD TABLE live_streams;

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_live_streams_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour updated_at automatiquement
CREATE TRIGGER live_streams_updated_at
  BEFORE UPDATE ON live_streams
  FOR EACH ROW
  EXECUTE FUNCTION update_live_streams_updated_at();

-- Commentaire pour confirmer l'activation
COMMENT ON TABLE live_streams IS 'Table pour l''historique des live streams avec Realtime activé';
