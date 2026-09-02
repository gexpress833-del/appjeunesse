-- Script SQL pour créer une fonction RPC qui crée un utilisateur et son profile
-- Cette fonction utilise l'API Supabase Auth pour créer l'utilisateur, puis crée le profile
-- Exécuter ce script dans l'éditeur SQL de Supabase

-- Créer la fonction RPC pour créer un utilisateur avec son profile
CREATE OR REPLACE FUNCTION public.create_user_with_profile(
  p_email TEXT,
  p_password TEXT,
  p_username TEXT,
  p_full_name TEXT,
  p_birth_date DATE DEFAULT NULL,
  p_address TEXT DEFAULT NULL,
  p_role TEXT DEFAULT NULL,
  p_status TEXT DEFAULT 'pending',
  p_dept TEXT DEFAULT NULL,
  p_role_assigned_by TEXT DEFAULT NULL,
  p_role_assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  p_created_by TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
  v_profile JSON;
BEGIN
  -- Créer l'utilisateur via l'API Supabase Auth (nécessite service_role key)
  -- Cette partie doit être appelée depuis le client avec la clé service_role
  -- Pour l'instant, nous allons retourner les données pour que le client puisse créer l'utilisateur
  
  v_profile := json_build_object(
    'email', p_email,
    'username', p_username,
    'full_name', p_full_name,
    'birth_date', p_birth_date,
    'address', p_address,
    'role', p_role,
    'status', p_status,
    'dept', p_dept,
    'role_assigned_by', p_role_assigned_by,
    'role_assigned_at', p_role_assigned_at,
    'created_by', p_created_by,
    'notes', p_notes
  );
  
  RETURN v_profile;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Alternative: Créer une fonction qui peut être appelée après la création de l'utilisateur
CREATE OR REPLACE FUNCTION public.create_profile_for_user(
  p_user_id UUID,
  p_username TEXT,
  p_full_name TEXT,
  p_email TEXT,
  p_birth_date DATE DEFAULT NULL,
  p_address TEXT DEFAULT NULL,
  p_role TEXT DEFAULT NULL,
  p_status TEXT DEFAULT 'pending',
  p_dept TEXT DEFAULT NULL,
  p_role_assigned_by TEXT DEFAULT NULL,
  p_role_assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  p_created_by TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSON AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    username,
    full_name,
    email,
    birth_date,
    address,
    role,
    status,
    dept,
    role_assigned_by,
    role_assigned_at,
    status_changed_by,
    status_changed_at,
    notes,
    created_by,
    created_at,
    updated_at
  )
  VALUES (
    p_user_id,
    p_username,
    p_full_name,
    p_email,
    p_birth_date,
    p_address,
    p_role,
    p_status,
    p_dept,
    p_role_assigned_by,
    p_role_assigned_at,
    NULL,
    NULL,
    p_notes,
    p_created_by,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    birth_date = EXCLUDED.birth_date,
    address = EXCLUDED.address,
    role = EXCLUDED.role,
    status = EXCLUDED.status,
    dept = EXCLUDED.dept,
    role_assigned_by = EXCLUDED.role_assigned_by,
    role_assigned_at = EXCLUDED.role_assigned_at,
    notes = EXCLUDED.notes,
    updated_at = NOW();
  
  RETURN json_build_object('success', true, 'user_id', p_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Commentaires
COMMENT ON FUNCTION public.create_profile_for_user() IS 'Crée ou met à jour un profile pour un utilisateur existant dans auth.users';
