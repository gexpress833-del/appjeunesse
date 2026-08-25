// ============================================================================
// HOME CONTENTS SERVICE
// ============================================================================
// Gère le contenu de la page d'accueil
// ============================================================================

const supabase = window.supabase;

/**
 * Obtenir tous les contenus d'accueil
 * @returns {Promise<Array>} Liste des contenus
 */
async function getAllHomeContents() {
  const { data, error } = await supabase
    .from('home_contents')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erreur récupération contenus d\'accueil:', error);
    throw error;
  }

  return data;
}

/**
 * Obtenir le contenu actif par type
 * @param {string} type - Type de contenu (verse, testimony, video)
 * @returns {Promise<Object>} Contenu actif
 */
async function getActiveHomeContentByType(type) {
  const { data, error } = await supabase
    .from('home_contents')
    .select('*')
    .eq('type', type)
    .eq('is_active', true)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Erreur récupération contenu actif:', error);
    throw error;
  }

  return data;
}

/**
 * Obtenir un contenu par ID
 * @param {number} id - ID du contenu
 * @returns {Promise<Object>} Contenu
 */
async function getHomeContentById(id) {
  const { data, error } = await supabase
    .from('home_contents')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Erreur récupération contenu par ID:', error);
    throw error;
  }

  return data;
}

/**
 * Créer un contenu d'accueil
 * @param {Object} content - Données du contenu
 * @returns {Promise<Object>} Contenu créé
 */
async function createHomeContent(content) {
  const { data, error } = await supabase
    .from('home_contents')
    .insert(content)
    .select()
    .single();

  if (error) {
    console.error('Erreur création contenu d\'accueil:', error);
    throw error;
  }

  return data;
}

/**
 * Mettre à jour un contenu d'accueil
 * @param {number} id - ID du contenu
 * @param {Object} updates - Données à mettre à jour
 * @returns {Promise<Object>} Contenu mis à jour
 */
async function updateHomeContent(id, updates) {
  const { data, error } = await supabase
    .from('home_contents')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Erreur mise à jour contenu d\'accueil:', error);
    throw error;
  }

  return data;
}

/**
 * Supprimer un contenu d'accueil
 * @param {number} id - ID du contenu
 * @returns {Promise<boolean>} Succès
 */
async function deleteHomeContent(id) {
  const { error } = await supabase
    .from('home_contents')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Erreur suppression contenu d\'accueil:', error);
    throw error;
  }

  return true;
}

// Export du service
window.homeContentsService = {
  getAllHomeContents,
  getActiveHomeContentByType,
  getHomeContentById,
  createHomeContent,
  updateHomeContent,
  deleteHomeContent
};
