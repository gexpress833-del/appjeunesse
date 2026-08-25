// ============================================================================
// MEMBERS SERVICE
// ============================================================================
// Gère les membres
// ============================================================================

const supabase = window.supabase;

/**
 * Obtenir tous les membres
 * @returns {Promise<Array>} Liste des membres
 */
async function getAllMembers() {
  const { data, error } = await supabase
    .from('members')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('Erreur récupération membres:', error);
    throw error;
  }

  return data;
}

/**
 * Obtenir un membre par ID
 * @param {number} id - ID du membre
 * @returns {Promise<Object>} Membre
 */
async function getMemberById(id) {
  const { data, error } = await supabase
    .from('members')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Erreur récupération membre par ID:', error);
    throw error;
  }

  return data;
}

/**
 * Obtenir des membres par département
 * @param {string} dept - Nom du département
 * @returns {Promise<Array>} Liste des membres
 */
async function getMembersByDepartment(dept) {
  const { data, error } = await supabase
    .from('members')
    .select('*')
    .eq('dept', dept)
    .order('name', { ascending: true });

  if (error) {
    console.error('Erreur récupération membres par département:', error);
    throw error;
  }

  return data;
}

/**
 * Créer un membre
 * @param {Object} member - Données du membre
 * @returns {Promise<Object>} Membre créé
 */
async function createMember(member) {
  const { data, error } = await supabase
    .from('members')
    .insert(member)
    .select()
    .single();

  if (error) {
    console.error('Erreur création membre:', error);
    throw error;
  }

  return data;
}

/**
 * Mettre à jour un membre
 * @param {number} id - ID du membre
 * @param {Object} updates - Données à mettre à jour
 * @returns {Promise<Object>} Membre mis à jour
 */
async function updateMember(id, updates) {
  const { data, error } = await supabase
    .from('members')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Erreur mise à jour membre:', error);
    throw error;
  }

  return data;
}

/**
 * Supprimer un membre
 * @param {number} id - ID du membre
 * @returns {Promise<boolean>} Succès
 */
async function deleteMember(id) {
  const { error } = await supabase
    .from('members')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Erreur suppression membre:', error);
    throw error;
  }

  return true;
}

// Export du service
window.membersService = {
  getAllMembers,
  getMemberById,
  getMembersByDepartment,
  createMember,
  updateMember,
  deleteMember
};
