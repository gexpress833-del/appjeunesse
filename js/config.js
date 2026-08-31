// ============================================================================
// CONFIGURATION SUPABASE
// ============================================================================
// Ce fichier configure la connexion à Supabase.
// Priorité: window.SUPABASE_CONFIG > localStorage > valeurs par défaut
// ============================================================================

// Configuration par défaut (pré-remplie pour éviter la configuration manuelle)
const DEFAULT_SUPABASE_CONFIG = {
  url: 'https://gfolhwqthifhnhzspaou.supabase.co',
  anonKey: 'sb_publishable_gCThAA5ax0sbSVdgB90FvA_m6FGJpdh',
  cloudinaryCloudName: 'dxarljqz7',
  cloudinaryUploadPreset: 'unsigned'
};

// Essayer de récupérer depuis localStorage si window.SUPABASE_CONFIG n'existe pas
if (!window.SUPABASE_CONFIG) {
  try {
    const storedConfig = localStorage.getItem('SUPABASE_CONFIG');
    if (storedConfig) {
      window.SUPABASE_CONFIG = JSON.parse(storedConfig);
    } else {
      // Utiliser la configuration par défaut
      window.SUPABASE_CONFIG = DEFAULT_SUPABASE_CONFIG;
    }
  } catch (e) {
    console.warn('Erreur lors de la lecture de la configuration depuis localStorage:', e);
    window.SUPABASE_CONFIG = DEFAULT_SUPABASE_CONFIG;
  }
}

const SUPABASE_CONFIG = window.SUPABASE_CONFIG || DEFAULT_SUPABASE_CONFIG;

if (!SUPABASE_CONFIG.url || !SUPABASE_CONFIG.anonKey) {
  console.error('❌ ERREUR CRITIQUE: SUPABASE_CONFIG non configuré');
  console.error('   Définissez window.SUPABASE_CONFIG avant de charger ce script:');
  console.error('   window.SUPABASE_CONFIG = {');
  console.error('     url: "https://votre-projet.supabase.co",');
  console.error('     anonKey: "votre_clé_anonyme"');
  console.error('   };');
  console.error('   OU utilisez supabase-config.html pour configurer');
}

const APP_CONFIG = {
  supabaseUrl: SUPABASE_CONFIG.url,
  supabaseAnonKey: SUPABASE_CONFIG.anonKey,
  cloudinaryCloudName: SUPABASE_CONFIG.cloudinaryCloudName || '',
  cloudinaryUploadPreset: SUPABASE_CONFIG.cloudinaryUploadPreset || ''
};

if (APP_CONFIG.supabaseUrl && APP_CONFIG.supabaseAnonKey) {
  console.log('✅ Supabase configuré:', APP_CONFIG.supabaseUrl);
}

window.APP_CONFIG = APP_CONFIG;
