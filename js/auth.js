// ============================================================================
// AUTH - Gestion des rôles et permissions (Supabase Auth)
// ============================================================================
// Ce fichier gère le RBAC (Role-Based Access Control) et les permissions.
// L'authentification est gérée par Supabase Auth via js/services/auth.service.js
// ============================================================================

const sectionAccess = {
  dashboard: ["admin", "secretariat", "responsable", "user"],
  members: ["admin", "secretariat", "responsable", "user"],
  departments: ["admin"],
  events: ["admin", "secretariat", "responsable", "user"],
  attendances: ["admin", "secretariat", "responsable", "user"],
  users: ["admin", "secretariat"],
  userCreation: ["secretariat"],
  roleAssignment: ["admin"],
  homeContent: ["admin", "secretariat", "responsable", "user"]
};

const listenerQueue = [];
let currentRole = null;
let currentDepartmentScope = null;
let currentProfile = null;
let notificationEl = null;
let deptSelectEl = null;
let deptContainerEl = null;

function getRoleContext() {
  return { currentRole, currentDepartmentScope, currentProfile };
}

function notifyRoleListeners() {
  listenerQueue.forEach((listener) => listener(getRoleContext()));
}

function showNotification(type, message) {
  if (window.notificationSystem) {
    window.notificationSystem.show(type, message);
    return;
  }
  
  if (!notificationEl) return;
  notificationEl.textContent = message;
  notificationEl.className = `notifications ${type} show`;
  setTimeout(() => {
    notificationEl.classList.remove("show");
  }, 2500);
}

function setDeptScope(scope) {
  currentDepartmentScope = scope;
  if (scope) {
    localStorage.setItem("appDept", scope);
  } else {
    localStorage.removeItem("appDept");
  }
  notifyRoleListeners();
}

function setRole(role) {
  currentRole = role;
  localStorage.setItem("appRole", role);
  
  if (currentRole === "responsable") {
    if (!currentDepartmentScope && window.appState?.departments?.length) {
      setDeptScope(window.appState.departments[0]);
    }
  }
  applyNavPermissions();
  applyResponsableToggle();
  notifyRoleListeners();
}

function applyResponsableToggle() {
  if (!deptContainerEl) return;
  if (currentRole === "responsable") {
    deptContainerEl.style.display = "flex";
  } else {
    deptContainerEl.style.display = "none";
  }
}

function applyNavPermissions() {
  const navItems = document.querySelectorAll("[data-section]");
  navItems.forEach((item) => {
    const section = item.dataset.section;
    if (sectionAccess[section]?.includes(currentRole)) {
      item.classList.remove("hidden");
    } else {
      item.classList.add("hidden");
    }
  });
}

function registerRoleListener(fn) {
  if (typeof fn === "function") {
    listenerQueue.push(fn);
  }
}

function checkPermission(resource, action, targetDept) {
  // Utiliser le rôle Supabase s'il est disponible,
  // sinon utiliser le rôle synchronisé dans localStorage.
  const role = currentRole || localStorage.getItem("appRole");

  if (!role) {
    console.warn("❌ Aucun rôle utilisateur disponible");
    return false;
  }

  // ============================================================
  // DASHBOARD
  // ============================================================
  if (resource === "dashboard") {
    return true;
  }

  // ============================================================
  // MEMBRES
  // ============================================================
  if (resource === "members") {
    if (action === "view") {
      return [
        "admin",
        "secretariat",
        "responsable",
        "user"
      ].includes(role);
    }

    if (["create", "update", "delete"].includes(action)) {

      if (["admin", "secretariat"].includes(role)) {
        return true;
      }

      if (role === "responsable") {
        return targetDept === currentDepartmentScope;
      }

      return false;
    }
  }

  // ============================================================
  // DÉPARTEMENTS
  // ============================================================
  if (resource === "departments") {

    if (action === "view") {
      return [
        "admin",
        "secretariat",
        "responsable",
        "user"
      ].includes(role);
    }

    return role === "admin";
  }

  // ============================================================
  // ÉVÉNEMENTS
  // ============================================================
  if (resource === "events") {

    // Consultation
    if (action === "view") {
      return [
        "admin",
        "secretariat",
        "responsable",
        "user"
      ].includes(role);
    }

    // Création / modification / suppression
    if (["create", "update", "delete"].includes(action)) {
      return [
        "admin",
        "secretariat"
      ].includes(role);
    }

    return false;
  }

  // ============================================================
  // PRÉSENCES
  // ============================================================
  if (resource === "attendances") {

    if (action === "view") {
      return [
        "admin",
        "secretariat",
        "responsable",
        "user"
      ].includes(role);
    }

    if (["create", "update", "delete"].includes(action)) {

      if (["admin", "secretariat"].includes(role)) {
        return true;
      }

      if (
        role === "responsable" &&
        targetDept &&
        targetDept === currentDepartmentScope
      ) {
        return true;
      }

      return false;
    }
  }

  return false;
}

