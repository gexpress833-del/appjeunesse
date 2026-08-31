// ============================================================================
// AUTH SERVICE
// ============================================================================
// Gère l'authentification via Supabase Auth
// ============================================================================

/**
 * Inscrire un nouvel utilisateur
 * @param {string} email - Email de l'utilisateur
 * @param {string} password - Mot de passe
 * @param {Object} metadata - Métadonnées (username, full_name, etc.)
 * @returns {Promise<Object>} Résultat de l'inscription
 */
async function signUp(email, password, metadata = {}) {
  const { data, error } = await window.supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata
    }
  });

  if (error) {
    console.error('Erreur inscription:', error);
    throw error;
  }

  // Créer le profile après l'inscription
  if (data.user) {
    await createProfile(data.user.id, metadata);
  }

  return data;
}

/**
 * Connecter un utilisateur
 * @param {string} email - Email de l'utilisateur
 * @param {string} password - Mot de passe
 * @returns {Promise<Object>} Résultat de la connexion
 */
async function signIn(email, password) {
  const { data, error } = await window.supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    console.error('Erreur connexion:', error);
    throw error;
  }

  return data;
}

/**
 * Déconnecter l'utilisateur
 * @returns {Promise<Object>} Résultat de la déconnexion
 */
async function signOut() {
  const { error } = await window.supabase.auth.signOut();
  
  if (error) {
    console.error('Erreur déconnexion:', error);
    throw error;
  }

  // Nettoyer localStorage
  localStorage.removeItem('appRole');
  localStorage.removeItem('appDept');
  localStorage.removeItem('appUser');
  localStorage.removeItem('appUserName');
  localStorage.removeItem('appLoginTime');

  return { success: true };
}

/**
 * Obtenir la session actuelle
 * @returns {Promise<Object>} Session actuelle
 */
async function getSession() {
  const { data: { session }, error } = await window.supabase.auth.getSession();
  
  if (error) {
    console.error('Erreur récupération session:', error);
    throw error;
  }

  return session;
}

/**
 * Obtenir l'utilisateur actuel
 * @returns {Promise<Object>} Utilisateur actuel
 */
async function getCurrentUser() {
  const { data: { user }, error } = await window.supabase.auth.getUser();
  
  if (error) {
    console.error('Erreur récupération utilisateur:', error);
    throw error;
  }

  return user;
}

/**
 * Écouter les changements d'état d'authentification
 * @param {Function} callback - Fonction appelée lors des changements
 * @returns {Object} Subscription
 */
function onAuthStateChange(callback) {
  return window.supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
}

/**
 * Créer un profile pour un utilisateur authentifié
 * @param {string} userId - ID de l'utilisateur dans auth.users
 * @param {Object} metadata - Métadonnées du profile
 * @returns {Promise<Object>} Profile créé
 */
async function createProfile(userId, metadata) {
  const { data, error } = await window.supabase
    .from('profiles')
    .insert({
      id: userId,
      username: metadata.username || metadata.email?.split('@')[0],
      full_name: metadata.full_name || metadata.username || '',
      email: metadata.email,
      phone: metadata.phone || null,
      role: metadata.role || 'user',
      status: metadata.status || 'pending',
      dept: metadata.dept || null,
      birth_date: metadata.birth_date || null,
      address: metadata.address || null
    })
    .select()
    .single();

  if (error) {
    console.error('Erreur création profile:', error);
    throw error;
  }

  return data;
}

/**
 * Obtenir le profile de l'utilisateur actuel
 * @returns {Promise<Object>} Profile de l'utilisateur
 */
async function getCurrentProfile() {
  const user = await getCurrentUser();
  
  if (!user) {
    return null;
  }

  const { data, error } = await window.supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) {
    console.error('Erreur récupération profile:', error);
    throw error;
  }

  return data;
}

/**
 * Mettre à jour le profile de l'utilisateur
 * @param {string} userId - ID de l'utilisateur
 * @param {Object} updates - Données à mettre à jour
 * @returns {Promise<Object>} Profile mis à jour
 */
async function updateProfile(userId, updates) {
  const { data, error } = await window.supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error('Erreur mise à jour profile:', error);
    throw error;
  }

  return data;
}

// Export du service
window.authService = {
  signUp,
  signIn,
  signOut,
  getSession,
  getCurrentUser,
  onAuthStateChange,
  createProfile,
  getCurrentProfile,
  updateProfile
};
