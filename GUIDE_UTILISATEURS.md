# 👥 Guide de Gestion des Utilisateurs

## 🎯 **Différence importante :**

### 📋 **Page "Membres" (members.html)**
- **Objectif** : Gérer les membres existants de l'église
- **Fonctions** : Ajouter/modifier/supprimer des membres dans les départements
- **Accès** : Admin, Secrétariat, Responsable (selon département)

### 👤 **Page "Utilisateurs" (users.html)**
- **Objectif** : Créer des comptes utilisateurs pour l'application
- **Fonctions** : 
  - **🔒 Secrétaire UNIQUEMENT** : Créer de nouveaux comptes utilisateurs
  - **🔒 Admin UNIQUEMENT** : Attribuer des rôles aux comptes créés
- **Accès** : 
  - Secrétaire : Voit "👤 Créer utilisateurs" dans le menu
  - Admin : Voit "⚙️ Gestion des rôles" dans le menu

## 🔄 **Processus de création d'un utilisateur :**

### 1️⃣ **🔒 SEUL le Secrétaire crée le compte**
1. Se connecter en tant que **Secrétaire**
2. Aller sur **"👤 Créer utilisateurs"** dans le menu
3. Remplir le formulaire :
   - Nom d'utilisateur
   - Nom complet
   - Email
   - **Date de naissance** (obligatoire)
   - **Adresse physique** (obligatoire)
   - Mot de passe temporaire
4. Cliquer "Créer l'utilisateur"
5. Le compte est créé avec le statut "En attente"

### 2️⃣ **🔒 SEUL l'Admin attribue le rôle**
1. Se connecter en tant qu'**Administrateur**
2. Aller sur **"⚙️ Gestion des rôles"** dans le menu
3. Cliquer "Attribuer un rôle" sur l'utilisateur en attente
4. Choisir le rôle (Admin, Secrétariat, Responsable, User)
5. Si Responsable : sélectionner le département
6. Ajouter des notes si nécessaire
7. Confirmer l'attribution

### 3️⃣ **Utilisateur peut se connecter**
- Le compte passe au statut "Actif"
- L'utilisateur peut maintenant se connecter avec ses identifiants

## 🚪 **Comment accéder à la page Utilisateurs :**

### 👤 **Pour le Secrétaire (création de comptes) :**
- Chercher **"👤 Créer utilisateurs"** dans le menu de navigation
- Cliquer dessus pour accéder au formulaire de création
- Vous verrez SEULEMENT le formulaire de création

### ⚙️ **Pour l'Admin (attribution de rôles) :**
- Chercher **"⚙️ Gestion des rôles"** dans le menu de navigation
- Cliquer dessus pour accéder à la gestion des rôles
- Vous verrez SEULEMENT la liste des utilisateurs et l'attribution de rôles

### ❌ **Si vous ne voyez pas le lien :**
- **Secrétaire** : Seul rôle autorisé à créer des comptes
- **Admin** : Seul rôle autorisé à attribuer des rôles
- **Autres rôles** : Aucun accès à cette fonctionnalité

## ⚠️ **Important :**
- **Membres** ≠ **Utilisateurs**
- Les membres sont les personnes de l'église
- Les utilisateurs sont les comptes pour accéder à l'application
- Une personne peut être membre ET utilisateur
