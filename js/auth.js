const sectionAccess = {
  dashboard: ["admin", "secretariat", "responsable", "user"],
  members: ["admin", "secretariat", "responsable", "user"],
  departments: ["admin"],
  events: ["admin", "secretariat", "responsable", "user"], // Tous peuvent voir les événements
  attendances: ["admin", "secretariat", "responsable", "user"],
  users: ["admin", "secretariat"], // Admin pour attribution rôles, Secrétaire pour création comptes
  userCreation: ["secretariat"], // SEUL le secrétaire peut créer des comptes
  roleAssignment: ["admin"], // SEUL l'admin peut attribuer des rôles
  homeContent: ["admin", "secretariat"] // Gestion du contenu d'accueil
};

const listenerQueue = [];
let currentRole = localStorage.getItem("appRole") || "admin";
let currentDepartmentScope = localStorage.getItem("appDept") || null;
let notificationEl = null;
let deptSelectEl = null;
let deptContainerEl = null;

function getRoleContext() {
  return { currentRole, currentDepartmentScope };
}

function notifyRoleListeners() {
  listenerQueue.forEach((listener) => listener(getRoleContext()));
}

function showNotification(type, message) {
  // Use new notification system if available
  if (window.notificationSystem) {
    window.notificationSystem.show(type, message);
    return;
  }
  
  // Fallback to old system
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
  if (currentRole !== "responsable") {
    setDeptScope(null);
  } else if (!currentDepartmentScope && window.appState?.departments?.length) {
    setDeptScope(window.appState.departments[0]);
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
  if (resource === "dashboard") return true;
  if (resource === "members") {
    if (action === "view") return ["admin", "secretariat", "responsable", "user"].includes(currentRole);
    if (["create", "update", "delete"].includes(action)) {
      if (["admin", "secretariat"].includes(currentRole)) return true;
      if (currentRole === "responsable") {
        return targetDept === currentDepartmentScope;
      }
      return false;
    }
  }
  if (resource === "departments") {
    return currentRole === "admin";
  }
  if (resource === "events") {
    if (action === "view") return ["admin", "secretariat", "responsable", "user"].includes(currentRole);
    // Seuls admin et secretariat peuvent créer/modifier/supprimer
    return ["admin", "secretariat"].includes(currentRole);
  }
  if (resource === "attendances") {
    if (action === "view") return ["admin", "secretariat", "responsable", "user"].includes(currentRole);
    if (["create", "update", "delete"].includes(action)) {
      if (["admin", "secretariat"].includes(currentRole)) return true;
      if (currentRole === "responsable" && targetDept) {
        return targetDept === currentDepartmentScope;
      }
      return false;
    }
  }
  return false;
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
    roleSelectEl.value = currentRole;
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
  
  // Attendre que appState soit chargé
  if (!window.appState || !window.appState.departments) {
    // Si les départements ne sont pas encore chargés, attendre un peu
    setTimeout(() => ensureDepartmentOptions(select), 100);
    return;
  }
  
  const currentOptions = Array.from(select.options).map((opt) => opt.value);
  const currentValue = select.value;
  select.innerHTML = "";
  
  // Ajouter une option par défaut si nécessaire
  if (select.id === 'memberDeptSelect' || select.id === 'newUserDept') {
    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "Choisir un département...";
    select.appendChild(defaultOption);
  }
  
  // Ajouter les départements
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
  
  // Restaurer la valeur précédente si elle existe toujours
  if (currentValue && Array.from(select.options).some(opt => opt.value === currentValue)) {
    select.value = currentValue;
  } else if (currentDepartmentScope && departments.includes(currentDepartmentScope)) {
    select.value = currentDepartmentScope;
  }
}

// Initialize auth variables from localStorage without modifying them
function initAuthFromStorage() {
  currentRole = localStorage.getItem("appRole") || "user";
  currentDepartmentScope = localStorage.getItem("appDept") || null;
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
  initAuthFromStorage
};

