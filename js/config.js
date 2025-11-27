// Configuration Supabase
const SUPABASE_CONFIG = {
  url: window.SUPABASE_URL || 'https://etbootzjdlxrfrfycjsz.supabase.co',
  anonKey: window.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0Ym9vdHpqZGx4cmZyZnljanN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxNTE5MzMsImV4cCI6MjA3OTcyNzkzM30.K5hx0HjYvCwJUaiUlE8qYrB7SPm4ofCagICVGjKMnTc'
};

// Vérification de la configuration
if (!SUPABASE_CONFIG.url || !SUPABASE_CONFIG.anonKey || 
    SUPABASE_CONFIG.url === 'YOUR_SUPABASE_URL' || 
    SUPABASE_CONFIG.anonKey === 'YOUR_SUPABASE_ANON_KEY') {
  console.warn('⚠️ Configuration Supabase non définie. Veuillez configurer vos clés dans js/config.js ou via les variables d\'environnement.');
} else {
  console.log('✅ Configuration Supabase chargée');
}

window.SUPABASE_CONFIG = SUPABASE_CONFIG;

