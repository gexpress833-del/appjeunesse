// ============================================================================
// PROFILES SERVICE
// ============================================================================
// Gère les profiles utilisateurs (table profiles liée à auth.users)
// ============================================================================

const supabase = window.supabase;

/**
 * Obtenir tous les profiles
 * @returns {Promise<Array>} Liste des profiles
 */
async function getAllProfiles() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erreur récupération profiles:', error);
    throw error;
  }

  return data;
}

/**
 * Obtenir un profile par username
 * @param {string} username - Username
 * @returns {Promise<Object>} Profile
 */
async function getProfileByUsername(username) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Profile non trouvé
    }
    console.error('Erreur récupération profile par username:', error);
    throw error;
  }

  return data;
}

/**
 * Obtenir un profile par ID
 * @param {string} id - ID du profile (UUID)
 * @returns {Promise<Object>} Profile
 */
async function getProfileById(id) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Erreur récupération profile par ID:', error);
    throw error;
  }

  return data;
}

/**
 * Créer un profile
 * @param {Object} profile - Données du profile
 * @returns {Promise<Object>} Profile créé
 */
async function createProfile(profile) {
  const { data, error } = await supabase
    .from('profiles')
    .insert(profile)
    .select()
    .single();

  if (error) {
    console.error('Erreur création profile:', error);
    throw error;
  }

  return data;
}

/**
 * Mettre à jour un profile
 * @param {string} id - ID du profile
 * @param {Object} updates - Données à mettre à jour
 * @returns {Promise<Object>} Profile mis à jour
 */
async function updateProfile(id, updates) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Erreur mise à jour profile:', error);
    throw error;
  }

  return data;
}

/**
 * Supprimer un profile
 * @param {string} id - ID du profile
 * @returns {Promise<boolean>} Succès
 */
async function deleteProfile(id) {
  const { error } = await supabase
    .from('profiles')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Erreur suppression profile:', error);
    throw error;
  }

  return true;
}

/**
 * Mettre à jour le rôle d'un utilisateur
 * @param {string} id - ID du profile
 * @param {string} role - Nouveau rôle
 * @param {string} assignedBy - Username de celui qui attribue le rôle
 * @returns {Promise<Object>} Profile mis à jour
 */
async function assignRole(id, role, assignedBy) {
  return updateProfile(id, {
    role,
    role_assigned_by: assignedBy,
    role_assigned_at: new Date().toISOString(),
    status: 'active'
  });
}

/**
 * Changer le statut d'un utilisateur
 * @param {string} id - ID du profile
 * @param {string} status - Nouveau statut
 * @param {string} changedBy - Username de celui qui change le statut
 * @returns {Promise<Object>} Profile mis à jour
 */
async function changeStatus(id, status, changedBy) {
  return updateProfile(id, {
    status,
    status_changed_by: changedBy,
    status_changed_at: new Date().toISOString()
  });
}

// Export du service
window.profilesService = {
  getAllProfiles,
  getProfileByUsername,
  getProfileById,
  createProfile,
  updateProfile,
  deleteProfile,
  assignRole,
  changeStatus
};
