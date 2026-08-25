// ============================================================================
// DEPARTMENTS SERVICE
// ============================================================================
// Gère les départements
// ============================================================================

const supabase = window.supabase;

/**
 * Obtenir tous les départements
 * @returns {Promise<Array>} Liste des départements
 */
async function getAllDepartments() {
  const { data, error } = await supabase
    .from('departments')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('Erreur récupération départements:', error);
    throw error;
  }

  return data;
}

/**
 * Obtenir un département par nom
 * @param {string} name - Nom du département
 * @returns {Promise<Object>} Département
 */
async function getDepartmentByName(name) {
  const { data, error } = await supabase
    .from('departments')
    .select('*')
    .eq('name', name)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Erreur récupération département par nom:', error);
    throw error;
  }

  return data;
}

/**
 * Créer un département
 * @param {string} name - Nom du département
 * @returns {Promise<Object>} Département créé
 */
async function createDepartment(name) {
  const { data, error } = await supabase
    .from('departments')
    .insert({ name })
    .select()
    .single();

  if (error) {
    console.error('Erreur création département:', error);
    throw error;
  }

  return data;
}

/**
 * Mettre à jour un département
 * @param {string} id - ID du département
 * @param {Object} updates - Données à mettre à jour
 * @returns {Promise<Object>} Département mis à jour
 */
async function updateDepartment(id, updates) {
  const { data, error } = await supabase
    .from('departments')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Erreur mise à jour département:', error);
    throw error;
  }

  return data;
}

/**
 * Supprimer un département
 * @param {string} id - ID du département
 * @returns {Promise<boolean>} Succès
 */
async function deleteDepartment(id) {
  const { error } = await supabase
    .from('departments')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Erreur suppression département:', error);
    throw error;
  }

  return true;
}

// Export du service
window.departmentsService = {
  getAllDepartments,
  getDepartmentByName,
  createDepartment,
  updateDepartment,
  deleteDepartment
};
