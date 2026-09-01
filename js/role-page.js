// Enhanced role page with session management

// Check Supabase session validity
async function checkSupabaseSession() {
  try {
    if (!window.authService) {
      console.warn('AuthService non disponible');
      return false;
    }
    const session = await window.authService.getSession();
    return !!session;
  } catch (error) {
    console.error('Erreur lors de la vérification de la session Supabase:', error);
    return false;
  }
}

async function updateRoleStats() {
  const membersCountEl = document.getElementById("roleStatMembers");
  const departmentsCountEl = document.getElementById("roleStatDepts");
  const eventsCountEl = document.getElementById("roleStatEvents");
  const attendanceCountEl = document.getElementById("roleStatAttendance");

  if (!window.appState) return;

  const { members, departments, events, attendances } = window.appState;
  const currentRole = localStorage.getItem('appRole');
  const currentDept = localStorage.getItem('appDept');
  
  // Helper pour calculer un taux simple (présents / total)
  const computeRate = (list, total) => {
    if (!list.length || !total) return 0;
    const presentCount = list.filter((record) => record.status === "P").length;
    return Math.round((presentCount / total) * 100);
  };
  
  // --- Comptes de base ---
  if (currentRole === 'responsable' && currentDept) {
    const deptMembers = members.filter(m => m.dept === currentDept);
    if (membersCountEl) membersCountEl.textContent = deptMembers.length;
    if (departmentsCountEl) departmentsCountEl.textContent = "1";
    if (eventsCountEl) eventsCountEl.textContent = events.length;
  } else {
    if (membersCountEl) membersCountEl.textContent = members.length;
    if (departmentsCountEl) departmentsCountEl && (departmentsCountEl.textContent = departments.length);
    if (eventsCountEl) eventsCountEl.textContent = events.length;
  }
  
  // --- Taux de présence ---
  if (attendanceCountEl) {
    let relevantAttendances = attendances;
    let totalBase = attendances.length;
    
    if (currentRole === 'user') {
      // Taux personnel : seulement les présences de l'utilisateur
      try {
        const currentUsername = localStorage.getItem('appUser');
        if (currentUsername && window.supabaseDB && window.supabaseDB.getClient()) {
          const currentUser = await window.supabaseDB.getUserByUsername(currentUsername);
          if (currentUser) {
            const member = members.find(m => 
              m.name === currentUser.name || 
              m.email === currentUser.email ||
              m.name.toLowerCase().includes(currentUser.name.toLowerCase())
            );
            
            if (member) {
              const memberId = typeof member.id === 'string' ? parseInt(member.id) : member.id;
              relevantAttendances = attendances.filter(a => {
                const attMemberId = typeof a.memberId === 'string' ? parseInt(a.memberId) : a.memberId;
                return attMemberId === memberId;
              });
              totalBase = relevantAttendances.length;
            } else {
              relevantAttendances = [];
              totalBase = 0;
            }
          }
        }
      } catch (error) {
        console.warn('Erreur lors du calcul du taux de présence utilisateur:', error);
      }
    } else if (currentRole === 'responsable' && currentDept) {
      // Taux pour le responsable : uniquement les présences des membres de son département
      const deptMemberIds = members
        .filter(m => m.dept === currentDept)
        .map(m => m.id);
      relevantAttendances = attendances.filter(a => deptMemberIds.includes(a.memberId));
      totalBase = relevantAttendances.length;
    } else {
      // Admin / Secrétariat : taux global sur toutes les présences
      relevantAttendances = attendances;
      totalBase = attendances.length;
    }
    
    const rate = computeRate(relevantAttendances, totalBase);
    attendanceCountEl.textContent = `${rate} %`;
  }
}

function describeRole(role) {
  const roleCopy = {
    admin: "Contrôle complet sur tous les modules et gestion des utilisateurs",
    secretariat: "Gestion active des membres, événements et présences",
    responsable: "Suivi et gestion de votre département uniquement",
    user: "Consultation des données et présences en lecture seule"
  };
  return roleCopy[role] || "Accès limité";
}

function checkSessionValidity() {
  const loginTime = localStorage.getItem('appLoginTime');
  const currentRole = localStorage.getItem('appRole');
  
  if (!loginTime || !currentRole) {
    return false;
  }
  
  // Check session timeout (24 hours)
  const sessionTimeout = 7 * 24 * 60 * 60 * 1000; // 7 jours
  if (Date.now() - parseInt(loginTime) > sessionTimeout) {
    clearSession();
    return false;
  }
  
  return true;
}

function clearSession() {
  localStorage.removeItem('appRole');
  localStorage.removeItem('appUser');
  localStorage.removeItem('appUserName');
  localStorage.removeItem('appLoginTime');
  localStorage.removeItem('appDept');
}

