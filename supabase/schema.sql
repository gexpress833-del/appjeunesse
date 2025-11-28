-- Schéma de base de données pour AppJeune
-- Exécutez ce script dans l'éditeur SQL de votre projet Supabase

-- Table des utilisateurs
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  password VARCHAR(255) NOT NULL, -- Note: En production, utilisez l'authentification Supabase
  role VARCHAR(20) CHECK (role IN ('admin', 'secretariat', 'responsable', 'user')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'inactive')),
  dept VARCHAR(100),
  birth_date DATE,
  address TEXT,
  profile_photo_url TEXT, -- URL de la photo de profil dans Supabase Storage
  created_by VARCHAR(50),
  role_assigned_by VARCHAR(50),
  role_assigned_at TIMESTAMP WITH TIME ZONE,
  status_changed_by VARCHAR(50),
  status_changed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des départements
CREATE TABLE IF NOT EXISTS departments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des membres
CREATE TABLE IF NOT EXISTS members (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  dept VARCHAR(100) NOT NULL,
  role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('admin', 'secretariat', 'responsable', 'user')),
  phone VARCHAR(20),
  email VARCHAR(255),
  birth_date DATE,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (dept) REFERENCES departments(name) ON DELETE SET NULL
);

-- Table des événements
CREATE TABLE IF NOT EXISTS events (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  description TEXT,
  photo_url TEXT, -- URL de la photo dans Supabase Storage (bucket: event-photos)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des présences
CREATE TABLE IF NOT EXISTS attendances (
  id SERIAL PRIMARY KEY,
  member_id INTEGER NOT NULL,
  event_id INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'present' CHECK (status IN ('present', 'absent', 'late', 'excused')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  UNIQUE(member_id, event_id) -- Un membre ne peut avoir qu'une présence par événement
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_members_dept ON members(dept);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
CREATE INDEX IF NOT EXISTS idx_attendances_member ON attendances(member_id);
CREATE INDEX IF NOT EXISTS idx_attendances_event ON attendances(event_id);

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_members_updated_at BEFORE UPDATE ON members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attendances_updated_at BEFORE UPDATE ON attendances
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Contenu de la page d'accueil (verset du jour, témoignages, vidéos, etc.)
CREATE TABLE IF NOT EXISTS home_contents (
  id SERIAL PRIMARY KEY,
  type VARCHAR(20) NOT NULL CHECK (type IN ('verse', 'testimony', 'video')),
  title VARCHAR(255),
  subtitle VARCHAR(255),
  content TEXT,
  reference VARCHAR(255),
  video_url TEXT,
  author VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Un seul contenu actif par type (la dernière entrée remplace l'ancienne)
CREATE UNIQUE INDEX IF NOT EXISTS idx_home_contents_type ON home_contents(type);

-- Insérer les départements par défaut
INSERT INTO departments (name) VALUES
  ('Chorale'),
  ('Intercession'),
  ('Accueil'),
  ('Médias'),
  ('DLB'),
  ('DCC'),
  ('DFF')
ON CONFLICT (name) DO NOTHING;

-- Insérer les utilisateurs par défaut (mots de passe en clair pour la démo)
-- En production, utilisez l'authentification Supabase avec hash
INSERT INTO users (username, name, email, password, role, status, birth_date, address) VALUES
  ('admin', 'Super Admin', 'admin@laparole.cd', 'admin123', 'admin', 'active', '1985-03-15', '123 Avenue de la Liberté, Quartier Golf, Kolwezi'),
  ('secretariat', 'Secrétariat', 'secretariat@laparole.cd', 'secret123', 'secretariat', 'active', '1990-07-22', '456 Rue de la Paix, Quartier Makomeno, Kolwezi'),
  ('responsable', 'Responsable', 'responsable@laparole.cd', 'resp123', 'responsable', 'active', '1988-11-10', '789 Boulevard Lumumba, Quartier Dilala, Kolwezi'),
  ('user', 'Utilisateur', 'user@laparole.cd', 'user123', 'user', 'active', '1995-05-08', '321 Avenue Mobutu, Quartier Kapata, Kolwezi')
ON CONFLICT (username) DO NOTHING;

-- Activer Row Level Security (RLS) - Optionnel mais recommandé
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE members ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE events ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE attendances ENABLE ROW LEVEL SECURITY;

-- Politiques RLS (exemple - à adapter selon vos besoins)
-- CREATE POLICY "Users can view their own data" ON users FOR SELECT USING (auth.uid()::text = id::text);
-- CREATE POLICY "Public read access" ON members FOR SELECT USING (true);
-- CREATE POLICY "Public read access" ON departments FOR SELECT USING (true);
-- CREATE POLICY "Public read access" ON events FOR SELECT USING (true);
-- CREATE POLICY "Public read access" ON attendances FOR SELECT USING (true);

