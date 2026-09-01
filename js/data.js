// ============================================================================
// MODULE DE GESTION DES DONNÉES
// ============================================================================
// Ce fichier gère l'état de l'application et les mappings de données.
// Utilise window.supabaseDB (fourni par js/supabase.js)
// ============================================================================

const defaultDepartments = [
  "Chorale",
  "Intercession",
  "Accueil",
  "Médias",
  "DLB",
  "DCC",
  "DFF"
];

const appState = {
  members: [],
  departments: [],
  events: [],
  attendances: []
};

// Vérifier que le service est disponible
function checkSupabaseRequired() {
  if (!window.supabaseDB || !window.supabaseDB.getClient()) {
    console.error('❌ Service non configuré. Configurez window.SUPABASE_CONFIG avant le chargement.');
    if (window.notificationSystem) {
      window.notificationSystem.error('Erreur de connexion au service. Vérifiez votre configuration.');
    }
    return false;
  }
  return true;
}

// Initialisation des données depuis Supabase
async function initializeData() {
  if (!checkSupabaseRequired()) {
    return;
  }
  
  console.log('🔄 Chargement des données depuis Supabase...');
  
  try {
    // Charger toutes les données depuis Supabase
    const [members, departments, events, attendances] = await Promise.all([
      window.supabaseDB.getMembers(),
      window.supabaseDB.getDepartments(),
      window.supabaseDB.getEvents(),
      window.supabaseDB.getAttendances()
    ]);

    // Mapper les données Supabase vers le format de l'application
    appState.members = members.map((member) => ({
      id: member.id,
      name: member.name,
      dept: member.dept,
      role: member.role || "user",
      phone: member.phone,
      email: member.email,
      birthDate: member.birth_date,
      address: member.address,
      profilePhotoUrl: member.profile_photo_url,
      notes: member.notes
    }));

    // Normaliser les départements : s'assurer qu'ils sont des strings
    const normalizedDepartments = departments.length > 0 
      ? departments.map(dept => typeof dept === 'string' ? dept : (dept.name || dept))
      : [...defaultDepartments];
    
    appState.departments = normalizedDepartments;
    
    // Si aucun département, créer les départements par défaut
    if (appState.departments.length === 0) {
      for (const dept of defaultDepartments) {
        try {
          await window.supabaseDB.createDepartment(dept);
        } catch (error) {
          console.warn(`Département ${dept} existe déjà ou erreur:`, error);
        }
      }
      const newDepartments = await window.supabaseDB.getDepartments();
      appState.departments = newDepartments.map(dept => typeof dept === 'string' ? dept : (dept.name || dept));
    }
    
    appState.events = events.map((event) => ({
      id: event.id,
      name: event.name,
      date: event.date,
      description: event.description,
      photoUrl: event.photo_url,
      cloudinaryPublicId: event.cloudinary_public_id
    }));

    // Fonction helper pour mapper les statuts Supabase vers les codes d'affichage
    const mapStatusToCode = (status) => {
      const statusMap = {
        'present': 'P',
        'absent': 'A',
        'excused': 'AJ',
        'late': 'L'
      };
      return statusMap[status] || status;
    };
    
    appState.attendances = attendances.map((attendance) => ({
      id: attendance.id,
      memberId: attendance.member_id,
      eventId: attendance.event_id,
      status: mapStatusToCode(attendance.status),
      notes: attendance.notes
    }));

    console.log('✅ Données chargées:', {
      members: appState.members.length,
      departments: appState.departments.length,
      events: appState.events.length,
      attendances: appState.attendances.length
    });
    
    // Notifier immédiatement les dashboards / pages après le premier chargement
    if (window.onDataReloaded) {
      try {
        window.onDataReloaded();
      } catch (e) {
        console.warn('Erreur lors de l\'appel de onDataReloaded après initializeData:', e);
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du chargement des données:', error);
    if (window.notificationSystem) {
      window.notificationSystem.error('Erreur lors du chargement des données. Vérifiez votre connexion Supabase.');
    }
    throw error;
  }
}

// Fonction pour recharger les données depuis Supabase
async function reloadData() {
  await initializeData();
  // Notifier les listeners que les données ont changé
  if (window.onDataReloaded) {
    window.onDataReloaded();
  }
}

function generateId(collection) {
  if (!collection.length) return 1;
  return Math.max(...collection.map((item) => item.id)) + 1;
}

// Fonction de sauvegarde - synchronise avec Supabase
async function saveData() {
  // Les données sont synchronisées automatiquement via Supabase
  console.log('💾 Les données sont synchronisées via Supabase');
}

// Initialiser les données au chargement
// Attendre que Supabase soit initialisé
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(initializeData, 500); // Attendre que Supabase soit chargé
  });
} else {
  setTimeout(initializeData, 500);
}

window.appState = appState;
window.defaultDepartments = defaultDepartments;
window.saveData = saveData;
window.generateId = generateId;
window.initializeData = initializeData;
window.reloadData = reloadData;
