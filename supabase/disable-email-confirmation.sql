-- Script SQL pour désactiver la confirmation par email
-- Cela permet aux utilisateurs de se connecter immédiatement après création
-- Exécuter ce script dans l'éditeur SQL de Supabase

-- Désactiver la confirmation par email pour les nouveaux utilisateurs
ALTER TABLE auth.users
ALTER COLUMN email_confirmed_at SET DEFAULT NOW();

-- Alternative: Utiliser un trigger pour confirmer automatiquement les emails
CREATE OR REPLACE FUNCTION public.auto_confirm_email()
RETURNS TRIGGER AS $$
BEGIN
  NEW.email_confirmed_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_user_created ON auth.users;
CREATE TRIGGER on_user_created
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_confirm_email();

COMMENT ON FUNCTION public.auto_confirm_email() IS 'Confirme automatiquement l''email des nouveaux utilisateurs';
