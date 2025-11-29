// Gestion des utilisateurs - Création par secrétaire, attribution de rôles par admin
let currentEditingUser = null;

// Statuts des utilisateurs
const USER_STATUS = {
  PENDING: 'pending',    // En attente de rôle (créé par secrétaire)
  ACTIVE: 'active',      // Actif avec rôle attribué
  INACTIVE: 'inactive'   // Désactivé
};

function initUsersPage() {
  const currentRole = localStorage.getItem('appRole');
  
  // Vérifier les permissions d'accès
  if (!['admin', 'secretariat'].includes(currentRole)) {
    window.location.href = 'login.html';
    return;
  }
  
  // Afficher/masquer les sections selon le rôle
  const userCreationSection = document.getElementById('userCreationSection');
  const roleManagementSection = document.getElementById('roleManagementSection');
  
  console.log('Current role:', currentRole); // Debug
  console.log('User creation section:', userCreationSection); // Debug
  console.log('Role management section:', roleManagementSection); // Debug
  
  if (currentRole === 'secretariat') {
    // SEUL le secrétaire peut créer des comptes
    if (userCreationSection) userCreationSection.style.display = 'block';
    if (roleManagementSection) roleManagementSection.style.display = 'none';
    console.log('Secrétaire: formulaire de création affiché'); // Debug
  } else if (currentRole === 'admin') {
    // Admin ne peut PAS créer de comptes, seulement attribuer des rôles
    if (userCreationSection) userCreationSection.style.display = 'none';
    if (roleManagementSection) roleManagementSection.style.display = 'block';
    console.log('Admin: seulement attribution de rôles affichée'); // Debug
  } else {
    console.log('Rôle non autorisé:', currentRole); // Debug
  }
  
  // Initialiser les événements
  setupEventListeners();
  loadDepartmentOptions();
  
  // Pour l'admin, afficher les utilisateurs en attente par défaut
  const statusFilter = document.getElementById('usersStatusFilter');
  if (statusFilter && currentRole === 'admin') {
    statusFilter.value = 'pending';
    renderUsersGrid('pending');
  } else {
    renderUsersGrid();
  }
  
  // Mettre à jour le rôle affiché
  const roleDisplay = document.getElementById('currentUserRole');
  if (roleDisplay) {
    const roleLabels = {
      'admin': 'Admin',
      'secretariat': 'Secrétariat'
    };
    roleDisplay.innerHTML = `Rôle : <strong>${roleLabels[currentRole]}</strong>`;
  }
}

function setupEventListeners() {
  // Formulaire de création d'utilisateur
  const userCreationForm = document.getElementById('userCreationForm');
  if (userCreationForm) {
    userCreationForm.addEventListener('submit', handleUserCreation);
  }
  
  // Bouton d'annulation
  const cancelBtn = document.getElementById('cancelUserCreation');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', resetUserCreationForm);
  }
  
  // Filtre de statut
  const statusFilter = document.getElementById('usersStatusFilter');
  if (statusFilter) {
    statusFilter.addEventListener('change', (e) => {
      renderUsersGrid(e.target.value);
    });
  }
  
  // Formulaire d'attribution de rôle
  const roleAssignmentForm = document.getElementById('roleAssignmentForm');
  if (roleAssignmentForm) {
    const roleSelect = document.getElementById('assignRole');
    roleSelect.addEventListener('change', handleRoleSelection);
  }
  
  // Bouton de confirmation d'attribution
  const confirmBtn = document.getElementById('confirmRoleAssignment');
  if (confirmBtn) {
    confirmBtn.addEventListener('click', handleRoleAssignment);
  }

  // Bouton de confirmation d'édition d'utilisateur
  const confirmEditBtn = document.getElementById('confirmUserEdit');
  if (confirmEditBtn) {
    confirmEditBtn.addEventListener('click', handleUserEditSave);
  }
  
  // Bouton de déconnexion
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
        localStorage.removeItem('appRole');
        localStorage.removeItem('appUser');
        localStorage.removeItem('appUserName');
        localStorage.removeItem('appLoginTime');
        localStorage.removeItem('appDept');
        window.location.href = 'login.html';
      }
    });
  }
}

