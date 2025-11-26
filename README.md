# 👥 AppJeune - Gestion d'Équipe

Une application web complète de gestion d'équipe avec gestion des rôles, des présences, des événements et des rapports.

## 🚀 Fonctionnalités

- **Authentification** : Système de login sécurisé avec rôles
- **Gestion des Rôles** : Admin, Secrétariat, Responsable, Utilisateur
- **Gestion d'Équipe** : Membres, départements, profils
- **Présences** : Suivi des attendances
- **Événements** : Création et gestion des événements
- **Rapports** : Génération de rapports PDF
- **Stockage** : Gestion des photos et des données

## 📁 Structure du Projet

```
├── index.html                 # Page d'accueil/redirection
├── login.html                # Page de connexion
├── admin.html                # Tableau de bord administrateur
├── secretariat.html          # Interface secrétariat
├── responsable.html          # Interface responsable
├── user.html                 # Interface utilisateur
├── members.html              # Gestion des membres
├── departments.html          # Gestion des départements
├── events.html               # Gestion des événements
├── attendances.html          # Gestion des présences
├── reports.html              # Gestion des rapports
├── css/
│   └── styles.css           # Styles principaux
└── js/
    ├── auth.js              # Authentification
    ├── data.js              # Gestion des données
    ├── users.js             # Gestion des utilisateurs
    ├── members.js           # Gestion des membres
    ├── departments.js       # Gestion des départements
    ├── events.js            # Gestion des événements
    ├── attendances.js       # Gestion des présences
    ├── pdf-reports.js       # Génération de rapports PDF
    └── autres fichiers...
```

## 🔐 Rôles Disponibles

- **Admin** : Accès complet au système
- **Secrétariat** : Gestion des données, rapports
- **Responsable** : Supervision d'équipe
- **User** : Accès basique

## 💾 Données

L'application utilise **localStorage** pour persister les données localement. Les données incluent :
- Utilisateurs et authentification
- Membres d'équipe
- Départements
- Événements
- Présences
- Rapports

## 🌐 Utilisation

1. Ouvrez `index.html` dans votre navigateur
2. Connectez-vous avec vos identifiants
3. Naviguez selon votre rôle

### Identifiants par Défaut (exemple)
Voir la page login.html pour les identifiants disponibles.

## 🛠️ Technologies Utilisées

- **HTML5** : Structure
- **CSS3** : Mise en forme et design
- **JavaScript Vanilla** : Logique et interactivité
- **LocalStorage** : Persistance des données

## 📊 Fonctionnalités Avancées

- Génération de rapports PDF
- Optimisation de la performance
- Gestion des photos utilisateur
- Système de notifications
- Analyse du stockage local

## 📝 Documentation

- `GUIDE_UTILISATEURS.md` : Guide complet d'utilisation
- `LOGO_INSTRUCTIONS.md` : Instructions pour les logos
- `DEPANNAGE_ROLES.md` : Résolution des problèmes de rôles

## 🔧 Configuration

Aucune configuration requise. L'application fonctionne entièrement côté client.

## 📄 Licence

Ce projet est destiné à un usage interne.

---

**Auteur** : AppJeune Team  
**Date** : 2025
