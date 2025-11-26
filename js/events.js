const eventForm = document.getElementById("eventForm");
const eventNameInput = document.getElementById("eventName");
const eventDateInput = document.getElementById("eventDate");
const eventDescriptionInput = document.getElementById("eventDescription");
const eventPhotoInput = document.getElementById("eventPhoto");
const eventSubmit = document.getElementById("eventSubmit");
const eventCancel = document.getElementById("eventCancel");
let currentEventPhoto = null;

function resetEventEditor() {
  eventForm.reset();
  removeEventPhoto();
  delete eventForm.dataset.editing;
  eventSubmit.textContent = "Ajouter";
  eventCancel.style.display = "none";
}

function removeEventPhoto() {
  currentEventPhoto = null;
  const preview = document.getElementById("eventPhotoPreview");
  const img = document.getElementById("eventPhotoImg");
  preview.style.display = "none";
  img.src = "";
  eventPhotoInput.value = "";
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

function getStatusLabel(status) {
  switch (status) {
    case 'upcoming': return 'À venir';
    case 'current': return 'Aujourd\'hui';
    case 'past': return 'Passé';
    default: return '';
  }
}

function renderEventsGrid(filterStatus = 'all') {
  const eventsGrid = document.getElementById("eventsGrid");
  
  if (!eventsGrid) return;
  
  eventsGrid.innerHTML = "";
  
  if (!window.appState.events.length) {
    eventsGrid.innerHTML = "<p style='text-align: center; color: #94a3b8; grid-column: 1 / -1;'>Aucun événement</p>";
    return;
  }
  
  // Filter events based on status
  let filteredEvents = window.appState.events;
  if (filterStatus !== 'all') {
    filteredEvents = window.appState.events.filter(evt => getEventStatus(evt.date) === filterStatus);
  }
  
  // Sort events: upcoming first, then current, then past (most recent first)
  filteredEvents.sort((a, b) => {
    const statusA = getEventStatus(a.date);
    const statusB = getEventStatus(b.date);
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    
    if (statusA === statusB) {
      // Same status, sort by date
      if (statusA === 'past') {
        return dateB - dateA; // Most recent past events first
      } else {
        return dateA - dateB; // Earliest upcoming/current events first
      }
    }
    
    // Different status, prioritize: upcoming > current > past
    const statusOrder = { 'upcoming': 0, 'current': 1, 'past': 2 };
    return statusOrder[statusA] - statusOrder[statusB];
  });
  
  if (filteredEvents.length === 0) {
    const statusLabels = {
      'upcoming': 'à venir',
      'current': 'en cours',
      'past': 'passés'
    };
    eventsGrid.innerHTML = `<p style='text-align: center; color: #94a3b8; grid-column: 1 / -1;'>Aucun événement ${statusLabels[filterStatus] || ''}</p>`;
    return;
  }
  
  filteredEvents.forEach((evt) => {
    const eventStatus = getEventStatus(evt.date);
    const eventCard = document.createElement("div");
    eventCard.className = `event-card status-${eventStatus}`;
    eventCard.onclick = () => showEventDetails(evt);
    
    // Calculate attendance stats
    const eventAttendances = window.appState.attendances.filter(att => att.eventId === evt.id);
    const presentCount = eventAttendances.filter(att => att.status === 'P').length;
    const totalCount = eventAttendances.length;
    
    // Format date
    const eventDate = new Date(evt.date);
    const formattedDate = eventDate.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    eventCard.innerHTML = `
      <div class="event-status-badge ${eventStatus}">
        ${getStatusLabel(eventStatus)}
      </div>
      <div class="event-card-image">
        ${evt.photo ? `<img src="${evt.photo}" alt="Photo de ${evt.name}">` : '📅'}
      </div>
      <div class="event-card-content">
        <h4>${evt.name}</h4>
        <div class="event-card-date">
          📅 ${formattedDate}
        </div>
        ${evt.description ? `<div class="event-card-description">${evt.description}</div>` : ''}
        <div class="event-card-stats">
          <div class="event-stat">
            <span class="event-stat-value">${totalCount}</span>
            <span class="event-stat-label">Inscrits</span>
          </div>
          <div class="event-stat">
            <span class="event-stat-value">${presentCount}</span>
            <span class="event-stat-label">Présents</span>
          </div>
          <div class="event-stat">
            <span class="event-stat-value">${totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0}%</span>
            <span class="event-stat-label">Présence</span>
          </div>
        </div>
      </div>
      <div class="event-actions">
        ${createEventActionButtons(evt)}
      </div>
    `;
    
    eventsGrid.appendChild(eventCard);
  });
}

function createEventActionButtons(evt) {
  const canEdit = auth.checkPermission("events", "update");
  const canDelete = auth.checkPermission("events", "delete");
  
  let buttons = '';
  
  if (canEdit) {
    buttons += `<button onclick="event.stopPropagation(); editEvent(${evt.id})" title="Modifier">✏️</button>`;
  }
  
  if (canDelete) {
    buttons += `<button onclick="event.stopPropagation(); deleteEvent(${evt.id})" title="Supprimer">🗑️</button>`;
  }
  
  return buttons;
}

function editEvent(eventId) {
  const evt = window.appState.events.find(e => e.id === eventId);
  if (!evt) return;
  
  if (!auth.checkPermission("events", "update")) {
    auth.showNotification("error", "Action non autorisée.");
    return;
  }
  
  eventNameInput.value = evt.name;
  eventDateInput.value = evt.date;
  if (eventDescriptionInput) eventDescriptionInput.value = evt.description || '';
  
  // Load photo if exists
  if (evt.photo) {
    currentEventPhoto = evt.photo;
    const preview = document.getElementById("eventPhotoPreview");
    const img = document.getElementById("eventPhotoImg");
    img.src = evt.photo;
    preview.style.display = "block";
  }
  
  eventForm.dataset.editing = evt.id;
  eventSubmit.textContent = "Mettre à jour";
  eventCancel.style.display = "inline-flex";
  
  // Scroll to form
  eventForm.scrollIntoView({ behavior: 'smooth' });
}

function deleteEvent(eventId) {
  if (!confirm('Êtes-vous sûr de vouloir supprimer cet événement ?')) return;
  
  if (!auth.checkPermission("events", "delete")) {
    auth.showNotification("error", "Action non autorisée.");
    return;
  }
  
  window.appState.events = window.appState.events.filter((e) => e.id !== eventId);
  window.appState.attendances = window.appState.attendances.filter(
    (att) => att.eventId !== eventId
  );
  saveData();
  
  // Maintain current filter when re-rendering
  const eventsFilter = document.getElementById('eventsFilter');
  const currentFilter = eventsFilter ? eventsFilter.value : 'all';
  renderEventsGrid(currentFilter);
  
  auth.showNotification("success", "Événement supprimé.");
}

function showEventDetails(evt) {
  const modal = document.getElementById('eventModal');
  const modalPhoto = document.getElementById('modalEventPhoto');
  const modalImg = document.getElementById('modalEventImg');
  const modalName = document.getElementById('modalEventName');
  const modalDate = document.getElementById('modalEventDate');
  const modalDescription = document.getElementById('modalEventDescription');
  const modalParticipants = document.getElementById('modalEventParticipants');
  const modalPresent = document.getElementById('modalEventPresent');
  const modalRate = document.getElementById('modalEventRate');
  const modalEditBtn = document.getElementById('modalEventEditBtn');
  
  // Update photo
  if (evt.photo) {
    modalImg.src = evt.photo;
    modalPhoto.style.display = 'block';
  } else {
    modalPhoto.style.display = 'none';
  }
  
  // Update basic info
  modalName.textContent = evt.name;
  const eventDate = new Date(evt.date);
  modalDate.textContent = eventDate.toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  // Update description
  if (evt.description) {
    modalDescription.textContent = evt.description;
    modalDescription.style.display = 'block';
  } else {
    modalDescription.style.display = 'none';
  }
  
  // Calculate attendance stats
  const eventAttendances = window.appState.attendances.filter(att => att.eventId === evt.id);
  const presentCount = eventAttendances.filter(att => att.status === 'P').length;
  const totalCount = eventAttendances.length;
  const rate = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;
  
  modalParticipants.textContent = totalCount;
  modalPresent.textContent = presentCount;
  modalRate.textContent = `${rate}%`;
  
  // Edit button visibility
  const canEdit = auth.checkPermission("events", "update");
  modalEditBtn.style.display = canEdit ? 'inline-flex' : 'none';
  modalEditBtn.onclick = () => {
    closeEventModal();
    editEvent(evt.id);
  };
  
  modal.style.display = 'flex';
}

function closeEventModal() {
  const modal = document.getElementById('eventModal');
  modal.style.display = 'none';
}

function editEventFromModal() {
  closeEventModal();
}

// Handle photo upload
if (eventPhotoInput) {
  eventPhotoInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      auth.showNotification('error', 'Veuillez sélectionner une image valide');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      auth.showNotification('error', 'L\'image ne doit pas dépasser 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
      currentEventPhoto = e.target.result;
      const preview = document.getElementById("eventPhotoPreview");
      const img = document.getElementById("eventPhotoImg");
      img.src = currentEventPhoto;
      preview.style.display = "block";
    };
    reader.readAsDataURL(file);
  });
}

eventForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = eventNameInput.value.trim();
  const date = eventDateInput.value;
  const description = eventDescriptionInput ? eventDescriptionInput.value.trim() : '';
  
  if (!name || !date) {
    auth.showNotification("error", "Nom et date sont requis.");
    return;
  }
  
  const editingId = eventForm.dataset.editing;
  
  if (editingId) {
    if (!auth.checkPermission("events", "update")) {
      auth.showNotification("error", "Action non autorisée.");
      return;
    }
    
    const targetEvent = window.appState.events.find((evt) => evt.id === parseInt(editingId, 10));
    if (!targetEvent) {
      auth.showNotification("error", "Événement introuvable.");
      return;
    }
    
    targetEvent.name = name;
    targetEvent.date = date;
    targetEvent.description = description;
    if (currentEventPhoto) {
      targetEvent.photo = currentEventPhoto;
    }
    
    auth.showNotification("success", "Événement mis à jour.");
  } else {
    if (!auth.checkPermission("events", "create")) {
      auth.showNotification("error", "Action non autorisée.");
      return;
    }
    
    const duplicate = window.appState.events.some(
      (evt) => evt.name.toLowerCase() === name.toLowerCase() && evt.date === date
    );
    if (duplicate) {
      auth.showNotification("error", "Cet événement existe déjà.");
      return;
    }
    
    const newEvent = {
      id: generateId(window.appState.events),
      name,
      date,
      description
    };
    
    if (currentEventPhoto) {
      newEvent.photo = currentEventPhoto;
    }
    
    window.appState.events.push(newEvent);
    auth.showNotification("success", "Événement ajouté.");
  }
  
  saveData();
  resetEventEditor();
  
  // Maintain current filter when re-rendering
  const eventsFilter = document.getElementById('eventsFilter');
  const currentFilter = eventsFilter ? eventsFilter.value : 'all';
  renderEventsGrid(currentFilter);
});

eventCancel.addEventListener("click", () => {
  resetEventEditor();
});

document.addEventListener("DOMContentLoaded", () => {
  auth.initRoleControls({
    roleSelectId: "roleSelect",
    deptSelectId: "responsableDeptSelect",
    deptContainerSelector: ".role-extra",
    navSelector: ".nav [data-section]",
    notificationId: "notifications"
  });
  
  renderEventsGrid();
  
  // Initialize filter dropdown
  const eventsFilter = document.getElementById('eventsFilter');
  if (eventsFilter) {
    eventsFilter.addEventListener('change', (e) => {
      renderEventsGrid(e.target.value);
    });
  }
  
  auth.registerRoleListener(() => {
    const currentFilter = eventsFilter ? eventsFilter.value : 'all';
    renderEventsGrid(currentFilter);
  });
});

// Global functions for onclick handlers
window.editEvent = editEvent;
window.deleteEvent = deleteEvent;
window.showEventDetails = showEventDetails;
window.closeEventModal = closeEventModal;
window.editEventFromModal = editEventFromModal;
window.removeEventPhoto = removeEventPhoto;