async function handleUserCreation(e) {
  e.preventDefault();
  
  const currentRole = localStorage.getItem('appRole');
  // SEUL le secrétaire peut créer des comptes utilisateurs
  if (currentRole !== 'secretariat') {
    if (window.notificationSystem) {
      window.notificationSystem.error('Seul le secrétaire peut créer des comptes utilisateurs');
    }
    return;
  }
  
  const formData = {
    username: document.getElementById('newUsername').value.trim(),
    fullName: document.getElementById('newUserFullName').value.trim(),
    email: document.getElementById('newUserEmail').value.trim(),
    birthDate: document.getElementById('newUserBirthDate').value,
    address: document.getElementById('newUserAddress').value.trim(),
    password: document.getElementById('newUserPassword').value
  };
  
  // Validation
  if (!formData.username || !formData.fullName || !formData.email || !formData.birthDate || !formData.address || !formData.password) {
    if (window.notificationSystem) {
      window.notificationSystem.error('Tous les champs sont requis');
    }
    return;
  }
  
  // Validation de la date de naissance
  const birthDate = new Date(formData.birthDate);
  const today = new Date();
  const age = today.getFullYear() - birthDate.getFullYear();
  
  if (birthDate > today) {
    if (window.notificationSystem) {
      window.notificationSystem.error('La date de naissance ne peut pas être dans le futur');
    }
    return;
  }
  
  if (age < 16) {
    if (window.notificationSystem) {
      window.notificationSystem.error('L\'utilisateur doit avoir au moins 16 ans');
    }
    return;
  }
  
  if (age > 100) {
    if (window.notificationSystem) {
      window.notificationSystem.error('Veuillez vérifier la date de naissance');
    }
    return;
  }
  
  if (formData.password.length < 6) {
    if (window.notificationSystem) {
      window.notificationSystem.error('Le mot de passe doit contenir au moins 6 caractères');
    }
    return;
  }
  
  // Vérifier que Supabase est disponible
  if (!window.supabaseDB || !window.supabaseDB.getClient()) {
    if (window.notificationSystem) {
      window.notificationSystem.error('Supabase n\'est pas configuré.');
    }
    return;
  }
  
  // Vérifier l'unicité du nom d'utilisateur dans Supabase
  let existingUser = null;
  try {
    existingUser = await window.supabaseDB.getUserByUsername(formData.username);
  } catch (error) {
    console.error('Erreur lors de la vérification de l\'utilisateur:', error);
    if (window.notificationSystem) {
      window.notificationSystem.error('Erreur lors de la vérification de l\'utilisateur.');
    }
    return;
  }
  
  if (existingUser) {
    if (window.notificationSystem) {
      window.notificationSystem.error('Ce nom d\'utilisateur existe déjà');
    }
    return;
  }
  
  // Créer le nouvel utilisateur
  const newUser = {
    username: formData.username,
    name: formData.fullName,
    email: formData.email,
    birthDate: formData.birthDate,
    address: formData.address,
    password: formData.password,
    role: null, // Pas de rôle attribué initialement
    status: USER_STATUS.PENDING,
    createdBy: localStorage.getItem('appUser'),
    createdAt: new Date().toISOString(),
    dept: null
  };
  
  // Créer dans Supabase
  try {
    await window.supabaseDB.createUser({
      username: newUser.username,
      name: newUser.name,
      email: newUser.email,
      birthDate: newUser.birthDate,
      address: newUser.address,
      password: newUser.password,
      role: newUser.role,
      status: newUser.status,
      createdBy: newUser.createdBy,
      dept: newUser.dept
    });
  } catch (error) {
    console.error('Erreur lors de la création de l\'utilisateur dans Supabase:', error);
    if (window.notificationSystem) {
      window.notificationSystem.error('Erreur lors de la création de l\'utilisateur');
    }
    return;
  }
  
  // Notification de succès
  if (window.notificationSystem) {
    window.notificationSystem.success(
      `Utilisateur ${formData.fullName} créé avec succès. En attente d'attribution de rôle par l'administrateur.`,
      { duration: 6000 }
    );
  }
  
  // Réinitialiser le formulaire et actualiser la liste
  resetUserCreationForm();
  renderUsersGrid();
}

function resetUserCreationForm() {
  const form = document.getElementById('userCreationForm');
  if (form) {
    form.reset();
  }
}

