-- Script SQL pour créer les tables de live stream (chat et likes)
-- Exécuter ce script dans l'éditeur SQL de Supabase

-- Table pour les commentaires du live stream
CREATE TABLE IF NOT EXISTS live_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  stream_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table pour les likes du live stream
CREATE TABLE IF NOT EXISTS live_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  stream_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (stream_id, user_id)
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_live_comments_stream_id ON live_comments(stream_id);
CREATE INDEX IF NOT EXISTS idx_live_comments_created_at ON live_comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_live_likes_stream_id ON live_likes(stream_id);
CREATE INDEX IF NOT EXISTS idx_live_likes_user_id ON live_likes(user_id);

-- Activer Row Level Security (RLS)
ALTER TABLE live_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_likes ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour live_comments
-- Tout le monde peut lire les commentaires
CREATE POLICY "Tout le monde peut lire les commentaires"
ON live_comments FOR SELECT
USING (true);

-- Seuls les utilisateurs authentifiés peuvent insérer des commentaires
CREATE POLICY "Utilisateurs authentifiés peuvent insérer des commentaires"
ON live_comments FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Les utilisateurs peuvent supprimer leurs propres commentaires
CREATE POLICY "Utilisateurs peuvent supprimer leurs propres commentaires"
ON live_comments FOR DELETE
USING (auth.uid() = user_id);

-- Politiques RLS pour live_likes
-- Tout le monde peut lire les likes
CREATE POLICY "Tout le monde peut lire les likes"
ON live_likes FOR SELECT
USING (true);

-- Seuls les utilisateurs authentifiés peuvent insérer des likes
CREATE POLICY "Utilisateurs authentifiés peuvent insérer des likes"
ON live_likes FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Les utilisateurs peuvent supprimer leurs propres likes
CREATE POLICY "Utilisateurs peuvent supprimer leurs propres likes"
ON live_likes FOR DELETE
USING (auth.uid() = user_id);

-- Activer Supabase Realtime sur les tables
ALTER PUBLICATION supabase_realtime ADD TABLE live_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE live_likes;

-- Commentaire pour confirmer l'activation
COMMENT ON TABLE live_comments IS 'Table pour les commentaires du live stream avec Realtime activé';
COMMENT ON TABLE live_likes IS 'Table pour les likes du live stream avec Realtime activé';
