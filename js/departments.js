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
    deleteButton.addEventListener("click", () => {
      if (!auth.checkPermission("departments", "delete")) {
        auth.showNotification("error", "Réservé à l'admin.");
        return;
      }
      const hasMembers = window.appState.members.some((member) => member.dept === dept);
      if (hasMembers) {
        auth.showNotification("error", "Supprimez les membres de ce département d'abord.");
        return;
      }
      window.appState.departments = window.appState.departments.filter((name) => name !== dept);
      saveData();
      renderDepartmentsTable();
      auth.showNotification("success", "Département supprimé.");
    });
    actionCell.appendChild(deleteButton);
    row.appendChild(nameCell);
    row.appendChild(actionCell);
    departmentsTable.appendChild(row);
  });
}

departmentForm.addEventListener("submit", (event) => {
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
  const duplicate = window.appState.departments.some(
    (dept) => dept.toLowerCase() === name.toLowerCase()
  );
  if (duplicate) {
    auth.showNotification("error", "Ce département existe déjà.");
    return;
  }
  window.appState.departments.push(name);
  saveData();
  departmentForm.reset();
  renderDepartmentsTable();
  auth.showNotification("success", "Département ajouté.");
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

