-- Ajouter la colonne phone à la table users si elle n'existe pas
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

