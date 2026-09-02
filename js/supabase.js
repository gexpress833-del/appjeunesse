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

    // Attendre que l'utilisateur soit disponible dans auth.users (polling)
    const maxRetries = 15;
    const retryDelay = 300; // 300ms
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        // Essayer de créer le profile via la fonction RPC
        const { data: profileResult, error: rpcError } = await window.supabase
          .rpc('create_profile_for_user', {
            p_user_id: data.user.id,
            p_username: user.username,
            p_full_name: user.name,
            p_email: user.email,
            p_birth_date: user.birthDate,
            p_address: user.address,
            p_role: user.role || null,
            p_status: user.status || 'pending',
            p_dept: user.dept || null,
            p_role_assigned_by: user.roleAssignedBy || null,
            p_role_assigned_at: user.roleAssignedAt || null,
            p_created_by: user.createdBy || null,
            p_notes: user.notes || null
          });
        
        if (!rpcError && profileResult) {
          // Profile créé avec succès
          const profile = await this.getProfileByUsername(user.username);
          return { user: data.user, profile };
        }
      } catch (rpcError) {
        console.log('Tentative de création de profile (essai', i + 1, '/', maxRetries, ')');
      }
      
      // Attendre avant de réessayer
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }

    throw new Error('Timeout: Impossible de créer le profile après plusieurs tentatives. Vérifiez que la fonction RPC create_profile_for_user existe dans Supabase.');
  },

  async updateUser(username, updates) {
    const profile = await this.getProfileByUsername(username);
    if (!profile) throw new Error('Profile non trouvé');
    return this.updateProfile(profile.id, updates);
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
