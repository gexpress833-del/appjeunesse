// Module de gestion des données - 100% Supabase
// L'application nécessite Supabase pour fonctionner

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

// Vérifier que Supabase est disponible
function checkSupabaseRequired() {
  if (!window.supabaseDB || !window.supabaseDB.getClient()) {
    console.error('❌ Supabase n\'est pas configuré. Veuillez configurer Supabase dans js/config.js');
    if (window.notificationSystem) {
      window.notificationSystem.error('Supabase n\'est pas configuré. L\'application ne peut pas fonctionner sans Supabase.');
    }
    return false;
  }
  return true;
}

// Initialisation des données depuis Supabase uniquement
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
      photo: event.photo_url // Pour compatibilité
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
      // Mapper le statut Supabase vers les codes d'affichage
      status: mapStatusToCode(attendance.status),
      notes: attendance.notes
    }));

    console.log('✅ Données chargées depuis Supabase:', {
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
    console.error('❌ Erreur lors du chargement depuis Supabase:', error);
    if (window.notificationSystem) {
      window.notificationSystem.error('Erreur lors du chargement des données depuis Supabase. Veuillez vérifier votre connexion.');
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
  if (!checkSupabaseRequired()) {
    return;
  }
  
  // Les données sont automatiquement synchronisées via les fonctions CRUD de Supabase
  // Cette fonction est maintenue pour compatibilité mais ne fait rien
  // car chaque opération CRUD synchronise directement avec Supabase
  console.log('💾 Les données sont synchronisées automatiquement avec Supabase via les opérations CRUD');
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
