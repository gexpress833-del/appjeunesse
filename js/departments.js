const departmentForm = document.getElementById("departmentForm");
const departmentNameInput = document.getElementById("departmentName");
const departmentsTable = document.getElementById("departmentsTable");

function renderDepartmentsTable() {
  departmentsTable.innerHTML = "";
  window.appState.departments.forEach((dept) => {
    const row = document.createElement("tr");
    const nameCell = document.createElement("td");
    nameCell.textContent = dept;
    const actionCell = document.createElement("td");
    const deleteButton = document.createElement("button");
    deleteButton.className = "secondary";
    deleteButton.type = "button";
    deleteButton.textContent = "Supprimer";
    deleteButton.disabled = !auth.checkPermission("departments", "delete");
      deleteButton.addEventListener("click", async () => {
      if (!auth.checkPermission("departments", "delete")) {
        auth.showNotification("error", "Réservé à l'admin.");
        return;
      }
      
      // Vérifier que Supabase est disponible
      if (!window.supabaseDB || !window.supabaseDB.getClient()) {
        auth.showNotification("error", "Supabase n'est pas configuré.");
        return;
      }
      
      const hasMembers = window.appState.members.some((member) => member.dept === dept);
      if (hasMembers) {
        auth.showNotification("error", "Supprimez les membres de ce département d'abord.");
        return;
      }
      
      try {
        // Supprimer dans Supabase
        await window.supabaseDB.deleteDepartment(dept);
        
        // Recharger les données depuis Supabase
        await window.reloadData();
        
        renderDepartmentsTable();
        auth.showNotification("success", "Département supprimé.");
      } catch (error) {
        console.error('Erreur lors de la suppression du département:', error);
        auth.showNotification("error", "Erreur lors de la suppression du département.");
      }
    });
    actionCell.appendChild(deleteButton);
    row.appendChild(nameCell);
    row.appendChild(actionCell);
    departmentsTable.appendChild(row);
  });
}

departmentForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const name = departmentNameInput.value.trim();
  if (!name) {
    auth.showNotification("error", "Le nom est requis.");
    return;
  }
  if (!auth.checkPermission("departments", "create")) {
    auth.showNotification("error", "Réservé à l'admin.");
    return;
  }
  
  // Vérifier que Supabase est disponible
  if (!window.supabaseDB || !window.supabaseDB.getClient()) {
    auth.showNotification("error", "Supabase n'est pas configuré.");
    return;
  }
  
  try {
    // Vérifier les doublons
    const departments = await window.supabaseDB.getDepartments();
    const duplicate = departments.some(
      (dept) => dept.toLowerCase() === name.toLowerCase()
    );
    if (duplicate) {
      auth.showNotification("error", "Ce département existe déjà.");
      return;
    }
    
    // Créer dans Supabase
    await window.supabaseDB.createDepartment(name);
    
    // Recharger les données depuis Supabase
    await window.reloadData();
    
    departmentForm.reset();
    renderDepartmentsTable();
    auth.showNotification("success", "Département ajouté.");
  } catch (error) {
    console.error('Erreur lors de la création du département:', error);
    auth.showNotification("error", "Erreur lors de la création du département.");
  }
});

function refreshDepartmentPage() {
  renderDepartmentsTable();
  departmentNameInput.disabled = !auth.checkPermission("departments", "create");
  departmentForm.querySelector("button").disabled = !auth.checkPermission("departments", "create");
}

document.addEventListener("DOMContentLoaded", () => {
  auth.initRoleControls({
    roleSelectId: "roleSelect",
    deptSelectId: "responsableDeptSelect",
    deptContainerSelector: ".role-extra",
    navSelector: ".nav a",
    notificationId: "notifications"
  });
  auth.registerRoleListener(() => {
    refreshDepartmentPage();
  });
  refreshDepartmentPage();
});

