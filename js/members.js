function initMembersModule() {
  const memberForm = document.getElementById("memberForm");
  if (!memberForm) return;
  const memberUserSelect = document.getElementById("memberUserSelect");
  const memberDeptSelect = document.getElementById("memberDeptSelect");
  const memberSubmit = document.getElementById("memberSubmit");
  const memberCancel = document.getElementById("memberCancel");
  const memberFilter = document.getElementById("memberFilter");
  const memberRoleSelect = document.getElementById("memberRole");
  let memberFilterValue = "all";

  function buildMemberFilterOptions() {
    const { currentRole, currentDepartmentScope } = auth.getRoleContext();
    memberFilter.innerHTML = "";
    const defaultOption = document.createElement("option");
    defaultOption.value = "all";
    defaultOption.textContent = "Tous les départements";
    memberFilter.appendChild(defaultOption);
    const allowedDepts =
      currentRole === "responsable" && currentDepartmentScope
        ? [currentDepartmentScope]
        : window.appState.departments;
    allowedDepts.forEach((dept) => {
      const option = document.createElement("option");
      option.value = dept;
      option.textContent = dept;
      memberFilter.appendChild(option);
    });
    if ([...memberFilter.options].some((opt) => opt.value === memberFilterValue)) {
      memberFilter.value = memberFilterValue;
    } else {
      memberFilterValue = "all";
      memberFilter.value = "all";
    }
  }

  function resetMemberForm() {
    memberForm.reset();
    if (memberRoleSelect) {
      memberRoleSelect.value = "user";
    }
    if (memberUserSelect) {
      memberUserSelect.value = "";
    }
    delete memberForm.dataset.editing;
    memberSubmit.textContent = "Ajouter";
    memberCancel.style.display = "none";
    
    // Recharger les options utilisateurs (au cas où un nouveau utilisateur a été créé)
    loadUserOptions();
    
    // Réinitialiser l'affichage du champ rôle selon le rôle de l'utilisateur
    setMemberFormState();
  }

  function setMemberFormState() {
    const { currentRole, currentDepartmentScope } = auth.getRoleContext();
    const createAllowed = auth.checkPermission("members", "create", currentDepartmentScope);
    const isAdmin = currentRole === "admin";
    
    // Activer les champs de base pour le secrétaire et l'admin
    const inputs = [memberNameInput, memberDeptSelect, memberSubmit];
    inputs.forEach((input) => {
      input.disabled = !createAllowed;
    });
    memberCancel.disabled = !createAllowed;
    
    // Le champ "rôle" n'est visible et modifiable que par l'admin
    const memberRoleControl = document.getElementById('memberRoleControl');
    if (memberRoleControl) {
      memberRoleControl.style.display = isAdmin ? 'block' : 'none';
    }
    if (memberRoleSelect) {
      memberRoleSelect.disabled = !isAdmin;
      // Si ce n'est pas l'admin, définir le rôle sur "user" par défaut
      if (!isAdmin && !memberForm.dataset.editing) {
        memberRoleSelect.value = "user";
      }
    }
    if (memberRoleSelect) {
      memberRoleSelect.disabled = currentRole !== "admin";
    }
    memberForm.classList.toggle("disabled", !createAllowed);
  }

  function getVisibleMembers() {
    const { currentRole, currentDepartmentScope } = auth.getRoleContext();
    let members = [...window.appState.members];
    if (currentRole === "responsable" && currentDepartmentScope) {
      members = members.filter((member) => member.dept === currentDepartmentScope);
    } else if (memberFilterValue !== "all") {
      members = members.filter((member) => member.dept === memberFilterValue);
    }
    return members;
  }

  async function renderMembersGrid() {
    const members = getVisibleMembers();
    const membersGrid = document.getElementById("membersGrid");
    
    if (!membersGrid) return;
    
    membersGrid.innerHTML = "";
    
    if (!members.length) {
      const { currentRole } = auth.getRoleContext();
      const canCreate = auth.checkPermission("members", "create");
      
      let message = "Aucun membre trouvé";
      if (canCreate) {
        message += "<br><small style='color: var(--muted); margin-top: 0.5rem; display: block;'>Utilisez le formulaire ci-dessus pour ajouter un membre</small>";
      }
      
      membersGrid.innerHTML = `<p style='text-align: center; color: #94a3b8; grid-column: 1 / -1; padding: 2rem;'>${message}</p>`;
      return;
    }
    
    // Charger toutes les photos de profil en parallèle
    const membersWithPhotos = await Promise.all(members.map(async (member) => {
      let photoUrl = null;
      
      // Chercher l'utilisateur correspondant au membre
      if (window.supabaseDB && window.supabaseDB.getClient()) {
        try {
          const users = await window.supabaseDB.getUsers();
          const user = users.find(u => u.name === member.name);
          if (user && window.storageManager) {
            photoUrl = await window.storageManager.getUserProfilePhotoUrl(user.username);
          }
        } catch (error) {
          console.warn('Erreur lors de la récupération de la photo:', error);
        }
      }
      
      // Photo non trouvée dans Supabase, on garde null
      
      return { ...member, photoUrl };
    }));
    
    membersWithPhotos.forEach((member) => {
      const memberCard = document.createElement("div");
      memberCard.className = "member-card";
      memberCard.onclick = () => showMemberDetails(member);
      
      // Generate initials
      const initials = member.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
      
      // Role display
      const roleDisplayNames = {
        admin: 'Administrateur',
        secretariat: 'Secrétariat', 
        responsable: 'Responsable',
        user: 'Utilisateur'
      };
      
      const roleDisplay = roleDisplayNames[member.role] || 'Utilisateur';
      
      memberCard.innerHTML = `
        <div class="member-card-header">
          <div class="member-avatar">
            ${member.photoUrl ? `<img src="${member.photoUrl}" alt="Photo de ${member.name}" onerror="this.parentElement.innerHTML='<span>${initials}</span>'">` : `<span>${initials}</span>`}
          </div>
          <div class="member-info">
            <h4>${member.name}</h4>
            <p>${member.dept}</p>
            <span class="member-role-badge role-${member.role || 'user'}">${roleDisplay}</span>
          </div>
        </div>
        <div class="member-actions">
          ${createMemberActionButtons(member)}
        </div>
      `;
      
      membersGrid.appendChild(memberCard);
    });
  }

  function createMemberActionButtons(member) {
    const canEdit = auth.checkPermission("members", "update", member.dept);
    const canDelete = auth.checkPermission("members", "delete", member.dept);
    
    let buttons = '';
    
    if (canEdit) {
      buttons += `<button class="secondary" onclick="event.stopPropagation(); editMember(${member.id})" title="Modifier">✏️</button>`;
    }
    
    if (canDelete) {
      buttons += `<button class="secondary" onclick="event.stopPropagation(); deleteMember(${member.id})" title="Supprimer">🗑️</button>`;
    }
    
    return buttons;
  }

  window.editMember = function(memberId) {
    const member = window.appState.members.find(m => m.id === memberId);
    if (!member) return;
    
    const { currentRole } = auth.getRoleContext();
    const isAdmin = currentRole === "admin";
    
    if (memberNameInput) memberNameInput.value = member.name;
    if (memberDeptSelect) memberDeptSelect.value = member.dept;
    if (memberRoleSelect) {
      memberRoleSelect.value = member.role || 'user';
      memberRoleSelect.disabled = !isAdmin;
    }
    if (memberForm) memberForm.dataset.editing = member.id;
    if (memberSubmit) memberSubmit.textContent = "Mettre à jour";
    if (memberCancel) memberCancel.style.display = "inline-flex";
    
    // Afficher le champ rôle si c'est l'admin, sinon le masquer
    const memberRoleControl = document.getElementById('memberRoleControl');
    if (memberRoleControl) {
      memberRoleControl.style.display = isAdmin ? 'block' : 'none';
    }
    
    // Scroll to form
    memberForm?.scrollIntoView({ behavior: 'smooth' });
  };

  window.deleteMember = async function(memberId) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce membre ?')) return;
    
    const member = window.appState.members.find(m => m.id === memberId);
    if (!member) return;
    
    const canDelete = auth.checkPermission("members", "delete", member.dept);
    if (!canDelete) {
      auth.showNotification("error", "Permission refusée.");
      return;
    }
    
    // Supprimer dans Supabase
    if (window.supabaseDB && window.supabaseDB.getClient()) {
      try {
        await window.supabaseDB.deleteMember(memberId);
        // Recharger les données depuis Supabase
        await window.reloadData();
        await renderMembersGrid();
        buildMemberFilterOptions();
        auth.showNotification("success", "Membre supprimé.");
      } catch (error) {
        console.error('Erreur lors de la suppression du membre:', error);
        auth.showNotification("error", "Erreur lors de la suppression du membre.");
      }
    } else {
      auth.showNotification("error", "Supabase n'est pas configuré.");
    }
  };

  window.showMemberDetails = async function(member) {
    const modal = document.getElementById('memberModal');
    const modalPhoto = document.getElementById('modalMemberPhoto');
    const modalName = document.getElementById('modalMemberName');
    const modalRole = document.getElementById('modalMemberRole');
    const modalDept = document.getElementById('modalMemberDept');
    const modalAttendances = document.getElementById('modalMemberAttendances');
    const modalRate = document.getElementById('modalMemberRate');
    const modalLastSeen = document.getElementById('modalMemberLastSeen');
    const modalContact = document.getElementById('modalMemberContact');
    const modalEditBtn = document.getElementById('modalEditBtn');
    
    // Get member profile photo depuis Supabase
    let photoUrl = null;
    let user = null;
    let userProfile = null;
    
    if (window.supabaseDB && window.supabaseDB.getClient()) {
      try {
        const users = await window.supabaseDB.getUsers();
        user = users.find(u => u.name === member.name);
        if (user) {
          // Construire userProfile depuis les données Supabase
          userProfile = {
            email: user.email || null,
            phone: user.phone || null
          };
          
          if (window.storageManager) {
            photoUrl = await window.storageManager.getUserProfilePhotoUrl(user.username);
          }
        }
      } catch (error) {
        console.warn('Erreur lors de la récupération de la photo:', error);
      }
    }
    
    // S'assurer que userProfile est un objet même si vide
    if (!userProfile) {
      userProfile = { email: null, phone: null };
    }
    
    // Generate initials
    const initials = member.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    
    // Update photo
    if (photoUrl) {
      modalPhoto.innerHTML = `<img src="${photoUrl}" alt="Photo de ${member.name}" onerror="this.innerHTML='<span id=\\'modalMemberInitials\\'>${initials}</span>'">`;
    } else {
      modalPhoto.innerHTML = `<span id="modalMemberInitials">${initials}</span>`;
    }
    
    // Update basic info
    modalName.textContent = member.name;
    const roleDisplayNames = {
      admin: 'Administrateur',
      secretariat: 'Secrétariat', 
      responsable: 'Responsable',
      user: 'Utilisateur'
    };
    modalRole.textContent = roleDisplayNames[member.role] || 'Utilisateur';
    modalDept.textContent = member.dept;
    
    // Calculate attendance stats
    const memberAttendances = window.appState.attendances.filter(att => att.memberId === member.id);
    const presentCount = memberAttendances.filter(att => att.status === 'P').length;
    const totalCount = memberAttendances.length;
    const rate = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;
    
    modalAttendances.textContent = totalCount;
    modalRate.textContent = `${rate}%`;
    
    // Last attendance
    const lastAttendance = memberAttendances
      .filter(att => att.status === 'P')
      .sort((a, b) => {
        const eventA = window.appState.events.find(e => e.id === a.eventId);
        const eventB = window.appState.events.find(e => e.id === b.eventId);
        return new Date(eventB?.date || 0) - new Date(eventA?.date || 0);
      })[0];
    
    if (lastAttendance) {
      const event = window.appState.events.find(e => e.id === lastAttendance.eventId);
      modalLastSeen.textContent = event ? new Date(event.date).toLocaleDateString('fr-FR') : 'Inconnu';
    } else {
      modalLastSeen.textContent = 'Jamais';
    }
    
    // Contact info
    if (userProfile?.email || userProfile?.phone) {
      modalContact.innerHTML = `
        <h5>📞 Contact</h5>
        ${userProfile.email ? `<div class="contact-item">📧 ${userProfile.email}</div>` : ''}
        ${userProfile.phone ? `<div class="contact-item">📱 ${userProfile.phone}</div>` : ''}
      `;
      modalContact.style.display = 'block';
    } else {
      modalContact.style.display = 'none';
    }
    
    // Edit button visibility
    const canEdit = auth.checkPermission("members", "update", member.dept);
    modalEditBtn.style.display = canEdit ? 'inline-flex' : 'none';
    modalEditBtn.onclick = () => {
      closeMemberModal();
      editMember(member.id);
    };
    
    modal.style.display = 'flex';
  };

  window.closeMemberModal = function() {
    const modal = document.getElementById('memberModal');
    modal.style.display = 'none';
  };

  window.editMemberFromModal = function() {
    closeMemberModal();
  };

  memberForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const selectedUserId = memberUserSelect ? memberUserSelect.value : null;
    const dept = memberDeptSelect.value;
    const role = memberRoleSelect ? memberRoleSelect.value : 'user';
    
    if (!selectedUserId || !dept) {
      auth.showNotification("error", "Tous les champs sont requis.");
      return;
    }
    
    // Vérifier que Supabase est disponible
    if (!window.supabaseDB || !window.supabaseDB.getClient()) {
      auth.showNotification("error", "Supabase n'est pas configuré.");
      return;
    }
    
    // Récupérer les informations de l'utilisateur sélectionné
    let selectedUser = null;
    try {
      const users = await window.supabaseDB.getUsers();
      selectedUser = users.find(u => u.id.toString() === selectedUserId);
      if (!selectedUser) {
        auth.showNotification("error", "Utilisateur introuvable.");
        return;
      }
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'utilisateur:', error);
      auth.showNotification("error", "Erreur lors de la récupération de l'utilisateur.");
      return;
    }
    
    const name = selectedUser.name;
    const editingId = memberForm.dataset.editing;
    const { currentRole } = auth.getRoleContext();
    
    try {
      if (editingId) {
        if (!auth.checkPermission("members", "update", dept)) {
          auth.showNotification("error", "Permission refusée.");
          return;
        }
        
        // Mettre à jour dans Supabase
        // Seul l'admin peut modifier le rôle, le secrétaire peut modifier le nom et le département
        const updateData = {
          name: name,
          dept: dept
        };
        
        // Seul l'admin peut modifier le rôle
        if (currentRole === "admin") {
          updateData.role = role;
        }
        
        await window.supabaseDB.updateMember(parseInt(editingId, 10), updateData);
        
        // Recharger les données depuis Supabase
        await window.reloadData();
        auth.showNotification("success", "Membre mis à jour.");
      } else {
        if (!auth.checkPermission("members", "create", dept)) {
          auth.showNotification("error", "Permission refusée.");
          return;
        }
        
        // Vérifier les doublons
        const members = await window.supabaseDB.getMembers();
        const duplicate = members.some(
          (member) => member.name.toLowerCase() === name.toLowerCase() && member.dept === dept
        );
        if (duplicate) {
          auth.showNotification("error", "Ce membre existe déjà.");
          return;
        }
        
        // Créer dans Supabase
        // Le secrétaire crée avec rôle "user" par défaut, l'admin peut choisir le rôle
        const memberRole = currentRole === "admin" ? role : "user";
        
        const newMember = await window.supabaseDB.createMember({
          name: name,
          dept: dept,
          role: memberRole
        });
        
        if (!newMember) {
          throw new Error('Erreur lors de la création du membre');
        }
        
        // Recharger les données depuis Supabase
        await window.reloadData();
        
        // Recharger les options utilisateurs (pour retirer celui qui vient d'être utilisé)
        await loadUserOptions();
        
        // Re-rendre la liste des membres
        await renderMembersGrid();
        
        // Réinitialiser le formulaire
        resetMemberForm();
        
        auth.showNotification("success", "Membre ajouté.");
      }
      
      resetMemberForm();
      buildMemberFilterOptions();
      await renderMembersGrid();
      
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du membre:', error);
      auth.showNotification("error", "Erreur lors de la sauvegarde du membre.");
    }
  });

  memberCancel.addEventListener("click", () => {
    resetMemberForm();
  });

  memberFilter.addEventListener("change", async (event) => {
    memberFilterValue = event.target.value;
    await renderMembersGrid();
  });

  // Charger les utilisateurs dans le select
  async function loadUserOptions() {
    if (!memberUserSelect) return;
    
    // Vérifier que Supabase est disponible
    if (!window.supabaseDB || !window.supabaseDB.getClient()) {
      memberUserSelect.innerHTML = '<option value="">Supabase n\'est pas configuré</option>';
      return;
    }
    
    try {
      // Charger tous les utilisateurs depuis Supabase
      const users = await window.supabaseDB.getUsers();
      
      // Charger les membres existants pour filtrer ceux qui ont déjà un membre
      const members = window.appState?.members || [];
      const memberNames = new Set(members.map(m => m.name.toLowerCase()));
      
      // Filtrer les utilisateurs : ne garder que ceux qui n'ont pas encore de membre
      const availableUsers = users.filter(user => {
        return !memberNames.has(user.name.toLowerCase());
      });
      
      // Réinitialiser le select
      memberUserSelect.innerHTML = '<option value="">Choisir un utilisateur...</option>';
      
      if (availableUsers.length === 0) {
        memberUserSelect.innerHTML += '<option value="" disabled>Aucun utilisateur disponible</option>';
        return;
      }
      
      // Ajouter les utilisateurs au select
      availableUsers.forEach(user => {
        const option = document.createElement('option');
        option.value = user.id;
        option.textContent = `${user.name}${user.email ? ` (${user.email})` : ''}`;
        memberUserSelect.appendChild(option);
      });
      
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
      memberUserSelect.innerHTML = '<option value="">Erreur de chargement</option>';
    }
  }

  async function refreshMembersPage() {
    // Attendre que les données soient chargées depuis Supabase
    if (!window.appState) {
      setTimeout(refreshMembersPage, 200);
      return;
    }
    
    // Attendre que les départements soient chargés
    if (!window.appState.departments || window.appState.departments.length === 0) {
      // Attendre un peu et réessayer (max 5 secondes)
      const maxAttempts = 25; // 5 secondes
      let attempts = 0;
      const checkDepartments = () => {
        attempts++;
        if (window.appState && window.appState.departments && window.appState.departments.length > 0) {
          buildMemberFilterOptions();
          auth.ensureDepartmentOptions(memberDeptSelect);
          loadUserOptions();
          setMemberFormState();
          renderMembersGrid();
        } else if (attempts < maxAttempts) {
          setTimeout(checkDepartments, 200);
        } else {
          console.error('Les départements n\'ont pas pu être chargés');
          auth.showNotification("error", "Erreur: Les départements n'ont pas pu être chargés. Veuillez recharger la page.");
          // Afficher quand même la liste (vide) et le formulaire
          buildMemberFilterOptions();
          if (memberDeptSelect) {
            memberDeptSelect.innerHTML = '<option value="">Choisir un département...</option>';
          }
          loadUserOptions();
          setMemberFormState();
          renderMembersGrid();
        }
      };
      checkDepartments();
      return;
    }
    
    buildMemberFilterOptions();
    auth.ensureDepartmentOptions(memberDeptSelect);
    loadUserOptions();
    setMemberFormState();
    await renderMembersGrid();
  }

  // Initialize
  refreshMembersPage().catch(error => {
    console.error('Erreur lors de l\'initialisation:', error);
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initMembersModule);
} else {
  initMembersModule();
}