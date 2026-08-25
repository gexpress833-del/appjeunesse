// ============================================================================
// SUPABASE CLIENT
// ============================================================================
// Initialise le client Supabase avec la configuration
// ============================================================================

// Charger le client Supabase depuis le CDN
const { createClient } = window.supabase;

let supabaseClient = null;

function getSupabaseClient() {
  if (!supabaseClient && window.APP_CONFIG) {
    supabaseClient = createClient(
      window.APP_CONFIG.supabaseUrl,
      window.APP_CONFIG.supabaseAnonKey
    );
  }
  return supabaseClient;
}

// Exporter le client
window.supabase = getSupabaseClient();