// Initialiser l'auth depuis Supabase
async function initAuthFromSupabase() {
  try {
    if (!window.authService) {
      console.warn('AuthService non disponible, utilisation du fallback localStorage');
      initAuthFromStorage();
      return;
    }

    const session = await window.authService.getSession();
    if (!session) {
      // Pas de session Supabase, essayer localStorage comme fallback
      console.warn('Pas de session Supabase, tentative de fallback localStorage');
      initAuthFromStorage();
      return;
    }

    const profile = await window.authService.getCurrentProfile();
    if (profile) {
      currentProfile = profile;
      currentRole = profile.role || 'user';
      currentDepartmentScope = profile.dept || null;
      
      // Synchroniser avec localStorage pour compatibilité
      localStorage.setItem("appRole", currentRole);
      localStorage.setItem("appLoginTime", Date.now().toString());
      if (currentDepartmentScope) {
        localStorage.setItem("appDept", currentDepartmentScope);
      }
    } else {
      // Session Supabase mais pas de profil, essayer localStorage
      console.warn('Session Supabase mais pas de profil, tentative de fallback localStorage');
      initAuthFromStorage();
    }
  } catch (error) {
    console.error('Erreur lors de l\'initialisation Supabase Auth:', error);
    // En cas d'erreur, essayer localStorage comme fallback
    initAuthFromStorage();
  }
}

// Fallback: initialiser depuis localStorage
function initAuthFromStorage() {
  currentRole = localStorage.getItem("appRole") || "user";
  currentDepartmentScope = localStorage.getItem("appDept") || null;
}

// Déconnexion
async function signOut() {
  try {
    if (window.authService) {
      await window.authService.signOut();
    }
  } catch (error) {
    console.error('Erreur lors de la déconnexion:', error);
  }
  
  // Nettoyer localStorage
  localStorage.removeItem("appRole");
  localStorage.removeItem("appUser");
  localStorage.removeItem("appUserName");
  localStorage.removeItem("appDept");
  localStorage.removeItem("appLoginTime");
  
  // Réinitialiser les variables
  currentRole = null;
  currentDepartmentScope = null;
  currentProfile = null;
  
  // Rediriger vers login
  window.location.href = 'login.html';
}

function initRoleControls(options = {}) {
  const { roleSelectId, deptSelectId, deptContainerSelector, navSelector, notificationId } = options;
  const roleSelectEl = document.getElementById(roleSelectId);
  notificationEl = notificationId ? document.getElementById(notificationId) : null;
  deptSelectEl = departmentSelect(deptSelectId);
  deptContainerEl = deptContainerSelector
    ? document.querySelector(deptContainerSelector)
    : null;

  if (roleSelectEl) {
    roleSelectEl.value = currentRole || 'user';
    roleSelectEl.addEventListener("change", (event) => {
      setRole(event.target.value);
    });
  }

  if (deptSelectEl) {
    deptSelectEl.addEventListener("change", (event) => {
      setDeptScope(event.target.value);
    });
    ensureDepartmentOptions(deptSelectEl);
    if (currentDepartmentScope && deptSelectEl.querySelector(`option[value="${currentDepartmentScope}"]`)) {
      deptSelectEl.value = currentDepartmentScope;
    } else if (deptSelectEl.options.length) {
      deptSelectEl.value = deptSelectEl.options[0].value;
      if (currentRole === "responsable" && !currentDepartmentScope) {
        setDeptScope(deptSelectEl.value);
      }
    }
  }

  if (navSelector) {
    const navItems = document.querySelectorAll(navSelector);
    navItems.forEach((item) => {
      const evenHandler = () => {
        navItems.forEach((child) => child.classList.remove("active"));
        item.classList.add("active");
      };
      item.addEventListener("click", evenHandler);
    });
  }

  applyNavPermissions();
  applyResponsableToggle();
  if (deptSelectEl && currentDepartmentScope) {
    deptSelectEl.value = currentDepartmentScope;
  }
}

function departmentSelect(id) {
  if (!id) return null;
  return document.getElementById(id);
}

function ensureDepartmentOptions(select) {
  if (!select) return;
  
  if (!window.appState || !window.appState.departments) {
    setTimeout(() => ensureDepartmentOptions(select), 100);
    return;
  }
  
  const currentOptions = Array.from(select.options).map((opt) => opt.value);
  const currentValue = select.value;
  select.innerHTML = "";
  
  if (select.id === 'memberDeptSelect' || select.id === 'newUserDept') {
    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "Choisir un département...";
    select.appendChild(defaultOption);
  }
  
  const departments = Array.isArray(window.appState.departments) 
    ? window.appState.departments 
    : [];
  
  departments.forEach((dept) => {
    const deptName = typeof dept === 'string' ? dept : (dept.name || dept);
    const option = document.createElement("option");
    option.value = deptName;
    option.textContent = deptName;
    select.appendChild(option);
  });
  
  if (currentValue && Array.from(select.options).some(opt => opt.value === currentValue)) {
    select.value = currentValue;
  } else if (currentDepartmentScope && departments.includes(currentDepartmentScope)) {
    select.value = currentDepartmentScope;
  }
}

window.auth = {
  initRoleControls,
  registerRoleListener,
  getRoleContext,
  checkPermission,
  showNotification,
  ensureDepartmentOptions,
  setRole,
  setDeptScope,
  applyNavPermissions,
  initAuthFromStorage,
  initAuthFromSupabase,
  signOut
};

