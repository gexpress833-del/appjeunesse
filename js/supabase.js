// ============================================================================
// SUPABASE DB - Légacy Interface
// ============================================================================
// Ce fichier fournit une interface compatible avec l'ancien code
// en utilisant les nouveaux services Supabase.
// Les nouveaux services sont dans js/services/
// ============================================================================

// Le client Supabase est maintenant initialisé dans js/services/supabase-client.js
// Les services sont disponibles via window.authService, window.profilesService, etc.

/**
 * Interface legacy pour compatibilité avec le code existant
 * Utilise les nouveaux services en interne
 */
const supabaseDB = {
  // Obtenir le client Supabase
  getClient: () => window.supabase,

  // ============================================================================
  // PROFILES (anciennement users)
  // ============================================================================
  
  async getProfiles() {
    return window.profilesService?.getAllProfiles() || [];
  },

  async getProfileByUsername(username) {
    return window.profilesService?.getProfileByUsername(username) || null;
  },

  async getProfileById(id) {
    return window.profilesService?.getProfileById(id) || null;
  },

  async createProfile(profile) {
    return window.profilesService?.createProfile(profile);
  },

  async updateProfile(id, updates) {
    return window.profilesService?.updateProfile(id, updates);
  },

  async deleteProfile(id) {
    return window.profilesService?.deleteProfile(id);
  },

  // Alias pour compatibilité avec l'ancien code
  async getUsers() {
    return this.getProfiles();
  },

  async getUserByUsername(username) {
    return this.getProfileByUsername(username);
  },

  async createUser(user) {
    // Créer l'utilisateur via Supabase Auth
    const { data, error } = await window.supabase.auth.signUp({
      email: user.email,
      password: user.password,
      options: {
        data: {
          username: user.username,
          full_name: user.name
        }
      }
    });

    if (error) throw error;

    // Créer le profile directement dans la table profiles
    try {
      const profileData = {
        id: data.user.id,
        username: user.username,
        full_name: user.name,
        email: user.email,
        birth_date: user.birthDate,
        address: user.address,
        role: user.role || null,
        status: user.status || 'pending',
        dept: user.dept || null,
        role_assigned_by: user.roleAssignedBy || null,
        role_assigned_at: user.roleAssignedAt || null,
        status_changed_by: null,
        status_changed_at: null,
        notes: user.notes || null,
        created_by: user.createdBy || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const profile = await window.profilesService?.createProfile(profileData);
      return { user: data.user, profile };
    } catch (profileError) {
      console.error('Erreur lors de la création du profile:', profileError);
      // En cas d'erreur, supprimer l'utilisateur Auth créé
      try {
        await window.supabase.auth.admin.deleteUser(data.user.id);
      } catch (deleteError) {
        console.error('Erreur lors de la suppression de l\'utilisateur:', deleteError);
      }
      throw new Error('Erreur lors de la création du profile: ' + profileError.message);
    }
  },

  async updateUser(username, updates) {
    const profile = await this.getProfileByUsername(username);
    if (!profile) throw new Error('Profile non trouvé');
    
    // Convertir les noms de propriétés camelCase en snake_case
    const mappedUpdates = {};
    for (const key in updates) {
      if (key === 'birthDate') {
        mappedUpdates['birth_date'] = updates[key];
      } else if (key === 'name') {
        mappedUpdates['full_name'] = updates[key];
      } else {
        mappedUpdates[key] = updates[key];
      }
    }
    
    return this.updateProfile(profile.id, mappedUpdates);
  },

  async deleteUser(username) {
    const profile = await this.getProfileByUsername(username);
    if (!profile) throw new Error('Profile non trouvé');
    
    // Supprimer le profile (l'utilisateur Auth sera supprimé par CASCADE)
    return this.deleteProfile(profile.id);
  },

  // ============================================================================
  // DEPARTMENTS
  // ============================================================================

  async getDepartments() {
    const depts = await window.departmentsService?.getAllDepartments() || [];
    return depts.map(d => d.name);
  },

  async getDepartmentByName(name) {
    return window.departmentsService?.getDepartmentByName(name) || null;
  },

  async createDepartment(name) {
    return window.departmentsService?.createDepartment(name);
  },

  async updateDepartment(id, updates) {
    return window.departmentsService?.updateDepartment(id, updates);
  },

  async deleteDepartment(id) {
    return window.departmentsService?.deleteDepartment(id);
  },

  // ============================================================================
  // MEMBERS
  // ============================================================================

  async getMembers() {
    return window.membersService?.getAllMembers() || [];
  },

  async getMemberById(id) {
    return window.membersService?.getMemberById(id) || null;
  },

  async createMember(member) {
    return window.membersService?.createMember(member);
  },

  async updateMember(id, updates) {
    return window.membersService?.updateMember(id, updates);
  },

  async deleteMember(id) {
    return window.membersService?.deleteMember(id);
  },

  // ============================================================================
  // EVENTS
  // ============================================================================

  async getEvents() {
    return window.eventsService?.getAllEvents() || [];
  },

  async getEventById(id) {
    return window.eventsService?.getEventById(id) || null;
  },

  async createEvent(event) {
    return window.eventsService?.createEvent(event);
  },

  async updateEvent(id, updates) {
    return window.eventsService?.updateEvent(id, updates);
  },

  async deleteEvent(id) {
    return window.eventsService?.deleteEvent(id);
  },

  // ============================================================================
  // ATTENDANCES
  // ============================================================================

  async getAttendances() {
    return window.attendancesService?.getAllAttendances() || [];
  },

  async getAttendanceByMember(memberId) {
    return window.attendancesService?.getAttendancesByMember(memberId) || [];
  },

  async getAttendanceByEvent(eventId) {
    return window.attendancesService?.getAttendancesByEvent(eventId) || [];
  },

  async getAttendanceById(id) {
    // Legacy compatibility - not in new service
    const all = await this.getAttendances();
    return all.find(a => a.id === id) || null;
  },

  async createAttendance(attendance) {
    return window.attendancesService?.createAttendance(attendance);
  },

  async updateAttendance(id, updates) {
    return window.attendancesService?.updateAttendance(id, updates);
  },

  async deleteAttendance(id) {
    return window.attendancesService?.deleteAttendance(id);
  },

  // ============================================================================
  // HOME CONTENTS
  // ============================================================================

  async getHomeContents() {
    return window.homeContentsService?.getAllHomeContents() || [];
  },

  async getActiveHomeContentByType(type) {
    return window.homeContentsService?.getActiveHomeContentByType(type) || null;
  },

  async getHomeContent(type) {
    // Alias for legacy compatibility
    return this.getActiveHomeContentByType(type);
  },

  async createHomeContent(content) {
    return window.homeContentsService?.createHomeContent(content);
  },

  async updateHomeContent(id, updates) {
    return window.homeContentsService?.updateHomeContent(id, updates);
  },

  async deleteHomeContent(id) {
    return window.homeContentsService?.deleteHomeContent(id);
  },

  async upsertHomeContent(type, payload) {
    // Legacy upsert - delete old and create new
    await this.deleteHomeContentByType(type);
    return this.createHomeContent({ ...payload, type, is_active: true });
  },

  async deleteHomeContentByType(type) {
    const all = await this.getHomeContents();
    for (const item of all) {
      if (item.type === type) {
        await this.deleteHomeContent(item.id);
      }
    }
  },

  // ============================================================================
  // STATUS MAPPING (Legacy)
  // ============================================================================

  mapAttendanceStatus(status) {
    const statusMap = {
      'P': 'present',
      'A': 'absent',
      'AJ': 'excused',
      'L': 'late',
      'present': 'present',
      'absent': 'absent',
      'excused': 'excused',
      'late': 'late'
    };
    return statusMap[status] || 'present';
  },

  unmapAttendanceStatus(status) {
    const statusMap = {
      'present': 'P',
      'absent': 'A',
      'excused': 'AJ',
      'late': 'L'
    };
    return statusMap[status] || status;
  }
};

// Exporter l'interface legacy
window.supabaseDB = supabaseDB;

console.log('✅ Supabase DB interface initialisée (mode legacy)');
