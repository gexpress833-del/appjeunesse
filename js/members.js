function initMembersModule() {
  const memberForm = document.getElementById("memberForm");
  if (!memberForm) return;
  const memberNameInput = document.getElementById("memberName");
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
    delete memberForm.dataset.editing;
    memberSubmit.textContent = "Ajouter";
    memberCancel.style.display = "none";
  }

  function setMemberFormState() {
    const { currentRole, currentDepartmentScope } = auth.getRoleContext();
    const createAllowed = auth.checkPermission("members", "create", currentDepartmentScope);
    const inputs = [memberNameInput, memberDeptSelect, memberSubmit];
    inputs.forEach((input) => {
      input.disabled = !createAllowed;
    });
    memberCancel.disabled = !createAllowed;
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

  function renderMembersGrid() {
    const members = getVisibleMembers();
    const membersGrid = document.getElementById("membersGrid");
    
    if (!membersGrid) return;
    
    membersGrid.innerHTML = "";
    
    if (!members.length) {
      membersGrid.innerHTML = "<p style='text-align: center; color: #94a3b8; grid-column: 1 / -1;'>Aucun membre trouvé</p>";
      return;
    }
    
    members.forEach((member) => {
      const memberCard = document.createElement("div");
      memberCard.className = "member-card";
      memberCard.onclick = () => showMemberDetails(member);
      
      // Get member profile photo
      const profiles = JSON.parse(localStorage.getItem('userProfiles') || '{}');
      const users = JSON.parse(localStorage.getItem('appUsers') || '[]');
      const user = users.find(u => u.name === member.name);
      const userProfile = user ? profiles[user.username] : null;
      
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
            ${userProfile?.photo ? `<img src="${userProfile.photo}" alt="Photo de ${member.name}">` : `<span>${initials}</span>`}
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
    
    if (memberNameInput) memberNameInput.value = member.name;
    if (memberDeptSelect) memberDeptSelect.value = member.dept;
    if (memberRoleSelect) memberRoleSelect.value = member.role || 'user';
    if (memberForm) memberForm.dataset.editing = member.id;
    if (memberSubmit) memberSubmit.textContent = "Mettre à jour";
    if (memberCancel) memberCancel.style.display = "inline-flex";
    
    // Scroll to form
    memberForm?.scrollIntoView({ behavior: 'smooth' });
  };

  window.deleteMember = function(memberId) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce membre ?')) return;
    
    const member = window.appState.members.find(m => m.id === memberId);
    if (!member) return;
    
    const canDelete = auth.checkPermission("members", "delete", member.dept);
    if (!canDelete) {
      auth.showNotification("error", "Permission refusée.");
      return;
    }
    
    window.appState.members = window.appState.members.filter((m) => m.id !== memberId);
    window.appState.attendances = window.appState.attendances.filter(
      (att) => att.memberId !== memberId
    );
    saveData();
    renderMembersGrid();
    buildMemberFilterOptions();
    auth.showNotification("success", "Membre supprimé.");
  };

  window.showMemberDetails = function(member) {
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
    
    // Get member profile data
    const profiles = JSON.parse(localStorage.getItem('userProfiles') || '{}');
    const users = JSON.parse(localStorage.getItem('appUsers') || '[]');
    const user = users.find(u => u.name === member.name);
    const userProfile = user ? profiles[user.username] : null;
    
    // Generate initials
    const initials = member.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    
    // Update photo
    if (userProfile?.photo) {
      modalPhoto.innerHTML = `<img src="${userProfile.photo}" alt="Photo de ${member.name}">`;
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

  memberForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = memberNameInput.value.trim();
    const dept = memberDeptSelect.value;
    const role = memberRoleSelect ? memberRoleSelect.value : 'user';
    if (!name || !dept) {
      auth.showNotification("error", "Tous les champs sont requis.");
      return;
    }
    const editingId = memberForm.dataset.editing;
    const { currentRole } = auth.getRoleContext();
    if (editingId) {
      const targetMember = window.appState.members.find((member) => member.id === parseInt(editingId, 10));
      if (!targetMember) {
        auth.showNotification("error", "Membre introuvable.");
        return;
      }
      if (!auth.checkPermission("members", "update", dept)) {
        auth.showNotification("error", "Permission refusée.");
        return;
      }
      targetMember.name = name;
      targetMember.dept = dept;
      if (currentRole === "admin") {
        targetMember.role = role;
      }
      auth.showNotification("success", "Membre mis à jour.");
    } else {
      if (!auth.checkPermission("members", "create", dept)) {
        auth.showNotification("error", "Permission refusée.");
        return;
      }
      const duplicate = window.appState.members.some(
        (member) => member.name.toLowerCase() === name.toLowerCase() && member.dept === dept
      );
      if (duplicate) {
        auth.showNotification("error", "Ce membre existe déjà.");
        return;
      }
      window.appState.members.push({
        id: generateId(window.appState.members),
        name,
        dept,
        role: currentRole === "admin" ? role : "user"
      });
      auth.showNotification("success", "Membre ajouté.");
    }
    saveData();
    resetMemberForm();
    buildMemberFilterOptions();
    renderMembersGrid();
  });

  memberCancel.addEventListener("click", () => {
    resetMemberForm();
  });

  memberFilter.addEventListener("change", (event) => {
    memberFilterValue = event.target.value;
    renderMembersGrid();
  });

  function refreshMembersPage() {
    buildMemberFilterOptions();
    auth.ensureDepartmentOptions(memberDeptSelect);
    setMemberFormState();
    renderMembersGrid();
  }

  // Initialize
  refreshMembersPage();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initMembersModule);
} else {
  initMembersModule();
}