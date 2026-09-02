-- Script SQL pour ajouter les colonnes event_id et event_name à la table photos existante
-- Exécuter ce script dans l'éditeur SQL de Supabase

-- Ajouter les colonnes event_id et event_name
ALTER TABLE photos ADD COLUMN IF NOT EXISTS event_id TEXT;
ALTER TABLE photos ADD COLUMN IF NOT EXISTS event_name TEXT;

-- Créer l'index sur event_name pour optimiser les recherches
CREATE INDEX IF NOT EXISTS idx_photos_event_name ON photos(event_name);
