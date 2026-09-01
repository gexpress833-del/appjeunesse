-- Table pour les paramètres de configuration de l'application
CREATE TABLE IF NOT EXISTS settings (
  id SERIAL PRIMARY KEY,
  key VARCHAR(255) UNIQUE NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_settings_updated_at
  BEFORE UPDATE ON settings
  FOR EACH ROW
  EXECUTE FUNCTION update_settings_updated_at();

-- Politiques RLS (Row Level Security)
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Politique de lecture : tous les utilisateurs authentifiés peuvent lire
CREATE POLICY "Les utilisateurs authentifiés peuvent lire les settings"
  ON settings FOR SELECT
  TO authenticated
  USING (true);

-- Politique d'insertion : admin et secretariat peuvent créer
CREATE POLICY "Admin et secretariat peuvent créer des settings"
  ON settings FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'secretariat')
    )
  );

-- Politique de mise à jour : admin et secretariat peuvent modifier
CREATE POLICY "Admin et secretariat peuvent modifier des settings"
  ON settings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'secretariat')
    )
  );

-- Politique de suppression : admin et secretariat peuvent supprimer
CREATE POLICY "Admin et secretariat peuvent supprimer des settings"
  ON settings FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'secretariat')
    )
  );

-- Insérer la configuration par défaut du carrousel
INSERT INTO settings (key, value, description)
VALUES ('carousel_interval_minutes', '5', 'Délai de défilement du carrousel de témoignages en minutes')
ON CONFLICT (key) DO NOTHING;
