let eventForm = null;
let eventNameInput = null;
let eventDateInput = null;
let eventDescriptionInput = null;
let eventPhotoInput = null;
let eventSubmit = null;
let eventCancel = null;
let currentEventPhoto = null; // URL de l'image (Supabase Storage) ou File object avant upload
let currentEventPhotoFile = null; // File object pour upload

function getEventPhotoUrl(evt) {
  let photoSrc = evt.photoUrl || evt.photo;
  // Si photoSrc est une chaîne JSON, extraire l'URL
  if (typeof photoSrc === 'string' && photoSrc.startsWith('{')) {
    try {
      const parsed = JSON.parse(photoSrc);
      photoSrc = parsed.url;
    } catch (e) {
      photoSrc = null;
    }
  }
  return photoSrc;
}

function resetEventEditor() {
  if (!eventForm) return;
  eventForm.reset();
  removeEventPhoto();
  delete eventForm.dataset.editing;
  if (eventSubmit) eventSubmit.textContent = "Ajouter";
  if (eventCancel) eventCancel.style.display = "none";
}

function removeEventPhoto() {
  currentEventPhoto = null;
  currentEventPhotoFile = null;
  const preview = document.getElementById("eventPhotoPreview");
  const img = document.getElementById("eventPhotoImg");
  preview.style.display = "none";
  img.src = "";
  if (eventPhotoInput) {
    eventPhotoInput.value = "";
  }
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
  console.log('🎨 renderEventsGrid appelée avec filtre:', filterStatus);
  const eventsGrid = document.getElementById("eventsGrid");
  
  if (!eventsGrid) {
    console.warn('⚠️ eventsGrid non trouvé');
    return;
  }
  
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
        ${(() => {
          const photoSrc = getEventPhotoUrl(evt);
          console.log('🖼️ Rendu photo pour', evt.name, ':', photoSrc);
          return photoSrc
            ? `<img src="${photoSrc}" alt="Photo de ${evt.name}" loading="lazy" onerror="console.error('❌ Impossible de charger la photo:', this.src); this.style.display='none';">`
            : '📅';
        })()}
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
  
  if (!eventForm || !eventNameInput || !eventDateInput) {
    console.error('Formulaire d\'événement non initialisé');
    return;
  }
  
  eventNameInput.value = evt.name;
  eventDateInput.value = evt.date;
  if (eventDescriptionInput) eventDescriptionInput.value = evt.description || '';
  
  // Load photo if exists
  if (evt.photo || evt.photoUrl) {
    currentEventPhoto = evt.photo || evt.photoUrl;
    const preview = document.getElementById("eventPhotoPreview");
    const img = document.getElementById("eventPhotoImg");
    if (preview && img) {
      img.src = currentEventPhoto;
      preview.style.display = "block";
    }
  }
  
  eventForm.dataset.editing = evt.id;
  if (eventSubmit) eventSubmit.textContent = "Mettre à jour";
  if (eventCancel) eventCancel.style.display = "inline-flex";
  
  // Scroll to form
  eventForm.scrollIntoView({ behavior: 'smooth' });
}

