# Guide de Test - AppJeune-KZI

## 🧪 Tests d'Authentification

### Prérequis

1. Configurez Supabase via `supabase-config.html`
2. Exécutez le schéma SQL dans Supabase SQL Editor
3. Créez un premier utilisateur admin manuellement

### Test 1: Inscription d'un nouvel utilisateur

1. Ouvrez `register.html`
2. Remplissez le formulaire :
   - Prénom: Test
   - Nom: User
   - Email: test@example.com
   - Nom d'utilisateur: testuser
   - Département: Chorale
   - Mot de passe: Test1234!
   - Confirmer: Test1234!
   - Cochez "J'accepte les conditions"
3. Cliquez sur "Créer mon compte"
4. **Résultat attendu**: Message de succès, redirection vers login

**Vérification dans Supabase**:
- Allez dans Authentication > Users
- Vérifiez que l'utilisateur existe
- Allez dans Table Editor > profiles
- Vérifiez que le profil existe avec username=testuser

### Test 2: Connexion réussie

1. Ouvrez `login.html`
2. Entrez l'email: test@example.com
3. Entrez le mot de passe: Test1234!
4. Cliquez sur "Se connecter"
5. **Résultat attendu**: 
   - Message "Connexion réussie !"
   - Redirection vers user.html (car pas de rôle assigné)

### Test 3: Connexion avec mauvais mot de passe

1. Ouvrez `login.html`
2. Entrez l'email: test@example.com
3. Entrez un mauvais mot de passe
4. Cliquez sur "Se connecter"
5. **Résultat attendu**: Message d'erreur "Email ou mot de passe incorrect"

### Test 4: Déconnexion

1. Connectez-vous avec un compte
2. Dans n'importe quelle page, cliquez sur "Déconnexion"
3. **Résultat attendu**: Redirection vers login.html

### Test 5: Session persistante

1. Connectez-vous
2. Fermez le navigateur
3. Rouvrez et allez sur `login.html`
4. **Résultat attendu**: Redirection automatique vers la page du rôle

## 🔐 Tests Row Level Security (RLS)

### Prérequis

1. Avoir au moins 4 utilisateurs avec des rôles différents :
   - admin
   - secretariat
   - responsable
   - user

2. Assigner des départements aux responsables et users

### Test 1: Admin - Accès complet

1. Connectez-vous en tant qu'admin
2. **Vérifications**:
   - ✅ Peut voir tous les membres
   - ✅ Peut créer/modifier/supprimer des membres
   - ✅ Peut créer/modifier/supprimer des départements
   - ✅ Peut attribuer des rôles
   - ✅ Peut voir tous les événements
   - ✅ Peut créer/modifier/supprimer des événements
   - ✅ Peut voir toutes les présences
   - ✅ Peut modifier toutes les présences

### Test 2: Secrétariat - Gestion des données

1. Connectez-vous en tant que secretariat
2. **Vérifications**:
   - ✅ Peut voir tous les membres
   - ✅ Peut créer/modifier/supprimer des membres
   - ❌ Ne peut PAS créer/modifier/supprimer des départements
   - ❌ Ne peut PAS attribuer des rôles
   - ✅ Peut créer des comptes utilisateurs
   - ✅ Peut voir tous les événements
   - ✅ Peut créer/modifier/supprimer des événements
   - ✅ Peut voir toutes les présences
   - ✅ Peut modifier toutes les présences

### Test 3: Responsable - Accès départemental

1. Connectez-vous en tant que responsable (avec département assigné, ex: Chorale)
2. **Vérifications**:
   - ✅ Peut voir SEULEMENT les membres de son département
   - ✅ Peut créer/modifier/supprimer des membres de son département
   - ❌ Ne peut PAS voir les membres d'autres départements
   - ❌ Ne peut PAS créer/modifier/supprimer des membres d'autres départements
   - ✅ Peut voir tous les événements
   - ❌ Ne peut PAS créer/modifier/supprimer des événements
   - ✅ Peut voir les présences de son département
   - ✅ Peut modifier les présences de son département
   - ❌ Ne peut PAS modifier les présences d'autres départements

### Test 4: User - Accès lecture seule

1. Connectez-vous en tant que user (avec département assigné)
2. **Vérifications**:
   - ✅ Peut voir SEULEMENT les membres de son département
   - ❌ Ne peut PAS créer/modifier/supprimer des membres
   - ✅ Peut voir tous les événements
   - ❌ Ne peut PAS créer/modifier/supprimer des événements
   - ✅ Peut voir les présences de son département
   - ❌ Ne peut PAS modifier les présences

## 🐛 Dépannage

### Erreur: "Supabase n'est pas configuré"

**Solution**: Ouvrez `supabase-config.html` et entrez vos clés Supabase

### Erreur: "Profil utilisateur non trouvé"

**Cause**: L'utilisateur existe dans auth.users mais pas dans profiles

**Solution**: Exécutez ce SQL dans Supabase SQL Editor :
```sql
INSERT INTO public.profiles (id, username, full_name, role, status)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'votre@email.com'),
  'username',
  'Nom Complet',
  'user',
  'active'
);
```

### Erreur: "Aucun rôle attribué"

**Solution**: L'admin doit assigner un rôle via la gestion des utilisateurs

### RLS bloque les opérations

**Vérification**:
1. Allez dans Supabase > Authentication > Policies
2. Vérifiez que RLS est activé sur toutes les tables
3. Vérifiez que les politiques sont correctes

## 📊 Checklist de Test

- [ ] Inscription fonctionne
- [ ] Connexion fonctionne
- [ ] Déconnexion fonctionne
- [ ] Session persistante
- [ ] Admin peut tout faire
- [ ] Secrétariat peut gérer les données mais pas les rôles
- [ ] Responsable limité à son département
- [ ] User limité à lecture seule
- [ ] Les permissions sont appliquées côté serveur (RLS)

## 🔍 Vérification Console

Ouvrez la console du navigateur (F12) et vérifiez :

- Pas d'erreurs JavaScript
- Les appels Supabase réussissent (status 200)
- Les données sont correctement récupérées
- Les permissions sont respectées
