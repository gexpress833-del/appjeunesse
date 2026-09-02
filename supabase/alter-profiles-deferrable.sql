-- Script SQL pour supprimer la contrainte de clé étrangère
-- La contrainte pose problème lors de la création d'utilisateur car auth.users n'est pas immédiatement disponible
-- Nous allons gérer la relation manuellement dans l'application
-- Exécuter ce script dans l'éditeur SQL de Supabase

-- Supprimer la contrainte de clé étrangère
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Ajouter un commentaire pour documenter que la relation est gérée manuellement
COMMENT ON COLUMN public.profiles.id IS 'ID de l''utilisateur (correspond à auth.users.id). La contrainte de clé étrangère a été supprimée pour permettre la création d''utilisateurs via l''API client.';