async function deleteEvent(eventId) {
  if (!confirm('Êtes-vous sûr de vouloir supprimer cet événement ?')) return;
  
  if (!auth.checkPermission("events", "delete")) {
    auth.showNotification("error", "Action non autorisée.");
    return;
  }
  
  // Supprimer la photo associée si elle existe
  const event = window.appState.events.find(e => e.id === eventId);
  if (event && event.photoUrl && event.photoUrl.startsWith('http') && window.storageManager) {
    try {
      const fileName = window.storageManager.extractFileNameFromUrl(event.photoUrl);
      if (fileName) {
        await window.storageManager.deleteEventPhoto(fileName);
      }
    } catch (deleteError) {
      console.warn('Impossible de supprimer la photo de l\'événement:', deleteError);
      // Continuer la suppression de l'événement même si la photo n'a pas pu être supprimée
    }
  }
  
  // Supprimer dans Supabase
  if (window.supabaseDB && window.supabaseDB.getClient()) {
    try {
      await window.supabaseDB.deleteEvent(eventId);
      // Recharger les données depuis Supabase
      await window.reloadData();
      
      // Re-rendre la liste des événements
      const eventsFilter = document.getElementById('eventsFilter');
      const currentFilter = eventsFilter ? eventsFilter.value : 'all';
      renderEventsGrid(currentFilter);
      
      auth.showNotification("success", "Événement supprimé.");
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'événement:', error);
      auth.showNotification("error", "Erreur lors de la suppression de l'événement.");
    }
  } else {
    auth.showNotification("error", "Supabase n'est pas configuré.");
  }
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
  if (evt.photoUrl || evt.photo) {
    modalImg.src = evt.photoUrl || evt.photo;
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

// Le code de gestion de la photo est maintenant dans initEventForm()

// Initialiser le formulaire et les event listeners
function initEventForm() {
  eventForm = document.getElementById("eventForm");
  eventNameInput = document.getElementById("eventName");
  eventDateInput = document.getElementById("eventDate");
  eventDescriptionInput = document.getElementById("eventDescription");
  eventPhotoInput = document.getElementById("eventPhoto");
  eventSubmit = document.getElementById("eventSubmit");
  eventCancel = document.getElementById("eventCancel");
  
  if (!eventForm) {
    // Le formulaire peut être masqué pour certains rôles, ce n'est pas une erreur critique
    console.warn('Formulaire d\'événement non trouvé (peut être masqué selon le rôle)');
    return;
  }
  
  // Ajouter l'event listener pour le submit
  eventForm.addEventListener("submit", handleEventSubmit);
  
  // Ajouter l'event listener pour l'annulation
  if (eventCancel) {
    eventCancel.addEventListener("click", () => {
      resetEventEditor();
    });
  }
  
  // Ajouter l'event listener pour la photo
  if (eventPhotoInput) {
    eventPhotoInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      // Valider le fichier
      if (window.storageManager) {
        const validation = window.storageManager.validateImageFile(file);
        if (!validation.isValid) {
          auth.showNotification('error', validation.error);
          e.target.value = '';
          return;
        }
      } else {
        // Validation basique si storageManager n'est pas disponible
        if (file.size > 5 * 1024 * 1024) {
          auth.showNotification('error', 'L\'image ne doit pas dépasser 5MB');
          e.target.value = '';
          return;
        }
      }

      // Stocker le fichier pour l'upload ultérieur
      currentEventPhotoFile = file;

      // Afficher un aperçu (sans uploader encore)
      const reader = new FileReader();
      reader.onload = function(e) {
        currentEventPhoto = e.target.result; // Aperçu temporaire
        const preview = document.getElementById("eventPhotoPreview");
        const img = document.getElementById("eventPhotoImg");
        if (preview && img) {
          img.src = currentEventPhoto;
          preview.style.display = "block";
        }
      };
      reader.readAsDataURL(file);
    });
  }
}

