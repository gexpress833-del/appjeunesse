-- Table pour les témoignages de la jeunesse
CREATE TABLE IF NOT EXISTS temoignages (
  id SERIAL PRIMARY KEY,
  texte TEXT NOT NULL,
  auteur VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_temoignages_is_active ON temoignages(is_active);
CREATE INDEX IF NOT EXISTS idx_temoignages_created_at ON temoignages(created_at DESC);

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_temoignages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_temoignages_updated_at
  BEFORE UPDATE ON temoignages
  FOR EACH ROW
  EXECUTE FUNCTION update_temoignages_updated_at();

-- Politiques RLS (Row Level Security)
ALTER TABLE temoignages ENABLE ROW LEVEL SECURITY;

-- Politique de lecture : tous les utilisateurs authentifiés peuvent lire
CREATE POLICY "Les utilisateurs authentifiés peuvent lire les témoignages"
  ON temoignages FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Politique d'insertion : admin et secretariat peuvent créer
CREATE POLICY "Admin et secretariat peuvent créer des témoignages"
  ON temoignages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'secretariat')
    )
  );

-- Politique de mise à jour : admin et secretariat peuvent modifier
CREATE POLICY "Admin et secretariat peuvent modifier des témoignages"
  ON temoignages FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'secretariat')
    )
  );

-- Politique de suppression : admin et secretariat peuvent supprimer
CREATE POLICY "Admin et secretariat peuvent supprimer des témoignages"
  ON temoignages FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'secretariat')
    )
  );
