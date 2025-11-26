// Enhanced role page with session management
function updateRoleStats() {
  const membersCountEl = document.getElementById("roleStatMembers");
  const departmentsCountEl = document.getElementById("roleStatDepts");
  const eventsCountEl = document.getElementById("roleStatEvents");
  const attendanceCountEl = document.getElementById("roleStatAttendance");

  const { members, departments, events, attendances } = window.appState;
  if (membersCountEl) membersCountEl.textContent = members.length;
  if (departmentsCountEl) departmentsCountEl.textContent = departments.length;
  if (eventsCountEl) eventsCountEl.textContent = events.length;
  if (attendanceCountEl) {
    if (!attendances.length) {
      attendanceCountEl.textContent = "0 %";
    } else {
      const rate =
        (attendances.filter((record) => record.status === "P").length / attendances.length) * 100;
      attendanceCountEl.textContent = `${Math.round(rate)} %`;
    }
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
  const sessionTimeout = 24 * 60 * 60 * 1000;
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

function updateHeaderProfilePhoto(username, userName) {
  const headerPhoto = document.getElementById('headerProfilePhoto');
  const headerInitials = document.getElementById('headerInitials');
  
  if (!headerPhoto || !headerInitials) return;
  
  // Get user profile photo
  const profiles = JSON.parse(localStorage.getItem('userProfiles') || '{}');
  const userProfile = profiles[username] || {};
  
  if (userProfile.photo) {
    // Show photo
    headerPhoto.innerHTML = `<img src="${userProfile.photo}" alt="Photo de profil">`;
  } else {
    // Show initials
    const initials = userName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    headerPhoto.innerHTML = `<span id="headerInitials">${initials}</span>`;
  }
}

function setupLogoutButton() {
  const logoutBtn = document.querySelector('.logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      
      if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
        clearSession();
        window.location.href = 'login.html';
      }
    });
  }
}

function initRolePage(expectedRole) {
  // Check session validity
  if (!checkSessionValidity()) {
    alert('Votre session a expiré. Veuillez vous reconnecter.');
    window.location.href = 'login.html';
    return;
  }
  
  const currentRole = localStorage.getItem('appRole');
  const currentDept = localStorage.getItem('appDept');

  // Check if user has permission for this page
  // Special case for users page: accessible by both admin and secretariat
  if (expectedRole === 'users') {
    if (!['admin', 'secretariat'].includes(currentRole)) {
      alert('Vous n\'avez pas l\'autorisation d\'accéder à cette page.');
      window.location.href = getRoleHomePage(currentRole);
      return;
    }
  }
  // Special case for reports page: accessible by both admin and secretariat
  else if (expectedRole === 'reports') {
    if (!['admin', 'secretariat'].includes(currentRole)) {
      alert('Vous n\'avez pas l\'autorisation d\'accéder à cette page.');
      window.location.href = 'access-denied-reports.html';
      return;
    }
  } 
  else if (currentRole !== expectedRole) {
    alert('Vous n\'avez pas l\'autorisation d\'accéder à cette page.');
    window.location.href = getRoleHomePage(currentRole);
    return;
  }
  
  // Initialize auth system without changing the role
  if (window.auth) {
    // Initialize auth variables from localStorage
    if (typeof auth.initAuthFromStorage === 'function') {
      auth.initAuthFromStorage();
    }
    
    // Apply navigation permissions based on current role
    if (typeof auth.applyNavPermissions === 'function') {
      auth.applyNavPermissions();
    }
  }
  
  // Update UI
  updateWelcomeMessage();
  updateRoleStats();
  setupLogoutButton();
  
  // Show welcome notification
  if (window.notificationSystem) {
    const userName = localStorage.getItem('appUserName') || 'Utilisateur';
    const roleLabels = {
      'admin': 'Administrateur',
      'secretariat': 'Secrétariat', 
      'responsable': 'Responsable',
      'user': 'Utilisateur'
    };
    
    setTimeout(() => {
      window.notificationSystem.success(
        `Bienvenue ${userName} ! Vous êtes connecté en tant que ${roleLabels[currentRole] || currentRole}.`,
        { duration: 4000 }
      );
    }, 1000);
  }
  
  // Update role description
  const descriptionEl = document.getElementById("roleDescription");
  if (descriptionEl) {
    descriptionEl.textContent = describeRole(currentRole);
  }
  
  // Update department info for responsable
  if (currentRole === 'responsable' && currentDept) {
    const userDeptEl = document.getElementById("userDepartment");
    if (userDeptEl) {
      userDeptEl.textContent = currentDept;
    }
  }
  
  // Initialize auth system without role selector (since role is fixed after login)
  auth.setRole(currentRole, currentDept);
  auth.applyNavPermissions();
  
  auth.registerRoleListener(() => {
    updateRoleStats();
    const newRole = auth.getRoleContext().currentRole;
    if (descriptionEl) {
      descriptionEl.textContent = describeRole(newRole);
    }
  });
}

// Auto-initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  const bodyRole = document.body.dataset.pageRole || "user";
  initRolePage(bodyRole);
  
  // Periodic session check (every 5 minutes)
  setInterval(() => {
    if (!checkSessionValidity()) {
      alert('Votre session a expiré. Vous allez être redirigé vers la page de connexion.');
      window.location.href = 'login.html';
    }
  }, 5 * 60 * 1000);
});