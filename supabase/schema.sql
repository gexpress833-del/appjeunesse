-- ============================================================================
-- SCHÉMA DE BASE DE DONNÉES APPJEUNE POUR SUPABASE
-- ============================================================================
-- Ce schéma utilise Supabase Auth pour l'authentification.
-- Les mots de passe sont gérés exclusivement par auth.users.
-- La table profiles stocke les métadonnées utilisateur liées à auth.users.id
-- ============================================================================

-- ============================================================================
-- TABLE PROFILES (liée à auth.users)
-- ============================================================================
-- Cette table étend auth.users avec les métadonnées applicatives
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('admin', 'secretariat', 'responsable', 'user')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'inactive')),
  dept VARCHAR(100),
  birth_date DATE,
  address TEXT,
  profile_photo_url TEXT, -- URL de la photo de profil (Cloudinary)
  created_by VARCHAR(50),
  role_assigned_by VARCHAR(50),
  role_assigned_at TIMESTAMP WITH TIME ZONE,
  status_changed_by VARCHAR(50),
  status_changed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour optimiser les recherches
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_dept ON public.profiles(dept);

-- ============================================================================
-- TABLE DEPARTMENTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.departments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_departments_name ON public.departments(name);

-- ============================================================================
-- TABLE MEMBERS
-- ============================================================================
-- Les membres sont distincts des utilisateurs authentifiés
CREATE TABLE IF NOT EXISTS public.members (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  dept VARCHAR(100) NOT NULL,
  role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('admin', 'secretariat', 'responsable', 'user')),
  phone VARCHAR(20),
  email VARCHAR(255),
  birth_date DATE,
  address TEXT,
  profile_photo_url TEXT, -- URL de la photo (Cloudinary)
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (dept) REFERENCES public.departments(name) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_members_dept ON public.members(dept);
CREATE INDEX IF NOT EXISTS idx_members_name ON public.members(name);

-- ============================================================================
-- TABLE EVENTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.events (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  description TEXT,
  photo_url TEXT, -- URL de la photo (Cloudinary)
  cloudinary_public_id TEXT, -- ID public Cloudinary pour suppression
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(date);
CREATE INDEX IF NOT EXISTS idx_events_name ON public.events(name);

-- ============================================================================
-- TABLE ATTENDANCES
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.attendances (
  id SERIAL PRIMARY KEY,
  member_id INTEGER NOT NULL,
  event_id INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'present' CHECK (status IN ('present', 'absent', 'late', 'excused')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (member_id) REFERENCES public.members(id) ON DELETE CASCADE,
  FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE,
  UNIQUE(member_id, event_id) -- Un membre ne peut avoir qu'une présence par événement
);

CREATE INDEX IF NOT EXISTS idx_attendances_member ON public.attendances(member_id);
CREATE INDEX IF NOT EXISTS idx_attendances_event ON public.attendances(event_id);
CREATE INDEX IF NOT EXISTS idx_attendances_status ON public.attendances(status);

-- ============================================================================
-- TABLE HOME_CONTENTS
-- ============================================================================
-- Contenu de la page d'accueil (verset du jour, témoignages, vidéos, etc.)
CREATE TABLE IF NOT EXISTS public.home_contents (
  id SERIAL PRIMARY KEY,
  type VARCHAR(20) NOT NULL CHECK (type IN ('verse', 'testimony', 'video')),
  title VARCHAR(255),
  subtitle VARCHAR(255),
  content TEXT,
  reference VARCHAR(255),
  video_url TEXT,
  author VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Un seul contenu actif par type
CREATE UNIQUE INDEX IF NOT EXISTS idx_home_contents_type ON public.home_contents(type) WHERE is_active = TRUE;

-- ============================================================================
-- TRIGGERS POUR UPDATED_AT
-- ============================================================================

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON public.departments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_members_updated_at BEFORE UPDATE ON public.members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attendances_updated_at BEFORE UPDATE ON public.attendances
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_home_contents_updated_at BEFORE UPDATE ON public.home_contents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- DONNÉES INITIALES (SEED)
-- ============================================================================

-- Insérer les départements par défaut
INSERT INTO public.departments (name) VALUES
  ('Chorale'),
  ('Intercession'),
  ('Accueil'),
  ('Médias'),
  ('DLB'),
  ('DCC'),
  ('DFF')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- NOTE SUR LES UTILISATEURS PAR DÉFAUT
-- ============================================================================
-- Les utilisateurs par défaut doivent être créés via Supabase Auth.
-- Utilisez le dashboard Supabase ou l'API Supabase Auth pour créer les comptes.
-- Ensuite, créez les profiles correspondants avec les rôles appropriés.
--
-- Exemple de création de profile pour un utilisateur existant dans auth.users:
-- INSERT INTO public.profiles (id, username, full_name, email, role, status, dept, birth_date, address)
-- VALUES (
--   (SELECT id FROM auth.users WHERE email = 'admin@laparole.cd'),
--   'admin',
--   'Super Admin',
--   'admin@laparole.cd',
--   'admin',
--   'active',
--   NULL,
--   '1985-03-15',
--   '123 Avenue de la Liberté, Quartier Golf, Kolwezi'
-- );
-- ============================================================================

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================
-- RLS est activé pour sécuriser les données au niveau de la base de données.
-- Les politiques ci-dessous définissent qui peut faire quoi sur chaque table.
-- ============================================================================

-- Activer RLS sur toutes les tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.home_contents ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- POLITIQUES RLS POUR PROFILES
-- ============================================================================

-- Tout le monde peut voir les profiles (lecture publique)
CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

-- Seuls les admins peuvent créer des profiles
CREATE POLICY "Only admins can create profiles"
  ON public.profiles FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Les utilisateurs peuvent mettre à jour leur propre profile
-- Les admins peuvent mettre à jour tous les profiles
CREATE POLICY "Users can update own profile, admins all"
  ON public.profiles FOR UPDATE
  USING (
    id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Seuls les admins peuvent supprimer des profiles
CREATE POLICY "Only admins can delete profiles"
  ON public.profiles FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- POLITIQUES RLS POUR DEPARTMENTS
-- ============================================================================

-- Tout le monde peut voir les départements
CREATE POLICY "Departments are viewable by everyone"
  ON public.departments FOR SELECT
  USING (true);

-- Seuls les admins peuvent créer des départements
CREATE POLICY "Only admins can create departments"
  ON public.departments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Seuls les admins peuvent mettre à jour des départements
CREATE POLICY "Only admins can update departments"
  ON public.departments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Seuls les admins peuvent supprimer des départements
CREATE POLICY "Only admins can delete departments"
  ON public.departments FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- POLITIQUES RLS POUR MEMBERS
-- ============================================================================

-- Tout le monde peut voir les membres
CREATE POLICY "Members are viewable by everyone"
  ON public.members FOR SELECT
  USING (true);

-- Admins et secrétariat peuvent créer des membres
CREATE POLICY "Admins and secretariat can create members"
  ON public.members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'secretariat')
    )
  );

-- Admins peuvent modifier tous les membres
-- Secrétariat peut modifier les membres (sans changer le rôle)
-- Responsables peuvent modifier les membres de leur département
CREATE POLICY "Admins can update all, secretariat members, responsable own dept"
  ON public.members FOR UPDATE
  USING (
    -- Admin: accès complet
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
    OR
    -- Secrétariat: peut modifier mais pas le rôle (vérifié côté applicatif)
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'secretariat'
    )
    OR
    -- Responsable: peut modifier les membres de son département
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'responsable' AND dept = public.members.dept
    )
  );

