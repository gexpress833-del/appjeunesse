// ============================================================================
// ATTENDANCES SERVICE
// ============================================================================
// Gère les présences
// ============================================================================

const supabase = window.supabase;

/**
 * Obtenir toutes les présences
 * @returns {Promise<Array>} Liste des présences
 */
async function getAllAttendances() {
  const { data, error } = await supabase
    .from('attendances')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erreur récupération présences:', error);
    throw error;
  }

  return data;
}

/**
 * Obtenir les présences d'un membre
 * @param {number} memberId - ID du membre
 * @returns {Promise<Array>} Liste des présences
 */
async function getAttendancesByMember(memberId) {
  const { data, error } = await supabase
    .from('attendances')
    .select('*')
    .eq('member_id', memberId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erreur récupération présences du membre:', error);
    throw error;
  }

  return data;
}

/**
 * Obtenir les présences d'un événement
 * @param {number} eventId - ID de l'événement
 * @returns {Promise<Array>} Liste des présences
 */
async function getAttendancesByEvent(eventId) {
  const { data, error } = await supabase
    .from('attendances')
    .select('*')
    .eq('event_id', eventId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erreur récupération présences de l\'événement:', error);
    throw error;
  }

  return data;
}

/**
 * Obtenir une présence par membre et événement
 * @param {number} memberId - ID du membre
 * @param {number} eventId - ID de l'événement
 * @returns {Promise<Object>} Présence
 */
async function getAttendanceByMemberAndEvent(memberId, eventId) {
  const { data, error } = await supabase
    .from('attendances')
    .select('*')
    .eq('member_id', memberId)
    .eq('event_id', eventId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Erreur récupération présence:', error);
    throw error;
  }

  return data;
}

/**
 * Créer une présence
 * @param {Object} attendance - Données de la présence
 * @returns {Promise<Object>} Présence créée
 */
async function createAttendance(attendance) {
  const { data, error } = await supabase
    .from('attendances')
    .insert(attendance)
    .select()
    .single();

  if (error) {
    console.error('Erreur création présence:', error);
    throw error;
  }

  return data;
}

/**
 * Mettre à jour une présence
 * @param {number} id - ID de la présence
 * @param {Object} updates - Données à mettre à jour
 * @returns {Promise<Object>} Présence mise à jour
 */
async function updateAttendance(id, updates) {
  const { data, error } = await supabase
    .from('attendances')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Erreur mise à jour présence:', error);
    throw error;
  }

  return data;
}

/**
 * Supprimer une présence
 * @param {number} id - ID de la présence
 * @returns {Promise<boolean>} Succès
 */
async function deleteAttendance(id) {
  const { error } = await supabase
    .from('attendances')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Erreur suppression présence:', error);
    throw error;
  }

  return true;
}

// Export du service
window.attendancesService = {
  getAllAttendances,
  getAttendancesByMember,
  getAttendancesByEvent,
  getAttendanceByMemberAndEvent,
  createAttendance,
  updateAttendance,
  deleteAttendance
};