async function handleEventSubmit(event) {
  event.preventDefault();
  
  // Vérifier que le formulaire est initialisé
  if (!eventForm || !eventNameInput || !eventDateInput) {
    console.error('Formulaire d\'événement non initialisé');
    auth.showNotification("error", "Erreur: Formulaire non initialisé. Veuillez recharger la page.");
    return;
  }
  
  const name = eventNameInput.value.trim();
  const date = eventDateInput.value;
  const description = eventDescriptionInput ? eventDescriptionInput.value.trim() : '';
  
  if (!name || !date) {
    auth.showNotification("error", "Nom et date sont requis.");
    return;
  }
  
  // Vérifier que Supabase est disponible
  if (!window.supabaseDB || !window.supabaseDB.getClient()) {
    auth.showNotification("error", "Supabase n'est pas configuré.");
    return;
  }
  
  const editingId = eventForm.dataset.editing;
  
  try {
    let photoUrl = null;
    
    // Uploader la photo vers Supabase Storage si un nouveau fichier a été sélectionné
    if (currentEventPhotoFile && window.storageManager) {
      try {
        auth.showNotification("info", "Upload de la photo en cours...");
        const uploadResult = await window.storageManager.uploadEventPhoto(
          currentEventPhotoFile,
          editingId ? parseInt(editingId, 10) : null
        );
        // Extraire l'URL du résultat (uploadEventPhoto retourne { url, publicId })
        photoUrl = uploadResult?.url || uploadResult;
        auth.showNotification("success", "Photo uploadée avec succès");
      } catch (uploadError) {
        console.error('Erreur lors de l\'upload de la photo:', uploadError);
        throw new Error("Impossible d'uploader la photo.");
      }
    } else if (currentEventPhoto && currentEventPhoto.startsWith('http')) {
      photoUrl = currentEventPhoto;
    } else {
      photoUrl = null;
    }
    
    if (editingId) {
      const role = localStorage.getItem("appRole");
      if (!["admin", "secretariat"].includes(role)) {
        auth.showNotification("error", "Action non autorisée.");
        return;
      }
      
      await window.supabaseDB.updateEvent(parseInt(editingId, 10), {
        name: name,
        date: date,
        description: description,
        photo_url: photoUrl
      });
      
      await window.reloadData();
      
      auth.showNotification("success", "Événement mis à jour.");
      
    } else {
      const role = localStorage.getItem("appRole");
      if (!["admin", "secretariat"].includes(role)) {
        auth.showNotification("error", `Action non autorisée pour le rôle : ${role || "inconnu"}`);
        return;
      }
      
      const events = await window.supabaseDB.getEvents();
      const duplicate = events.some(
        (evt) => evt.name.toLowerCase() === name.toLowerCase() && evt.date === date
      );
      if (duplicate) {
        const confirmCreate = confirm(
          `Un événement avec le nom "${name}" et la date "${date}" existe déjà.\n\nVoulez-vous quand même créer cet événement ?`
        );
        if (!confirmCreate) {
          return;
        }
      }
      
      const newEvent = await window.supabaseDB.createEvent({
        name: name,
        date: date,
        description: description,
        photo_url: photoUrl
      });
      
      if (!newEvent) {
        throw new Error('Erreur lors de la création de l\'événement');
      }
      
      await window.reloadData();
      
      auth.showNotification("success", "Événement ajouté.");
    }
    
    // Réinitialiser les variables de photo
    currentEventPhotoFile = null;
    currentEventPhoto = null;
    
    resetEventEditor();
    
    // Re-rendre la liste des événements avec le filtre actuel
    const eventsFilter = document.getElementById('eventsFilter');
    const currentFilter = eventsFilter ? eventsFilter.value : 'all';
    renderEventsGrid(currentFilter);
    
  } catch (error) {
    console.error('Erreur lors de la sauvegarde de l\'événement:', error);
    const errorMessage = error?.message || error?.error?.message || "Erreur lors de la sauvegarde de l'événement.";
    auth.showNotification("error", `Erreur: ${errorMessage}`);
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  // Attendre que l'auth soit synchronisée depuis Supabase
  if (window.auth && typeof window.auth.initAuthFromSupabase === 'function') {
    await window.auth.initAuthFromSupabase();
  }
  
  // Initialiser le formulaire d'événement (peut être masqué pour certains rôles)
  initEventForm();
  
  auth.initRoleControls({
    roleSelectId: "roleSelect",
    deptSelectId: "responsableDeptSelect",
    deptContainerSelector: ".role-extra",
    navSelector: ".nav [data-section]",
    notificationId: "notifications"
  });
  
  // Première tentative d'affichage (au cas où les données sont déjà chargées)
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

  // Rafraîchir automatiquement la liste des événements quand les données Supabase sont (re)chargées
  if (window.onDataReloaded) {
    const originalReload = window.onDataReloaded;
    window.onDataReloaded = () => {
      try {
        originalReload();
      } catch (e) {
        console.warn('Erreur onDataReloaded existant (events):', e);
      }
      const currentFilter = eventsFilter ? eventsFilter.value : 'all';
      renderEventsGrid(currentFilter);
    };
  } else {
    window.onDataReloaded = () => {
      const currentFilter = eventsFilter ? eventsFilter.value : 'all';
      renderEventsGrid(currentFilter);
    };
  }
});

// Global functions for onclick handlers
window.editEvent = editEvent;
window.deleteEvent = deleteEvent;
window.showEventDetails = showEventDetails;
window.closeEventModal = closeEventModal;
window.editEventFromModal = editEventFromModal;
window.removeEventPhoto = removeEventPhoto;