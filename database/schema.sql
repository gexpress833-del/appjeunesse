-- Schéma MySQL pour AppJeune (migration depuis Supabase/PostgreSQL)
-- Exécutez ce script dans votre client MySQL

CREATE DATABASE IF NOT EXISTS appjeune CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE appjeune;

-- Table des départements (créée en premier pour les FK)
CREATE TABLE IF NOT EXISTS departments (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name VARCHAR(100) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des utilisateurs
CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  username VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) CHECK (role IN ('admin', 'secretariat', 'responsable', 'user')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'inactive')),
  dept VARCHAR(100),
  birth_date DATE,
  address TEXT,
  profile_photo_url TEXT,
  created_by VARCHAR(50),
  role_assigned_by VARCHAR(50),
  role_assigned_at TIMESTAMP NULL,
  status_changed_by VARCHAR(50),
  status_changed_at TIMESTAMP NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_username (username),
  INDEX idx_users_status (status)
);

-- Table des membres
CREATE TABLE IF NOT EXISTS members (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  dept VARCHAR(100) NOT NULL,
  role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('admin', 'secretariat', 'responsable', 'user')),
  phone VARCHAR(20),
  email VARCHAR(255),
  birth_date DATE,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_members_dept (dept)
);

-- Table des événements
CREATE TABLE IF NOT EXISTS events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  description TEXT,
  photo_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_events_date (date)
);

-- Table des présences
CREATE TABLE IF NOT EXISTS attendances (
  id INT AUTO_INCREMENT PRIMARY KEY,
  member_id INT NOT NULL,
  event_id INT NOT NULL,
  status VARCHAR(20) DEFAULT 'present' CHECK (status IN ('present', 'absent', 'late', 'excused')),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_member_event (member_id, event_id),
  FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  INDEX idx_attendances_member (member_id),
  INDEX idx_attendances_event (event_id)
);

-- Contenu de la page d'accueil
CREATE TABLE IF NOT EXISTS home_contents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  type VARCHAR(20) NOT NULL UNIQUE,
  title VARCHAR(255),
  subtitle VARCHAR(255),
  content TEXT,
  reference VARCHAR(255),
  video_url TEXT,
  author VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_home_type CHECK (type IN ('verse', 'testimony', 'video'))
);

-- Données initiales
INSERT IGNORE INTO departments (id, name) VALUES
  (UUID(), 'Chorale'),
  (UUID(), 'Intercession'),
  (UUID(), 'Accueil'),
  (UUID(), 'Médias'),
  (UUID(), 'DLB'),
  (UUID(), 'DCC'),
  (UUID(), 'DFF');

-- Utilisateurs par défaut (mots de passe en clair pour la démo)
INSERT INTO users (id, username, name, email, password, role, status, birth_date, address) VALUES
  (UUID(), 'admin', 'Super Admin', 'admin@laparole.cd', 'admin123', 'admin', 'active', '1985-03-15', '123 Avenue de la Liberté, Quartier Golf, Kolwezi'),
  (UUID(), 'secretariat', 'Secrétariat', 'secretariat@laparole.cd', 'secret123', 'secretariat', 'active', '1990-07-22', '456 Rue de la Paix, Quartier Makomeno, Kolwezi'),
  (UUID(), 'responsable', 'Responsable', 'responsable@laparole.cd', 'resp123', 'responsable', 'active', '1988-11-10', '789 Boulevard Lumumba, Quartier Dilala, Kolwezi'),
  (UUID(), 'user', 'Utilisateur', 'user@laparole.cd', 'user123', 'user', 'active', '1995-05-08', '321 Avenue Mobutu, Quartier Kapata, Kolwezi')
ON DUPLICATE KEY UPDATE name = VALUES(name), email = VALUES(email), password = VALUES(password), role = VALUES(role), status = VALUES(status);