-- Admins peuvent supprimer des membres
CREATE POLICY "Only admins can delete members"
  ON public.members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- POLITIQUES RLS POUR EVENTS
-- ============================================================================

-- Tout le monde peut voir les événements
CREATE POLICY "Events are viewable by everyone"
  ON public.events FOR SELECT
  USING (true);

-- Admins et secrétariat peuvent créer des événements
CREATE POLICY "Admins and secretariat can create events"
  ON public.events FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'secretariat')
    )
  );

-- Admins et secrétariat peuvent modifier des événements
CREATE POLICY "Admins and secretariat can update events"
  ON public.events FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'secretariat')
    )
  );

-- Admins peuvent supprimer des événements
CREATE POLICY "Only admins can delete events"
  ON public.events FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- POLITIQUES RLS POUR ATTENDANCES
-- ============================================================================

-- Les responsables et admins peuvent voir les présences de leur département
-- Les membres peuvent voir leurs propres présences
CREATE POLICY "Users can see own attendances, responsable own dept, admins all"
  ON public.attendances FOR SELECT
  USING (
    -- Admin: voit tout
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
    OR
    -- Responsable: voit les présences de son département
    EXISTS (
      SELECT 1 FROM public.attendances a
      JOIN public.members m ON a.member_id = m.id
      JOIN public.profiles p ON p.id = auth.uid()
      WHERE p.role = 'responsable' AND m.dept = p.dept
      AND a.id = public.attendances.id
    )
    OR
    -- Secrétariat: voit toutes les présences
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'secretariat'
    )
  );

-- Admins, secrétariat et responsables peuvent créer des présences
CREATE POLICY "Admins, secretariat, responsable can create attendances"
  ON public.attendances FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'secretariat', 'responsable')
    )
  );

-- Admins, secrétariat et responsables peuvent modifier des présences
CREATE POLICY "Admins, secretariat, responsable can update attendances"
  ON public.attendances FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'secretariat', 'responsable')
    )
  );

-- Admins peuvent supprimer des présences
CREATE POLICY "Only admins can delete attendances"
  ON public.attendances FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- POLITIQUES RLS POUR HOME_CONTENTS
-- ============================================================================

-- Tout le monde peut voir le contenu d'accueil
CREATE POLICY "Home contents are viewable by everyone"
  ON public.home_contents FOR SELECT
  USING (true);

-- Seuls les admins peuvent créer du contenu d'accueil
CREATE POLICY "Only admins can create home contents"
  ON public.home_contents FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Seuls les admins peuvent modifier du contenu d'accueil
CREATE POLICY "Only admins can update home contents"
  ON public.home_contents FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Seuls les admins peuvent supprimer du contenu d'accueil
CREATE POLICY "Only admins can delete home contents"
  ON public.home_contents FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

