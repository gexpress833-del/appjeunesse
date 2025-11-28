// Module Supabase pour la gestion des données
// Assurez-vous d'inclure la bibliothèque Supabase dans votre HTML:
// <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

let supabaseClient = null;

// Initialiser le client Supabase
function initSupabase() {
  if (typeof supabase === 'undefined') {
    console.error('❌ Bibliothèque Supabase non chargée. Ajoutez: <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>');
    return null;
  }

  if (!window.SUPABASE_CONFIG) {
    console.error('❌ Configuration Supabase non trouvée. Chargez js/config.js avant js/supabase.js');
    return null;
  }

  try {
    supabaseClient = supabase.createClient(
      window.SUPABASE_CONFIG.url,
      window.SUPABASE_CONFIG.anonKey
    );
    console.log('✅ Client Supabase initialisé');
    return supabaseClient;
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation de Supabase:', error);
    return null;
  }
}

// Obtenir le client Supabase
function getSupabaseClient() {
  if (!supabaseClient) {
    return initSupabase();
  }
  return supabaseClient;
}

// ==================== GESTION DES UTILISATEURS ====================

async function getUsers() {
  const client = getSupabaseClient();
  if (!client) return [];

  try {
    const { data, error } = await client
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs:', error);
    return [];
  }
}

async function getUserByUsername(username) {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('users')
      .select('*')
      .eq('username', username)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur:', error);
    return null;
  }
}

async function createUser(userData) {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('users')
      .insert([{
        username: userData.username,
        name: userData.name,
        email: userData.email,
        password: userData.password, // Note: En production, hash le mot de passe
        role: userData.role || null,
        status: userData.status || 'pending',
        dept: userData.dept || null,
        birth_date: userData.birthDate || null,
        address: userData.address || null,
        profile_photo_url: userData.profilePhotoUrl || null,
        created_by: userData.createdBy || null,
        notes: userData.notes || null
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Erreur lors de la création de l\'utilisateur:', error);
    throw error;
  }
}

async function updateUser(username, updates) {
  const client = getSupabaseClient();
  if (!client) {
    console.error('❌ Client Supabase non disponible');
    return null;
  }

  try {
    const updateData = {};
    if (updates.role !== undefined) updateData.role = updates.role;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.dept !== undefined) updateData.dept = updates.dept;
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.email !== undefined) updateData.email = updates.email;
    if (updates.password !== undefined) updateData.password = updates.password;
    if (updates.phone !== undefined) updateData.phone = updates.phone;
    if (updates.birthDate !== undefined) updateData.birth_date = updates.birthDate;
    if (updates.address !== undefined) updateData.address = updates.address;
    if (updates.profilePhotoUrl !== undefined) updateData.profile_photo_url = updates.profilePhotoUrl;
    if (updates.notes !== undefined) updateData.notes = updates.notes;
    if (updates.roleAssignedBy !== undefined) updateData.role_assigned_by = updates.roleAssignedBy;
    if (updates.statusChangedBy !== undefined) updateData.status_changed_by = updates.statusChangedBy;

    console.log('📝 Mise à jour utilisateur:', username, updateData); // Debug

    const { data, error } = await client
      .from('users')
      .update(updateData)
      .eq('username', username)
      .select()
      .single();

    if (error) {
      console.error('❌ Erreur Supabase lors de la mise à jour:', error);
      throw error;
    }
    
    console.log('✅ Utilisateur mis à jour avec succès:', data); // Debug
    return data;
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour de l\'utilisateur:', error);
    throw error;
  }
}

async function deleteUser(username) {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client
      .from('users')
      .delete()
      .eq('username', username);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'utilisateur:', error);
    return false;
  }
}

// ==================== GESTION DES MEMBRES ====================

async function getMembers() {
  const client = getSupabaseClient();
  if (!client) return [];

  try {
    const { data, error } = await client
      .from('members')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Erreur lors de la récupération des membres:', error);
    return [];
  }
}

async function getMemberById(id) {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('members')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Erreur lors de la récupération du membre:', error);
    return null;
  }
}

async function createMember(memberData) {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('members')
      .insert([{
        name: memberData.name,
        dept: memberData.dept,
        role: memberData.role || 'user',
        phone: memberData.phone || null,
        email: memberData.email || null,
        birth_date: memberData.birthDate || null,
        address: memberData.address || null,
        notes: memberData.notes || null
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Erreur lors de la création du membre:', error);
    throw error;
  }
}

async function updateMember(id, updates) {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const updateData = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.dept !== undefined) updateData.dept = updates.dept;
    if (updates.role !== undefined) updateData.role = updates.role;
    if (updates.phone !== undefined) updateData.phone = updates.phone;
    if (updates.email !== undefined) updateData.email = updates.email;
    if (updates.birthDate !== undefined) updateData.birth_date = updates.birthDate;
    if (updates.address !== undefined) updateData.address = updates.address;
    if (updates.notes !== undefined) updateData.notes = updates.notes;

    const { data, error } = await client
      .from('members')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Erreur lors de la mise à jour du membre:', error);
    throw error;
  }
}

async function deleteMember(id) {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client
      .from('members')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Erreur lors de la suppression du membre:', error);
    return false;
  }
}

// ==================== GESTION DES DÉPARTEMENTS ====================

async function getDepartments() {
  const client = getSupabaseClient();
  if (!client) return [];

  try {
    const { data, error } = await client
      .from('departments')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    return (data || []).map(d => d.name);
  } catch (error) {
    console.error('Erreur lors de la récupération des départements:', error);
    return [];
  }
}

