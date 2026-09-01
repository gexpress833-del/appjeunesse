// ============================================================================
// TESTIMONIALS SERVICE
// ============================================================================
// Gère les témoignages de la jeunesse
// ============================================================================

/**
 * Obtenir tous les témoignages actifs
 * @returns {Promise<Array>} Liste des témoignages
 */
async function getAllActiveTestimonials() {
  const { data, error } = await window.supabase
    .from('temoignages')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erreur récupération témoignages:', error);
    throw error;
  }

  return data;
}

/**
 * Obtenir tous les témoignages (y compris inactifs pour l'admin)
 * @returns {Promise<Array>} Liste des témoignages
 */
async function getAllTestimonials() {
  const { data, error } = await window.supabase
    .from('temoignages')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erreur récupération témoignages:', error);
    throw error;
  }

  return data;
}

/**
 * Obtenir un témoignage par ID
 * @param {number} id - ID du témoignage
 * @returns {Promise<Object>} Témoignage
 */
async function getTestimonialById(id) {
  const { data, error } = await window.supabase
    .from('temoignages')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('Erreur récupération témoignage par ID:', error);
    throw error;
  }

  return data;
}

/**
 * Créer un témoignage
 * @param {Object} testimonial - Données du témoignage
 * @returns {Promise<Object>} Témoignage créé
 */
async function createTestimonial(testimonial) {
  const { data, error } = await window.supabase
    .from('temoignages')
    .insert(testimonial)
    .select()
    .single();

  if (error) {
    console.error('Erreur création témoignage:', error);
    throw error;
  }

  return data;
}

/**
 * Mettre à jour un témoignage
 * @param {number} id - ID du témoignage
 * @param {Object} updates - Données à mettre à jour
 * @returns {Promise<Object>} Témoignage mis à jour
 */
async function updateTestimonial(id, updates) {
  const { data, error } = await window.supabase
    .from('temoignages')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Erreur mise à jour témoignage:', error);
    throw error;
  }

  return data;
}

/**
 * Supprimer un témoignage
 * @param {number} id - ID du témoignage
 * @returns {Promise<boolean>} Succès
 */
async function deleteTestimonial(id) {
  const { error } = await window.supabase
    .from('temoignages')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Erreur suppression témoignage:', error);
    throw error;
  }

  return true;
}

// Export du service
window.testimonialsService = {
  getAllActiveTestimonials,
  getAllTestimonials,
  getTestimonialById,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial
};