function loadDepartmentOptions() {
  const departmentSelect = document.getElementById('assignDepartment');
  if (!departmentSelect) return;
  
  departmentSelect.innerHTML = '<option value="">Sélectionner un département</option>';
  
  if (window.appState && window.appState.departments) {
    window.appState.departments.forEach(dept => {
      const option = document.createElement('option');
      option.value = dept;
      option.textContent = dept;
      departmentSelect.appendChild(option);
    });
  }
}

async function renderUsersGrid(statusFilter = 'all') {
  const usersGrid = document.getElementById('usersGrid');
  if (!usersGrid) return;
  
  // Vérifier que Supabase est disponible
  if (!window.supabaseDB || !window.supabaseDB.getClient()) {
    usersGrid.innerHTML = '<div class="users-empty"><div class="empty-icon">⚠️</div><p>Supabase n\'est pas configuré</p></div>';
    return;
  }
  
  let users = [];
  
  // Charger depuis Supabase uniquement
  try {
    const supabaseUsers = await window.supabaseDB.getUsers();
    users = supabaseUsers.map(user => ({
      username: user.username,
      name: user.name,
      email: user.email,
      birthDate: user.birth_date,
      address: user.address,
      password: user.password,
      role: user.role,
      status: user.status,
      dept: user.dept,
      createdBy: user.created_by,
      createdAt: user.created_at,
      roleAssignedBy: user.role_assigned_by,
      roleAssignedAt: user.role_assigned_at,
      statusChangedBy: user.status_changed_by,
      statusChangedAt: user.status_changed_at,
      notes: user.notes
    }));
  } catch (error) {
    console.error('Erreur lors du chargement des utilisateurs depuis Supabase:', error);
    usersGrid.innerHTML = '<div class="users-empty"><div class="empty-icon">❌</div><p>Erreur lors du chargement des utilisateurs</p></div>';
    return;
  }
  
  const currentRole = localStorage.getItem('appRole');
  
  // Filtrer les utilisateurs
  let filteredUsers = users;
  if (statusFilter !== 'all') {
    filteredUsers = users.filter(user => user.status === statusFilter);
  }
  
  // Pour l'admin, mettre en évidence les utilisateurs en attente
  if (currentRole === 'admin' && statusFilter === 'all') {
    // Trier pour mettre les utilisateurs en attente en premier
    filteredUsers.sort((a, b) => {
      if (a.status === USER_STATUS.PENDING && b.status !== USER_STATUS.PENDING) return -1;
      if (a.status !== USER_STATUS.PENDING && b.status === USER_STATUS.PENDING) return 1;
      return 0;
    });
  }
  
  usersGrid.innerHTML = '';
  
  if (filteredUsers.length === 0) {
    usersGrid.innerHTML = `
      <div class="users-empty">
        <div class="empty-icon">👥</div>
        <p>Aucun utilisateur ${statusFilter === 'all' ? '' : getStatusLabel(statusFilter).toLowerCase()}</p>
      </div>
    `;
    return;
  }
  
  filteredUsers.forEach(user => {
    const userCard = document.createElement('div');
    userCard.className = `user-card status-${user.status}`;
    
    const canAssignRole = currentRole === 'admin' && (user.status === USER_STATUS.PENDING || user.status === USER_STATUS.ACTIVE);
    const canEdit = currentRole === 'admin';
    
    userCard.innerHTML = `
      <div class="user-card-header">
        <div class="user-card-avatar">
          ${getUserInitials(user.name)}
        </div>
        <div class="user-card-info">
          <h4>${user.name || 'Nom non défini'}</h4>
          <p class="user-card-username">@${user.username || 'username'}</p>
          <p class="user-card-email">${user.email || 'Email non défini'}</p>
        </div>
        <div class="user-card-status">
          <span class="status-badge status-${user.status}">
            ${getStatusLabel(user.status)}
          </span>
        </div>
      </div>
      
      <div class="user-card-details">
        <div class="user-detail-item">
          <span class="detail-label">Rôle :</span>
          <span class="detail-value">${user.role ? getRoleLabel(user.role) : 'Non attribué'}</span>
        </div>
        ${user.dept ? `
          <div class="user-detail-item">
            <span class="detail-label">Département :</span>
            <span class="detail-value">${user.dept}</span>
          </div>
        ` : ''}
        ${user.birthDate ? `
          <div class="user-detail-item">
            <span class="detail-label">Date de naissance :</span>
            <span class="detail-value">${formatDate(user.birthDate)} (${calculateAge(user.birthDate)} ans)</span>
          </div>
        ` : ''}
        ${user.address ? `
          <div class="user-detail-item">
            <span class="detail-label">Adresse :</span>
            <span class="detail-value">${user.address}</span>
          </div>
        ` : ''}
        <div class="user-detail-item">
          <span class="detail-label">Créé le :</span>
          <span class="detail-value">${formatDate(user.createdAt)}</span>
        </div>
        ${user.createdBy ? `
          <div class="user-detail-item">
            <span class="detail-label">Créé par :</span>
            <span class="detail-value">${user.createdBy}</span>
          </div>
        ` : ''}
      </div>
      
      <div class="user-card-actions">
        ${canAssignRole ? `
          <button class="primary assign-role-btn" onclick="openRoleAssignmentModal('${user.username}')">
            ${user.status === USER_STATUS.PENDING ? '⚙️ Attribuer un rôle' : '🔄 Modifier le rôle'}
          </button>
        ` : ''}
        ${canEdit && user.status === USER_STATUS.ACTIVE ? `
          <button class="secondary edit-user-btn" onclick="editUser('${user.username}')">
            ✏️ Modifier
          </button>
        ` : ''}
        ${canEdit ? `
          <button class="secondary ${user.status === USER_STATUS.ACTIVE ? 'deactivate' : 'activate'}-user-btn" 
                  onclick="toggleUserStatus('${user.username}')">
            ${user.status === USER_STATUS.ACTIVE ? '🚫 Désactiver' : '✅ Activer'}
          </button>
        ` : ''}
        ${canEdit ? `
          <button class="secondary delete-user-btn" 
                  style="background-color: #dc3545; color: white; border-color: #dc3545;"
                  onclick="deleteUserAccount('${user.username}', '${user.name || user.username}')">
            🗑️ Supprimer
          </button>
        ` : ''}
      </div>
    `;
    
    usersGrid.appendChild(userCard);
  });
}