function getRoleHomePage(role) {
  const rolePages = {
    admin: 'admin.html',
    secretariat: 'secretariat.html',
    responsable: 'responsable.html',
    user: 'user.html'
  };
  return rolePages[role] || 'login.html';
}

function updateWelcomeMessage() {
  const userName = localStorage.getItem('appUserName') || 'Utilisateur';
  const username = localStorage.getItem('appUser');
  
  // Update welcome message
  const welcomeElement = document.querySelector('.welcome-message');
  if (welcomeElement) {
    welcomeElement.textContent = `Bienvenue, ${userName}`;
  }
  
  // Update profile photo in header
  updateHeaderProfilePhoto(username, userName);
  
  // Update last login info
  const loginTime = localStorage.getItem('appLoginTime');
  const lastLoginEl = document.querySelector('.last-login');
  if (lastLoginEl && loginTime) {
    const loginDate = new Date(parseInt(loginTime));
    lastLoginEl.textContent = `Dernière connexion: ${loginDate.toLocaleString('fr-FR')}`;
  }
}

async function updateHeaderProfilePhoto(username, userName) {
  const headerPhoto = document.getElementById('headerProfilePhoto');
  const headerInitials = document.getElementById('headerInitials');
  
  if (!headerPhoto || !headerInitials) return;
  
  // Get user profile photo depuis Supabase
  let photoUrl = null;
  
  if (window.supabaseDB && window.supabaseDB.getClient() && window.storageManager) {
    try {
      photoUrl = await window.storageManager.getUserProfilePhotoUrl(username);
    } catch (error) {
      console.warn('Erreur lors de la récupération de la photo de profil:', error);
    }
  }
  
  if (photoUrl) {
    // Show photo
    headerPhoto.innerHTML = `<img src="${photoUrl}" alt="Photo de profil">`;
  } else {
    // Show initials
    const initials = userName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    headerPhoto.innerHTML = `<span id="headerInitials">${initials}</span>`;
  }
}

async function setupLogoutButton() {
  const logoutBtn = document.querySelector('.logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      
      if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
        try {
          // Déconnexion via l'API Supabase
          if (window.supabase && window.supabase.auth) {
            await window.supabase.auth.signOut();
          }

          // Nettoyage explicite des données de session
          localStorage.clear();
          sessionStorage.clear();

          // Redirection forcée
          window.location.replace('login.html');
        } catch (error) {
          console.error('Erreur lors de la déconnexion:', error);
          // En cas d'erreur, forcer tout de même le nettoyage et la redirection
          localStorage.clear();
          sessionStorage.clear();
          window.location.replace('login.html');
        }
      }
    });
  }
}

