const attendanceForm = document.getElementById("attendanceForm");
const attendanceMemberSelect = document.getElementById("attendanceMemberSelect");
const attendanceEventSelect = document.getElementById("attendanceEventSelect");
const attendanceStatus = document.getElementById("attendanceStatus");
const attendanceSubmit = document.getElementById("attendanceSubmit");
const attendanceCancel = document.getElementById("attendanceCancel");
const attendancesTable = document.getElementById("attendancesTable");

function resetAttendanceEditor() {
  attendanceForm.reset();
  delete attendanceForm.dataset.editing;
  attendanceSubmit.textContent = "Enregistrer";
  attendanceCancel.style.display = "none";
}

function getEventStatus(eventDate) {
  const today = new Date();
  const event = new Date(eventDate);
  
  // Reset time to compare only dates
  today.setHours(0, 0, 0, 0);
  event.setHours(0, 0, 0, 0);
  
  if (event.getTime() === today.getTime()) {
    return 'current';
  } else if (event > today) {
    return 'upcoming';
  } else {
    return 'past';
  }
}

function buildAttendanceOptions() {
  attendanceMemberSelect.innerHTML = "";
  attendanceEventSelect.innerHTML = "";
  
  const { currentRole, currentDepartmentScope } = auth.getRoleContext();
  const members = currentRole === "responsable" && currentDepartmentScope
    ? window.appState.members.filter((member) => member.dept === currentDepartmentScope)
    : window.appState.members;
    
  members.forEach((member) => {
    const option = document.createElement("option");
    option.value = member.id;
    option.textContent = `${member.name} — ${member.dept}`;
    attendanceMemberSelect.appendChild(option);
  });
  
  // Filter events: only show current (today) and past events for attendance recording
  const availableEvents = window.appState.events.filter((evt) => {
    const status = getEventStatus(evt.date);
    return status === 'current' || status === 'past';
  });
  
  if (availableEvents.length === 0) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "Aucun événement disponible pour enregistrer des présences";
    option.disabled = true;
    attendanceEventSelect.appendChild(option);
  } else {
    // Sort events: current first, then past (most recent first)
    availableEvents.sort((a, b) => {
      const statusA = getEventStatus(a.date);
      const statusB = getEventStatus(b.date);
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      
      if (statusA === statusB) {
        if (statusA === 'past') {
          return dateB - dateA; // Most recent past events first
        } else {
          return dateA - dateB; // Current events first
        }
      }
      
      // Current events before past events
      return statusA === 'current' ? -1 : 1;
    });
    
    availableEvents.forEach((evt) => {
      const status = getEventStatus(evt.date);
      const option = document.createElement("option");
      option.value = evt.id;
      option.textContent = `${evt.name} (${evt.date})${status === 'current' ? ' - AUJOURD\'HUI' : ''}`;
      attendanceEventSelect.appendChild(option);
    });
  }
  
  // Update event status help
  updateEventStatusHelp();
}

function updateEventStatusHelp() {
  const eventStatusHelp = document.getElementById("eventStatusHelp");
  const helpText = eventStatusHelp.querySelector(".help-text");
  
  if (!eventStatusHelp || !helpText) return;
  
  const selectedEventId = attendanceEventSelect.value;
  
  if (!selectedEventId) {
    eventStatusHelp.style.display = "none";
    return;
  }
  
  const selectedEvent = window.appState.events.find(evt => evt.id == selectedEventId);
  if (!selectedEvent) {
    eventStatusHelp.style.display = "none";
    return;
  }
  
  const status = getEventStatus(selectedEvent.date);
  
  switch (status) {
    case 'current':
      helpText.textContent = "✅ Événement en cours (aujourd'hui) - Présences autorisées";
      helpText.className = "help-text success";
      break;
    case 'past':
      helpText.textContent = "⏰ Événement passé - Présences autorisées";
      helpText.className = "help-text warning";
      break;
    case 'upcoming':
      helpText.textContent = "🚫 Événement à venir - Présences non autorisées";
      helpText.className = "help-text error";
      break;
  }
  
  eventStatusHelp.style.display = "block";
}