function getUserInitials(name) {
  if (!name || typeof name !== 'string') {
    return 'U'; // Default initials for undefined/null names
  }
  return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
}

function getStatusLabel(status) {
  const labels = {
    [USER_STATUS.PENDING]: 'En attente',
    [USER_STATUS.ACTIVE]: 'Actif',
    [USER_STATUS.INACTIVE]: 'Inactif'
  };
  return labels[status] || status;
}

function getRoleLabel(role) {
  const labels = {
    'admin': 'Administrateur',
    'secretariat': 'Secrétariat',
    'responsable': 'Responsable',
    'user': 'Utilisateur'
  };
  return labels[role] || role;
}

function formatDate(dateString) {
  if (!dateString) return 'Non défini';
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

function calculateAge(birthDateString) {
  if (!birthDateString) return 0;
  const birthDate = new Date(birthDateString);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}

async function openRoleAssignmentModal(username) {
  const currentRole = localStorage.getItem('appRole');
  if (currentRole !== 'admin') {
    if (window.notificationSystem) {
      window.notificationSystem.error('Seul l\'administrateur peut attribuer des rôles');
    }
    return;
  }
  
  // Vérifier que Supabase est disponible
  if (!window.supabaseDB || !window.supabaseDB.getClient()) {
    if (window.notificationSystem) {
      window.notificationSystem.error('Supabase n\'est pas configuré.');
    }
    return;
  }
  
  // Charger l'utilisateur depuis Supabase
  let user = null;
  try {
    user = await window.supabaseDB.getUserByUsername(username);
    
    if (!user) {
      if (window.notificationSystem) {
        window.notificationSystem.error('Utilisateur introuvable');
      }
      return;
    }
    
    // Convertir l'utilisateur Supabase au format attendu
    const userFormatted = {
      username: user.username,
      name: user.name,
      email: user.email,
      birthDate: user.birth_date,
      address: user.address,
      password: user.password,
      role: user.role,
      status: user.status,
      dept: user.dept,
      createdBy: user.created_by,
      createdAt: user.created_at,
      roleAssignedBy: user.role_assigned_by,
      roleAssignedAt: user.role_assigned_at,
      statusChangedBy: user.status_changed_by,
      statusChangedAt: user.status_changed_at,
      notes: user.notes
    };
    
    currentEditingUser = userFormatted;
  
    // Remplir les informations de l'utilisateur dans la modal
    document.getElementById('modalUserName').textContent = userFormatted.name || 'Nom non défini';
    document.getElementById('modalUserEmail').textContent = userFormatted.email || 'Email non défini';
    document.getElementById('modalUserStatus').textContent = getStatusLabel(userFormatted.status);
    document.getElementById('modalUserAvatar').textContent = getUserInitials(userFormatted.name);
    
    // Afficher les informations personnelles si disponibles
    const personalInfoSection = document.getElementById('modalUserPersonalInfo');
    if (userFormatted.birthDate || userFormatted.address) {
      personalInfoSection.style.display = 'block';
      
      if (userFormatted.birthDate) {
        document.getElementById('modalUserBirthDateDisplay').textContent = formatDate(userFormatted.birthDate);
        document.getElementById('modalUserAge').textContent = `${calculateAge(userFormatted.birthDate)} ans`;
      } else {
        document.getElementById('modalUserBirthDateDisplay').textContent = 'Non renseigné';
        document.getElementById('modalUserAge').textContent = '-';
      }
      
      if (userFormatted.address) {
        document.getElementById('modalUserAddressDisplay').textContent = userFormatted.address;
      } else {
        document.getElementById('modalUserAddressDisplay').textContent = 'Non renseignée';
      }
    } else {
      personalInfoSection.style.display = 'none';
    }
    
    // Pré-remplir le formulaire avec les données actuelles de l'utilisateur
    document.getElementById('assignRole').value = userFormatted.role || '';
    document.getElementById('assignDepartment').value = userFormatted.dept || '';
    document.getElementById('userNotes').value = '';
    
    // Afficher la sélection de département si nécessaire
    if (userFormatted.role === 'responsable') {
      document.getElementById('departmentSelection').style.display = 'block';
      document.getElementById('assignDepartment').required = true;
    } else {
      document.getElementById('departmentSelection').style.display = 'none';
      document.getElementById('assignDepartment').required = false;
    }
    
    // Afficher la modal
    document.getElementById('roleAssignmentModal').style.display = 'flex';
  } catch (error) {
    console.error('Erreur lors du chargement de l\'utilisateur:', error);
    if (window.notificationSystem) {
      window.notificationSystem.error('Erreur lors du chargement de l\'utilisateur');
    }
  }
}

function closeRoleAssignmentModal() {
  document.getElementById('roleAssignmentModal').style.display = 'none';
  currentEditingUser = null;
}

function handleRoleSelection() {
  const selectedRole = document.getElementById('assignRole').value;
  const departmentSelection = document.getElementById('departmentSelection');
  
  if (selectedRole === 'responsable') {
    departmentSelection.style.display = 'block';
    document.getElementById('assignDepartment').required = true;
  } else {
    departmentSelection.style.display = 'none';
    document.getElementById('assignDepartment').required = false;
  }
}

async function handleRoleAssignment() {
  if (!currentEditingUser) return;
  
  const selectedRole = document.getElementById('assignRole').value;
  const selectedDept = document.getElementById('assignDepartment').value;
  const notes = document.getElementById('userNotes').value.trim();
  
  if (!selectedRole) {
    if (window.notificationSystem) {
      window.notificationSystem.error('Veuillez sélectionner un rôle');
    }
    return;
  }
  
  if (selectedRole === 'responsable' && !selectedDept) {
    if (window.notificationSystem) {
      window.notificationSystem.error('Veuillez sélectionner un département pour le responsable');
    }
    return;
  }
  
  // Vérifier que Supabase est disponible
  if (!window.supabaseDB || !window.supabaseDB.getClient()) {
    if (window.notificationSystem) {
      window.notificationSystem.error('Supabase n\'est pas configuré.');
    }
    return;
  }
  
  // Mettre à jour dans Supabase
  try {
    await window.supabaseDB.updateUser(currentEditingUser.username, {
      role: selectedRole,
      dept: selectedRole === 'responsable' ? selectedDept : null,
      status: USER_STATUS.ACTIVE,
      roleAssignedBy: localStorage.getItem('appUser'),
      notes: notes
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'utilisateur dans Supabase:', error);
    if (window.notificationSystem) {
      window.notificationSystem.error('Erreur lors de la mise à jour de l\'utilisateur');
    }
    return;
  }
  
  // Notification de succès
  if (window.notificationSystem) {
    window.notificationSystem.success(
      `Rôle ${getRoleLabel(selectedRole)} attribué à ${currentEditingUser.name}`,
      { duration: 4000 }
    );
  }
  
  // Fermer la modal et actualiser
  closeRoleAssignmentModal();
  renderUsersGrid();
}

async function toggleUserStatus(username) {
  const currentRole = localStorage.getItem('appRole');
  if (currentRole !== 'admin') {
    if (window.notificationSystem) {
      window.notificationSystem.error('Seul l\'administrateur peut modifier le statut des utilisateurs');
    }
    return;
  }
  
  // Vérifier que Supabase est disponible
  if (!window.supabaseDB || !window.supabaseDB.getClient()) {
    if (window.notificationSystem) {
      window.notificationSystem.error('Supabase n\'est pas configuré.');
    }
    return;
  }
  
  // Récupérer l'utilisateur depuis Supabase
  let user = null;
  try {
    user = await window.supabaseDB.getUserByUsername(username);
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur:', error);
    if (window.notificationSystem) {
      window.notificationSystem.error('Erreur lors de la récupération de l\'utilisateur');
    }
    return;
  }
  
  if (!user) {
    if (window.notificationSystem) {
      window.notificationSystem.error('Utilisateur introuvable');
    }
    return;
  }
  
  const newStatus = user.status === USER_STATUS.ACTIVE ? USER_STATUS.INACTIVE : USER_STATUS.ACTIVE;
  
  if (!confirm(`Êtes-vous sûr de vouloir ${newStatus === USER_STATUS.ACTIVE ? 'activer' : 'désactiver'} ${user.name} ?`)) {
    return;
  }
  
  // Mettre à jour dans Supabase
  try {
    await window.supabaseDB.updateUser(username, {
      status: newStatus,
      statusChangedBy: localStorage.getItem('appUser')
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut dans Supabase:', error);
    if (window.notificationSystem) {
      window.notificationSystem.error('Erreur lors de la mise à jour du statut');
    }
    return;
  }
  
  if (window.notificationSystem) {
    window.notificationSystem.success(
      `${user.name} ${newStatus === USER_STATUS.ACTIVE ? 'activé' : 'désactivé'} avec succès`
    );
  }
  
  renderUsersGrid();
}

function editUser(username) {
  openUserEditModal(username);
}

async function openUserEditModal(username) {
  const currentRole = localStorage.getItem('appRole');
  if (currentRole !== 'admin') {
    if (window.notificationSystem) {
      window.notificationSystem.error('Seul l\'administrateur peut modifier les informations utilisateur');
    }
    return;
  }

  if (!window.supabaseDB || !window.supabaseDB.getClient()) {
    if (window.notificationSystem) {
      window.notificationSystem.error('Supabase n\'est pas configuré.');
    }
    return;
  }

  try {
    const user = await window.supabaseDB.getUserByUsername(username);
    if (!user) {
      if (window.notificationSystem) {
        window.notificationSystem.error('Utilisateur introuvable');
      }
      return;
    }

    currentEditingUser = {
      username: user.username,
      name: user.name,
      email: user.email,
      birthDate: user.birth_date,
      address: user.address
    };

    // Pré-remplir le formulaire
    const fullNameInput = document.getElementById('editUserFullName');
    const emailInput = document.getElementById('editUserEmail');
    const birthDateInput = document.getElementById('editUserBirthDate');
    const addressInput = document.getElementById('editUserAddress');

    if (fullNameInput) fullNameInput.value = user.name || '';
    if (emailInput) emailInput.value = user.email || '';
    if (birthDateInput) birthDateInput.value = user.birth_date || '';
    if (addressInput) addressInput.value = user.address || '';

    const modal = document.getElementById('userEditModal');
    if (modal) {
      modal.style.display = 'flex';
    }
  } catch (error) {
    console.error('Erreur lors du chargement de l\'utilisateur pour édition:', error);
    if (window.notificationSystem) {
      window.notificationSystem.error('Erreur lors du chargement de l\'utilisateur');
    }
  }
}

function closeUserEditModal() {
  const modal = document.getElementById('userEditModal');
  if (modal) {
    modal.style.display = 'none';
  }
  currentEditingUser = null;
}

async function handleUserEditSave(event) {
  if (event) {
    event.preventDefault();
  }

  if (!currentEditingUser) return;

  const fullNameInput = document.getElementById('editUserFullName');
  const emailInput = document.getElementById('editUserEmail');
  const birthDateInput = document.getElementById('editUserBirthDate');
  const addressInput = document.getElementById('editUserAddress');

  const updates = {
    name: fullNameInput ? fullNameInput.value.trim() : '',
    email: emailInput ? emailInput.value.trim() : '',
    birthDate: birthDateInput ? birthDateInput.value : null,
    address: addressInput ? addressInput.value.trim() : ''
  };

  if (!updates.name || !updates.email) {
    if (window.notificationSystem) {
      window.notificationSystem.error('Nom complet et email sont obligatoires');
    }
    return;
  }

  if (!window.supabaseDB || !window.supabaseDB.getClient()) {
    if (window.notificationSystem) {
      window.notificationSystem.error('Supabase n\'est pas configuré.');
    }
    return;
  }

  try {
    await window.supabaseDB.updateUser(currentEditingUser.username, updates);

    if (window.notificationSystem) {
      window.notificationSystem.success('Utilisateur mis à jour avec succès');
    }

    closeUserEditModal();

    // Recharger la liste des utilisateurs en conservant le filtre courant
    const statusFilter = document.getElementById('usersStatusFilter');
    const currentFilter = statusFilter ? statusFilter.value : 'all';
    await renderUsersGrid(currentFilter);
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
    if (window.notificationSystem) {
      window.notificationSystem.error('Erreur lors de la mise à jour de l\'utilisateur');
    }
  }
}

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
  initUsersPage();

  // S'assurer que la liste des départements est remplie dès que les données Supabase sont prêtes
  if (window.onDataReloaded) {
    const originalReload = window.onDataReloaded;
    window.onDataReloaded = () => {
      try {
        originalReload();
      } catch (e) {
        console.warn('Erreur onDataReloaded existant (users):', e);
      }
      loadDepartmentOptions();
    };
  } else {
    window.onDataReloaded = () => {
      loadDepartmentOptions();
    };
  }
});

async function deleteUserAccount(username, userName) {
  const currentRole = localStorage.getItem('appRole');
  if (currentRole !== 'admin') {
    if (window.notificationSystem) {
      window.notificationSystem.error('Seul l\'administrateur peut supprimer des comptes utilisateurs');
    }
    return;
  }
  
  // Vérifier que l'utilisateur ne supprime pas son propre compte
  const currentUsername = localStorage.getItem('appUsername');
  if (username === currentUsername) {
    if (window.notificationSystem) {
      window.notificationSystem.error('Vous ne pouvez pas supprimer votre propre compte');
    }
    return;
  }
  
  // Demander confirmation
  const confirmMessage = `Êtes-vous sûr de vouloir supprimer définitivement le compte de "${userName}" (${username}) ?\n\nCette action est irréversible et supprimera toutes les données associées à cet utilisateur.`;
  if (!confirm(confirmMessage)) {
    return;
  }
  
  // Vérifier que Supabase est disponible
  if (!window.supabaseDB || !window.supabaseDB.getClient()) {
    if (window.notificationSystem) {
      window.notificationSystem.error('Supabase n\'est pas configuré.');
    }
    return;
  }
  
  try {
    // Supprimer l'utilisateur depuis Supabase
    const success = await window.supabaseDB.deleteUser(username);
    
    if (success) {
      if (window.notificationSystem) {
        window.notificationSystem.success(`Le compte de "${userName}" a été supprimé avec succès`);
      }
      
      // Recharger la liste des utilisateurs
      const statusFilter = document.getElementById('usersStatusFilter');
      const currentFilter = statusFilter ? statusFilter.value : 'all';
      await renderUsersGrid(currentFilter);
    } else {
      if (window.notificationSystem) {
        window.notificationSystem.error('Erreur lors de la suppression du compte');
      }
    }
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'utilisateur:', error);
    if (window.notificationSystem) {
      window.notificationSystem.error('Erreur lors de la suppression du compte');
    }
  }
}

// Fonctions globales pour les onclick
window.openRoleAssignmentModal = openRoleAssignmentModal;
window.closeRoleAssignmentModal = closeRoleAssignmentModal;
window.toggleUserStatus = toggleUserStatus;
window.editUser = editUser;
window.deleteUserAccount = deleteUserAccount;
window.closeUserEditModal = closeUserEditModal;