async function initRolePage(expectedRole) {
  try {
    console.log("🔐 Initialisation de la page :", expectedRole);

    // ============================================================
    // 1. Vérifier la session Supabase
    // ============================================================
    const hasValidSession = await checkSupabaseSession();

    if (!hasValidSession) {
      console.warn("⚠️ Aucune session Supabase, tentative de fallback localStorage");
      // Essayer localStorage comme fallback avant de rediriger
      const role = localStorage.getItem('appRole');
      if (role) {
        console.log("✅ Fallback localStorage réussi avec rôle:", role);
        // Continuer avec le rôle localStorage
      } else {
        console.warn("❌ Aucune session Supabase ni localStorage");
        // Rediriger seulement si vraiment pas de session
        window.location.href = 'login.html';
        return;
      }
    } else {
      console.log("✅ Session Supabase valide");
    }

    // ============================================================
    // 2. Récupérer le profil ET le rôle depuis Supabase
    // ============================================================
    if (window.auth && typeof window.auth.initAuthFromSupabase === 'function') {

      console.log("🔄 Récupération du profil depuis Supabase...");

      await window.auth.initAuthFromSupabase();

    } else {
      console.error("❌ auth.initAuthFromSupabase() indisponible");
    }

    // ============================================================
    // 3. Récupérer le rôle maintenant qu'il a été synchronisé
    // ============================================================
    const currentRole = localStorage.getItem('appRole');
    const currentDept = localStorage.getItem('appDept');

    console.log("🔐 Rôle après synchronisation :", currentRole);
    console.log("🎯 Rôle attendu :", expectedRole);

    // ============================================================
    // 4. Si aucun rôle n'est trouvé
    // ============================================================
    if (!currentRole) {
      console.error("❌ Aucun rôle trouvé dans le profil utilisateur");

      alert("Impossible de déterminer votre rôle. Veuillez vous reconnecter.");
      window.location.href = 'login.html';
      return;
    }

    // ============================================================
    // 5. Vérification des permissions
    // ============================================================

    // Page utilisateurs : admin + secrétariat
    if (expectedRole === 'users') {

      if (!['admin', 'secretariat'].includes(currentRole)) {

        alert("Vous n'avez pas l'autorisation d'accéder à cette page.");
        window.location.href = getRoleHomePage(currentRole);
        return;
      }
    }

    // Page rapports : admin + secrétariat
    else if (expectedRole === 'reports') {

      if (!['admin', 'secretariat'].includes(currentRole)) {

        alert("Vous n'avez pas l'autorisation d'accéder à cette page.");
        window.location.href = 'access-denied-reports.html';
        return;
      }
    }

    // Pages avec rôle précis
    else if (currentRole !== expectedRole) {

      console.error(
        `❌ Accès refusé : rôle actuel = "${currentRole}", rôle requis = "${expectedRole}"` 
      );

      alert("Vous n'avez pas l'autorisation d'accéder à cette page.");
      window.location.href = getRoleHomePage(currentRole);
      return;
    }

    // ============================================================
    // 6. Initialiser le système de rôle
    // ============================================================
    if (window.auth) {

      if (typeof auth.initAuthFromStorage === 'function') {
        auth.initAuthFromStorage();
      }

      if (typeof auth.applyNavPermissions === 'function') {
        auth.applyNavPermissions();
      }
    }

    // ============================================================
    // 7. Mettre à jour l'interface
    // ============================================================
    updateWelcomeMessage();

    updateRoleStats().catch(err => {
      console.error(
        "Erreur lors de la mise à jour des statistiques :",
        err
      );
    });

    setupLogoutButton();

    // ============================================================
    // 8. Notification de bienvenue
    // ============================================================
    if (window.notificationSystem) {

      const userName =
        localStorage.getItem('appUserName') || 'Utilisateur';

      const roleLabels = {
        admin: 'Administrateur',
        secretariat: 'Secrétariat',
        responsable: 'Responsable',
        user: 'Utilisateur'
      };

      setTimeout(() => {

        window.notificationSystem.success(
          `Bienvenue ${userName} ! Vous êtes connecté en tant que ${
            roleLabels[currentRole] || currentRole
          }.`,
          { duration: 4000 }
        );

      }, 1000);
    }

    // ============================================================
    // 9. Description du rôle
    // ============================================================
    const descriptionEl =
      document.getElementById("roleDescription");

    if (descriptionEl) {
      descriptionEl.textContent = describeRole(currentRole);
    }

    // ============================================================
    // 10. Département du responsable
    // ============================================================
    if (currentRole === 'responsable' && currentDept) {

      const userDeptEl =
        document.getElementById("userDepartment");

      if (userDeptEl) {
        userDeptEl.textContent = currentDept;
      }
    }

    // ============================================================
    // 11. Synchroniser le rôle
    // ============================================================
    if (window.auth) {

      auth.setRole(currentRole);

      auth.applyNavPermissions();

      auth.registerRoleListener(() => {

        updateRoleStats().catch(err =>
          console.error(
            "Erreur statistiques :",
            err
          )
        );

        const newRole =
          auth.getRoleContext().currentRole;

        if (descriptionEl) {
          descriptionEl.textContent =
            describeRole(newRole);
        }
      });
    }

    console.log("✅ Page initialisée avec succès");
    console.log("👤 Rôle :", currentRole);

  } catch (error) {

    console.error(
      "❌ Erreur lors de l'initialisation de la page :",
      error
    );

    alert(
      "Une erreur est survenue lors de la vérification de vos autorisations."
    );

    window.location.href = 'login.html';
  }
}

// Auto-initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  const bodyRole = document.body.dataset.pageRole || "user";
  initRolePage(bodyRole);
  
  // Mettre à jour les statistiques lorsque les données sont (re)chargées depuis Supabase
  if (window.onDataReloaded) {
    const originalReload = window.onDataReloaded;
    window.onDataReloaded = () => {
      try { originalReload(); } catch (e) { console.warn('Erreur onDataReloaded existant:', e); }
      updateRoleStats().catch(err => console.error('Erreur lors de la mise à jour des statistiques (reload):', err));
    };
  } else {
    window.onDataReloaded = () => {
      updateRoleStats().catch(err => console.error('Erreur lors de la mise à jour des statistiques (reload):', err));
    };
  }
  
  // Periodic session check (every 5 minutes)
  setInterval(() => {
    if (!checkSessionValidity()) {
      alert('Votre session a expiré. Vous allez être redirigé vers la page de connexion.');
      window.location.href = 'login.html';
    }
  }, 5 * 60 * 1000);
});