async function createDepartment(name) {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('departments')
      .insert([{ name }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Erreur lors de la création du département:', error);
    throw error;
  }
}

async function deleteDepartment(name) {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client
      .from('departments')
      .delete()
      .eq('name', name);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Erreur lors de la suppression du département:', error);
    return false;
  }
}

// ==================== GESTION DES ÉVÉNEMENTS ====================

async function getEvents() {
  const client = getSupabaseClient();
  if (!client) return [];

  try {
    const { data, error } = await client
      .from('events')
      .select('*')
      .order('date', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Erreur lors de la récupération des événements:', error);
    return [];
  }
}

async function getEventById(id) {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('events')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'événement:', error);
    return null;
  }
}

async function createEvent(eventData) {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('events')
      .insert([{
        name: eventData.name,
        date: eventData.date,
        description: eventData.description || null,
        photo_url: eventData.photoUrl || null
      }])
      .select()
      .single();

    if (error) {
      console.error('Erreur Supabase lors de la création de l\'événement:', error);
      throw new Error(error.message || 'Erreur lors de la création de l\'événement');
    }
    return data;
  } catch (error) {
    console.error('Erreur lors de la création de l\'événement:', error);
    throw error;
  }
}

async function updateEvent(id, updates) {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const updateData = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.date !== undefined) updateData.date = updates.date;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.photoUrl !== undefined) updateData.photo_url = updates.photoUrl;

    const { data, error } = await client
      .from('events')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'événement:', error);
    throw error;
  }
}

async function deleteEvent(id) {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client
      .from('events')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'événement:', error);
    return false;
  }
}

// ==================== GESTION DES PRÉSENCES ====================

async function getAttendances() {
  const client = getSupabaseClient();
  if (!client) return [];

  try {
    const { data, error } = await client
      .from('attendances')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Erreur lors de la récupération des présences:', error);
    return [];
  }
}

async function getAttendanceById(id) {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('attendances')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Erreur lors de la récupération de la présence:', error);
    return null;
  }
}

// Mapper les codes de statut vers les valeurs attendues par Supabase
function mapAttendanceStatus(status) {
  const statusMap = {
    'P': 'present',
    'A': 'absent',
    'AJ': 'excused',
    'L': 'late',
    // Valeurs déjà correctes
    'present': 'present',
    'absent': 'absent',
    'excused': 'excused',
    'late': 'late'
  };
  return statusMap[status] || 'present';
}

// Mapper les valeurs Supabase vers les codes d'affichage
function unmapAttendanceStatus(status) {
  const statusMap = {
    'present': 'P',
    'absent': 'A',
    'excused': 'AJ',
    'late': 'L'
  };
  return statusMap[status] || status;
}

async function createAttendance(attendanceData) {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    // Mapper le statut vers le format attendu par Supabase
    const mappedStatus = mapAttendanceStatus(attendanceData.status);
    
    const { data, error } = await client
      .from('attendances')
      .insert([{
        member_id: attendanceData.memberId,
        event_id: attendanceData.eventId,
        status: mappedStatus,
        notes: attendanceData.notes || null
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Erreur lors de la création de la présence:', error);
    throw error;
  }
}

async function updateAttendance(id, updates) {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const updateData = {};
    if (updates.status !== undefined) {
      // Mapper le statut vers le format attendu par Supabase
      updateData.status = mapAttendanceStatus(updates.status);
    }
    if (updates.notes !== undefined) updateData.notes = updates.notes;

    const { data, error } = await client
      .from('attendances')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la présence:', error);
    throw error;
  }
}

async function deleteAttendance(id) {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client
      .from('attendances')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Erreur lors de la suppression de la présence:', error);
    return false;
  }
}

// ==================== CONTENU ACCUEIL ====================

/**
 * Récupérer le contenu actif d'un type donné pour la page d'accueil
 * @param {'verse'|'testimony'|'video'} type
 */
async function getHomeContent(type) {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('home_contents')
      .select('*')
      .eq('type', type)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) throw error;
    if (!data || !data.length) return null;
    return data[0];
  } catch (error) {
    console.error('Erreur lors de la récupération du contenu d\'accueil:', error);
    return null;
  }
}

/**
 * Créer ou mettre à jour le contenu d'accueil pour un type donné
 * (réservé à l'admin / secrétariat au niveau de l'interface)
 */
async function upsertHomeContent(type, payload) {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('home_contents')
      .upsert({
        type,
        title: payload.title || null,
        subtitle: payload.subtitle || null,
        content: payload.content || null,
        reference: payload.reference || null,
        video_url: payload.videoUrl || null,
        author: payload.author || null,
        is_active: payload.isActive !== false // par défaut true
      }, { onConflict: 'type' })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement du contenu d\'accueil:', error);
    throw error;
  }
}

// ==================== EXPORT DES FONCTIONS ====================

window.supabaseDB = {
  // Initialisation
  init: initSupabase,
  getClient: getSupabaseClient,

  // Utilisateurs
  getUsers,
  getUserByUsername,
  createUser,
  updateUser,
  deleteUser,

  // Membres
  getMembers,
  getMemberById,
  createMember,
  updateMember,
  deleteMember,

  // Départements
  getDepartments,
  createDepartment,
  deleteDepartment,

  // Événements
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,

  // Présences
  getAttendances,
  getAttendanceById,
  createAttendance,
  updateAttendance,
  deleteAttendance,

  // Contenu accueil
  getHomeContent,
  upsertHomeContent,
  
  // Fonctions de mapping des statuts
  mapAttendanceStatus,
  unmapAttendanceStatus
};

