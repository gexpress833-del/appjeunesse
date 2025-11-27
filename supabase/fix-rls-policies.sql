-- Script pour corriger les politiques RLS
-- Exécutez ce script si la création d'événements (ou autres opérations) ne fonctionne pas
-- 
-- Ce script désactive RLS ou crée des politiques publiques pour toutes les tables
-- Puisque l'application utilise une authentification personnalisée (pas Supabase Auth)

-- ==================== OPTION 1: DÉSACTIVER RLS (RECOMMANDÉ) ====================
-- Si vous préférez gérer la sécurité au niveau de l'application

ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE members DISABLE ROW LEVEL SECURITY;
ALTER TABLE departments DISABLE ROW LEVEL SECURITY;
ALTER TABLE events DISABLE ROW LEVEL SECURITY;
ALTER TABLE attendances DISABLE ROW LEVEL SECURITY;

-- ==================== OPTION 2: CRÉER DES POLITIQUES PUBLIQUES ====================
-- Décommentez cette section si vous préférez garder RLS activé avec des politiques publiques

/*
-- Activer RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendances ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Public read access" ON users;
DROP POLICY IF EXISTS "Public read access" ON members;
DROP POLICY IF EXISTS "Public read access" ON departments;
DROP POLICY IF EXISTS "Public read access" ON events;
DROP POLICY IF EXISTS "Public read access" ON attendances;

-- Politiques publiques pour la lecture
CREATE POLICY "Public read access" ON users FOR SELECT USING (true);
CREATE POLICY "Public read access" ON members FOR SELECT USING (true);
CREATE POLICY "Public read access" ON departments FOR SELECT USING (true);
CREATE POLICY "Public read access" ON events FOR SELECT USING (true);
CREATE POLICY "Public read access" ON attendances FOR SELECT USING (true);

-- Politiques publiques pour l'insertion
CREATE POLICY "Public insert access" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert access" ON members FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert access" ON departments FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert access" ON events FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert access" ON attendances FOR INSERT WITH CHECK (true);

-- Politiques publiques pour la mise à jour
CREATE POLICY "Public update access" ON users FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public update access" ON members FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public update access" ON departments FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public update access" ON events FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public update access" ON attendances FOR UPDATE USING (true) WITH CHECK (true);

-- Politiques publiques pour la suppression
CREATE POLICY "Public delete access" ON users FOR DELETE USING (true);
CREATE POLICY "Public delete access" ON members FOR DELETE USING (true);
CREATE POLICY "Public delete access" ON departments FOR DELETE USING (true);
CREATE POLICY "Public delete access" ON events FOR DELETE USING (true);
CREATE POLICY "Public delete access" ON attendances FOR DELETE USING (true);
*/

