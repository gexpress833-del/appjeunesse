let attendanceForm = null;
let attendanceMemberSelect = null;
let attendanceEventSelect = null;
let attendanceStatus = null;
let attendanceSubmit = null;
let attendanceCancel = null;
let attendancesTable = null;

function resetAttendanceEditor() {
  if (!attendanceForm) return;
  attendanceForm.reset();
  delete attendanceForm.dataset.editing;
  if (attendanceSubmit) attendanceSubmit.textContent = "Enregistrer";
  if (attendanceCancel) attendanceCancel.style.display = "none";
}

function getEventStatus(eventDate) {
  if (!eventDate) return 'past';
  
  try {
    // Obtenir la date d'aujourd'hui au format YYYY-MM-DD
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    // Normaliser la date de l'événement au format YYYY-MM-DD
    let eventDateStr;
    if (typeof eventDate === 'string') {
      // Si c'est déjà au format YYYY-MM-DD
      if (eventDate.match(/^\d{4}-\d{2}-\d{2}/)) {
        eventDateStr = eventDate.split('T')[0]; // Prendre seulement la partie date si c'est un datetime
      } else {
        // Parser la date et la reformater
        const dateObj = new Date(eventDate);
        eventDateStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
      }
    } else {
      // Si c'est un objet Date
      const dateObj = new Date(eventDate);
      eventDateStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
    }
    
    // Comparer les chaînes de dates (plus simple et fiable)
    if (eventDateStr === todayStr) {
      return 'current';
    } else if (eventDateStr > todayStr) {
      return 'upcoming';
    } else {
      return 'past';
    }
  } catch (error) {
    console.error('Erreur lors de la comparaison de dates:', error, eventDate);
    return 'past';
  }
}

