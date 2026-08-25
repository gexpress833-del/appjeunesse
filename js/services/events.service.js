// ============================================================================
// EVENTS SERVICE
// ============================================================================
// Gère les événements
// ============================================================================

const supabase = window.supabase;

/**
 * Obtenir tous les événements
 * @returns {Promise<Array>} Liste des événements
 */
async function getAllEvents() {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('date', { ascending: false });

  if (error) {
    console.error('Erreur récupération événements:', error);
    throw error;
  }

  return data;
}

/**
 * Obtenir un événement par ID
 * @param {number} id - ID de l'événement
 * @returns {Promise<Object>} Événement
 */
async function getEventById(id) {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Erreur récupération événement par ID:', error);
    throw error;
  }

  return data;
}

/**
 * Créer un événement
 * @param {Object} event - Données de l'événement
 * @returns {Promise<Object>} Événement créé
 */
async function createEvent(event) {
  const { data, error } = await supabase
    .from('events')
    .insert(event)
    .select()
    .single();

  if (error) {
    console.error('Erreur création événement:', error);
    throw error;
  }

  return data;
}

/**
 * Mettre à jour un événement
 * @param {number} id - ID de l'événement
 * @param {Object} updates - Données à mettre à jour
 * @returns {Promise<Object>} Événement mis à jour
 */
async function updateEvent(id, updates) {
  const { data, error } = await supabase
    .from('events')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Erreur mise à jour événement:', error);
    throw error;
  }

  return data;
}

/**
 * Supprimer un événement
 * @param {number} id - ID de l'événement
 * @returns {Promise<boolean>} Succès
 */
async function deleteEvent(id) {
  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Erreur suppression événement:', error);
    throw error;
  }

  return true;
}

// Export du service
window.eventsService = {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent
};