function renderAttendanceTable() {
  attendancesTable.innerHTML = "";
  if (!window.appState.attendances.length) {
    attendancesTable.innerHTML = "<tr><td colspan='5'>Aucune présence enregistrée</td></tr>";
    return;
  }
  const { currentRole, currentDepartmentScope } = auth.getRoleContext();
  const attendances = window.appState.attendances.filter((attendance) => {
    if (currentRole === "responsable" && currentDepartmentScope) {
      const member = window.appState.members.find((m) => m.id === attendance.memberId);
      return member?.dept === currentDepartmentScope;
    }
    return true;
  });
  if (!attendances.length) {
    attendancesTable.innerHTML = "<tr><td colspan='5'>Aucune présence autorisée</td></tr>";
    return;
  }
  attendances.forEach((attendance) => {
    const member = window.appState.members.find((m) => m.id === attendance.memberId);
    const eventInfo = window.appState.events.find((evt) => evt.id === attendance.eventId);
    if (!member || !eventInfo) return;
    const row = document.createElement("tr");
    const nameCell = document.createElement("td");
    nameCell.textContent = member.name;
    const deptCell = document.createElement("td");
    deptCell.textContent = member.dept;
    const eventCell = document.createElement("td");
    eventCell.textContent = eventInfo.name;
    const statusCell = document.createElement("td");
    const badge = document.createElement("span");
    badge.textContent = attendance.status;
    badge.className = `pill status-${attendance.status}`;
    statusCell.appendChild(badge);
    const actionsCell = document.createElement("td");
    const actionGroup = document.createElement("div");
    actionGroup.className = "actions";

    const canEdit = auth.checkPermission("attendances", "update", member.dept);
    const editButton = document.createElement("button");
    editButton.className = "secondary";
    editButton.textContent = "Modifier";
    editButton.disabled = !canEdit;
    editButton.addEventListener("click", () => {
      if (!canEdit) {
        auth.showNotification("error", "Permission refusée.");
        return;
      }
      attendanceMemberSelect.value = attendance.memberId;
      attendanceEventSelect.value = attendance.eventId;
      attendanceStatus.value = attendance.status;
      attendanceForm.dataset.editing = attendance.id;
      attendanceSubmit.textContent = "Mettre à jour";
      attendanceCancel.style.display = "inline-flex";
    });

    const canDelete = auth.checkPermission("attendances", "delete", member.dept);
    const deleteButton = document.createElement("button");
    deleteButton.className = "secondary";
    deleteButton.textContent = "Supprimer";
    deleteButton.disabled = !canDelete;
    deleteButton.addEventListener("click", () => {
      if (!canDelete) {
        auth.showNotification("error", "Permission refusée.");
        return;
      }
      window.appState.attendances = window.appState.attendances.filter(
        (record) => record.id !== attendance.id
      );
      saveData();
      renderAttendanceTable();
      auth.showNotification("success", "Présence supprimée.");
    });

    actionGroup.appendChild(editButton);
    actionGroup.appendChild(deleteButton);
    actionsCell.appendChild(actionGroup);

    row.appendChild(nameCell);
    row.appendChild(deptCell);
    row.appendChild(eventCell);
    row.appendChild(statusCell);
    row.appendChild(actionsCell);
    attendancesTable.appendChild(row);
  });
}

attendanceForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const memberId = parseInt(attendanceMemberSelect.value, 10);
  const eventId = parseInt(attendanceEventSelect.value, 10);
  const status = attendanceStatus.value;
  
  if (!memberId || !eventId || !status) {
    auth.showNotification("error", "Tous les champs sont requis.");
    return;
  }
  
  // Check if event is available for attendance recording
  const selectedEvent = window.appState.events.find(evt => evt.id === eventId);
  if (!selectedEvent) {
    auth.showNotification("error", "Événement introuvable.");
    return;
  }
  
  const eventStatus = getEventStatus(selectedEvent.date);
  if (eventStatus === 'upcoming') {
    auth.showNotification("error", "Impossible d'enregistrer des présences pour un événement à venir. Attendez le jour de l'événement.");
    return;
  }
  
  const member = window.appState.members.find((m) => m.id === memberId);
  if (!member) {
    auth.showNotification("error", "Membre invalide.");
    return;
  }
  
  const canCreate = auth.checkPermission("attendances", "create", member.dept);
  if (!canCreate) {
    auth.showNotification("error", "Pas la permission.");
    return;
  }
  
  const editingId = attendanceForm.dataset.editing;
  if (editingId) {
    const record = window.appState.attendances.find(
      (entry) => entry.id === parseInt(editingId, 10)
    );
    if (!record) {
      auth.showNotification("error", "Présence introuvable.");
      return;
    }
    if (!auth.checkPermission("attendances", "update", member.dept)) {
      auth.showNotification("error", "Pas la permission.");
      return;
    }
    record.memberId = memberId;
    record.eventId = eventId;
    record.status = status;
    
    const statusMessage = eventStatus === 'current' ? 
      "Présence mise à jour pour l'événement d'aujourd'hui." : 
      "Présence mise à jour pour l'événement passé.";
    auth.showNotification("success", statusMessage);
  } else {
    const duplicate = window.appState.attendances.some(
      (entry) => entry.memberId === memberId && entry.eventId === eventId
    );
    if (duplicate) {
      auth.showNotification("error", "Cette présence existe déjà.");
      return;
    }
    window.appState.attendances.push({
      id: generateId(window.appState.attendances),
      memberId,
      eventId,
      status
    });
    
    const statusMessage = eventStatus === 'current' ? 
      "Présence enregistrée pour l'événement d'aujourd'hui." : 
      "Présence enregistrée pour l'événement passé.";
    auth.showNotification("success", statusMessage);
  }
  saveData();
  resetAttendanceEditor();
  buildAttendanceOptions();
  renderAttendanceTable();
});

attendanceCancel.addEventListener("click", () => {
  resetAttendanceEditor();
});

function refreshAttendancePage() {
  buildAttendanceOptions();
  renderAttendanceTable();
  const allowed = auth.checkPermission("attendances", "create", auth.getRoleContext().currentDepartmentScope);
  attendanceMemberSelect.disabled = !allowed;
  attendanceEventSelect.disabled = !allowed;
  attendanceStatus.disabled = !allowed;
  attendanceSubmit.disabled = !allowed;
  attendanceCancel.disabled = !allowed;
}

// Add event listener for event selection change
if (attendanceEventSelect) {
  attendanceEventSelect.addEventListener('change', updateEventStatusHelp);
}

document.addEventListener("DOMContentLoaded", () => {
  auth.initRoleControls({
    roleSelectId: "roleSelect",
    deptSelectId: "responsableDeptSelect",
    deptContainerSelector: ".role-extra",
    navSelector: ".nav a",
    notificationId: "notifications"
  });
  refreshAttendancePage();
  auth.registerRoleListener(() => refreshAttendancePage());
});