function buildAttendanceOptions() {
  if (!attendanceMemberSelect || !attendanceEventSelect) return;
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
  console.log('📅 Événements disponibles:', window.appState.events.length); // Debug
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  console.log('📅 Date d\'aujourd\'hui:', todayStr); // Debug
  
  const availableEvents = window.appState.events.filter((evt) => {
    if (!evt || !evt.date) {
      console.warn('⚠️ Événement sans date:', evt);
      return false;
    }
    const status = getEventStatus(evt.date);
    console.log(`📅 Événement "${evt.name}" (${evt.date}): ${status}`); // Debug
    return status === 'current' || status === 'past';
  });
  
  console.log(`✅ Événements disponibles pour présences: ${availableEvents.length}`); // Debug
  
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
  if (!attendanceEventSelect) return;
  
  const eventStatusHelp = document.getElementById("eventStatusHelp");
  const helpText = eventStatusHelp ? eventStatusHelp.querySelector(".help-text") : null;
  
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
      if (attendanceMemberSelect) attendanceMemberSelect.value = attendance.memberId;
      if (attendanceEventSelect) attendanceEventSelect.value = attendance.eventId;
      if (attendanceStatus) attendanceStatus.value = attendance.status;
      if (attendanceForm) attendanceForm.dataset.editing = attendance.id;
      if (attendanceSubmit) attendanceSubmit.textContent = "Mettre à jour";
      if (attendanceCancel) attendanceCancel.style.display = "inline-flex";
    });

    const canDelete = auth.checkPermission("attendances", "delete", member.dept);
    const deleteButton = document.createElement("button");
    deleteButton.className = "secondary";
    deleteButton.textContent = "Supprimer";
    deleteButton.disabled = !canDelete;
    deleteButton.addEventListener("click", async () => {
      if (!canDelete) {
        auth.showNotification("error", "Permission refusée.");
        return;
      }
      // Supprimer dans Supabase
      if (window.supabaseDB && window.supabaseDB.getClient()) {
        try {
          await window.supabaseDB.deleteAttendance(attendance.id);
          // Recharger les données depuis Supabase
          await window.reloadData();
          renderAttendanceTable();
          auth.showNotification("success", "Présence supprimée.");
        } catch (error) {
          console.error('Erreur lors de la suppression de la présence:', error);
          auth.showNotification("error", "Erreur lors de la suppression de la présence.");
        }
      } else {
        auth.showNotification("error", "Supabase n'est pas configuré.");
      }
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

// Initialiser les éléments du formulaire et ajouter les event listeners
function initAttendanceForm() {
  attendanceForm = document.getElementById("attendanceForm");
  attendanceMemberSelect = document.getElementById("attendanceMemberSelect");
  attendanceEventSelect = document.getElementById("attendanceEventSelect");
  attendanceStatus = document.getElementById("attendanceStatus");
  attendanceSubmit = document.getElementById("attendanceSubmit");
  attendanceCancel = document.getElementById("attendanceCancel");
  attendancesTable = document.getElementById("attendancesTable");
  
  if (!attendanceForm) {
    console.warn('Formulaire de présence non trouvé (peut être masqué selon le rôle)');
    return;
  }
  
  // Ajouter l'event listener pour le submit
  attendanceForm.addEventListener("submit", handleAttendanceSubmit);
  
  // Ajouter l'event listener pour l'annulation
  if (attendanceCancel) {
    attendanceCancel.addEventListener("click", () => {
      resetAttendanceEditor();
    });
  }
  
  // Ajouter l'event listener pour le changement d'événement
  if (attendanceEventSelect) {
    attendanceEventSelect.addEventListener('change', updateEventStatusHelp);
  }
}

async function handleAttendanceSubmit(event) {
  event.preventDefault();
  
  if (!attendanceMemberSelect || !attendanceEventSelect || !attendanceStatus) {
    auth.showNotification("error", "Formulaire de présence non initialisé.");
    return;
  }
  
  const memberId = parseInt(attendanceMemberSelect.value, 10);
  const eventId = parseInt(attendanceEventSelect.value, 10);
  const status = attendanceStatus.value;
  
  if (!memberId || !eventId || !status) {
    auth.showNotification("error", "Tous les champs sont requis.");
    return;
  }
  
  // Vérifier que Supabase est disponible
  if (!window.supabaseDB || !window.supabaseDB.getClient()) {
    auth.showNotification("error", "Supabase n'est pas configuré.");
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
  
  const editingId = attendanceForm ? attendanceForm.dataset.editing : null;
  
  try {
    if (editingId) {
      if (!auth.checkPermission("attendances", "update", member.dept)) {
        auth.showNotification("error", "Pas la permission.");
        return;
      }
      
      // Mettre à jour dans Supabase
      await window.supabaseDB.updateAttendance(parseInt(editingId, 10), {
        status: status
      });
      
      // Recharger les données depuis Supabase
      await window.reloadData();
      
      const statusMessage = eventStatus === 'current' ? 
        "Présence mise à jour pour l'événement d'aujourd'hui." : 
        "Présence mise à jour pour l'événement passé.";
      auth.showNotification("success", statusMessage);
    } else {
      // Vérifier les doublons
      const attendances = await window.supabaseDB.getAttendances();
      const duplicate = attendances.some(
        (entry) => entry.member_id === memberId && entry.event_id === eventId
      );
      if (duplicate) {
        auth.showNotification("error", "Cette présence existe déjà.");
        return;
      }
      
      // Créer dans Supabase
      await window.supabaseDB.createAttendance({
        memberId: memberId,
        eventId: eventId,
        status: status
      });
      
      // Recharger les données depuis Supabase
      await window.reloadData();
      
      const statusMessage = eventStatus === 'current' ? 
        "Présence enregistrée pour l'événement d'aujourd'hui." : 
        "Présence enregistrée pour l'événement passé.";
      auth.showNotification("success", statusMessage);
    }
    
    resetAttendanceEditor();
    buildAttendanceOptions();
    renderAttendanceTable();
    
  } catch (error) {
    console.error('Erreur lors de la sauvegarde de la présence:', error);
    auth.showNotification("error", "Erreur lors de la sauvegarde de la présence.");
  }
}

function refreshAttendancePage() {
  // Vérifier que les données sont chargées
  if (!window.appState || !window.appState.events || window.appState.events.length === 0) {
    // Attendre que les données soient chargées
    const maxAttempts = 50; // 10 secondes max
    let attempts = 0;
    const checkData = () => {
      attempts++;
      if (window.appState && window.appState.events && window.appState.events.length > 0) {
        buildAttendanceOptions();
        renderAttendanceTable();
        const allowed = auth.checkPermission("attendances", "create", auth.getRoleContext().currentDepartmentScope);
        if (attendanceMemberSelect) attendanceMemberSelect.disabled = !allowed;
        if (attendanceEventSelect) attendanceEventSelect.disabled = !allowed;
        if (attendanceStatus) attendanceStatus.disabled = !allowed;
        if (attendanceSubmit) attendanceSubmit.disabled = !allowed;
        if (attendanceCancel) attendanceCancel.disabled = !allowed;
      } else if (attempts < maxAttempts) {
        setTimeout(checkData, 200);
      } else {
        console.error('Les données n\'ont pas pu être chargées après 10 secondes');
        buildAttendanceOptions(); // Essayer quand même
        renderAttendanceTable();
      }
    };
    checkData();
    return;
  }
  
  buildAttendanceOptions();
  renderAttendanceTable();
  const allowed = auth.checkPermission("attendances", "create", auth.getRoleContext().currentDepartmentScope);
  if (attendanceMemberSelect) attendanceMemberSelect.disabled = !allowed;
  if (attendanceEventSelect) attendanceEventSelect.disabled = !allowed;
  if (attendanceStatus) attendanceStatus.disabled = !allowed;
  if (attendanceSubmit) attendanceSubmit.disabled = !allowed;
  if (attendanceCancel) attendanceCancel.disabled = !allowed;
}

document.addEventListener("DOMContentLoaded", () => {
  // Initialiser le formulaire
  initAttendanceForm();
  
  auth.initRoleControls({
    roleSelectId: "roleSelect",
    deptSelectId: "responsableDeptSelect",
    deptContainerSelector: ".role-extra",
    navSelector: ".nav a",
    notificationId: "notifications"
  });
  
  // Attendre que les données soient chargées avant de rafraîchir la page
  refreshAttendancePage();
  
  // Écouter les changements de données
  if (window.onDataReloaded) {
    const originalReload = window.onDataReloaded;
    window.onDataReloaded = () => {
      originalReload();
      refreshAttendancePage();
    };
  } else {
    window.onDataReloaded = () => {
      refreshAttendancePage();
    };
  }
  
  auth.registerRoleListener(() => refreshAttendancePage());
});

