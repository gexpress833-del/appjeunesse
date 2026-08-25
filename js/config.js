// ============================================================================
// CONFIGURATION SUPABASE
// ============================================================================
// Ce fichier configure la connexion à Supabase.
// Les variables doivent être définies dans window.SUPABASE_CONFIG avant le chargement.
// ============================================================================

const SUPABASE_CONFIG = window.SUPABASE_CONFIG || {};

if (!SUPABASE_CONFIG.url || !SUPABASE_CONFIG.anonKey) {
  console.error('❌ ERREUR CRITIQUE: SUPABASE_CONFIG non configuré');
  console.error('   Définissez window.SUPABASE_CONFIG avant de charger ce script:');
  console.error('   window.SUPABASE_CONFIG = {');
  console.error('     url: "https://votre-projet.supabase.co",');
  console.error('     anonKey: "votre_clé_anonyme"');
  console.error('   };');
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
