# ✅ Checklist de Déploiement - AppJeune avec Supabase

Utilisez cette checklist pour vous assurer que tout est prêt avant d'exécuter le SQL dans Supabase.

## 📋 Avant d'exécuter le SQL

### Fichiers à vérifier

- [ ] `js/config.js` existe et contient les placeholders pour les clés Supabase
- [ ] `js/supabase.js` existe et est complet
- [ ] `js/storage.js` existe et est complet
- [ ] `js/data.js` utilise uniquement Supabase (pas de fallback localStorage)
- [ ] `supabase/schema.sql` est complet et à jour
- [ ] `supabase/storage-policies.sql` existe

### Modifications de code vérifiées

- [ ] `js/events.js` utilise Supabase Storage pour les photos
- [ ] `profile.html` utilise Supabase Storage pour les photos de profil
- [ ] `js/members.js` charge les photos depuis Supabase
- [ ] `js/users.js` utilise uniquement Supabase
- [ ] `login.html` utilise uniquement Supabase
- [ ] Tous les fichiers HTML incluent les scripts Supabase

### Fichiers HTML avec scripts Supabase

- [ ] `login.html` ✅
- [ ] `admin.html` ✅
- [ ] `secretariat.html` ✅
- [ ] `responsable.html` ✅
- [ ] `user.html` ✅
- [ ] `events.html` ✅
- [ ] `members.html` ✅
- [ ] `attendances.html` ✅
- [ ] `users.html` ✅
- [ ] `departments.html` ✅
- [ ] `profile.html` ✅

## 🗄️ Configuration Supabase

### Projet créé

- [ ] Projet Supabase créé
- [ ] Mot de passe de la base de données sauvegardé
- [ ] Project URL copiée
- [ ] anon key copiée

### Schéma SQL prêt

- [ ] `supabase/schema.sql` vérifié
- [ ] Toutes les tables sont définies
- [ ] Les utilisateurs par défaut sont inclus
- [ ] Les départements par défaut sont inclus
- [ ] Les triggers sont définis
- [ ] Les index sont créés

### Storage prêt

- [ ] Bucket `event-photos` sera créé (public)
- [ ] Bucket `user-profiles` sera créé (public)
- [ ] `supabase/storage-policies.sql` est prêt

## ⚙️ Configuration Application

### Clés Supabase

- [ ] `js/config.js` est prêt à recevoir les clés
- [ ] Les instructions pour configurer les clés sont claires

### Documentation

- [ ] `DEPLOIEMENT_COMPLET.md` créé
- [ ] `GUIDE_STOCKAGE_IMAGES.md` créé
- [ ] `SETUP.md` créé
- [ ] `README.md` mis à jour

## 🚀 Prêt pour le déploiement

Une fois cette checklist complétée, vous pouvez :

1. ✅ Exécuter `supabase/schema.sql` dans Supabase
2. ✅ Créer les buckets de stockage
3. ✅ Exécuter `supabase/storage-policies.sql`
4. ✅ Configurer `js/config.js` avec vos clés
5. ✅ Tester l'application localement
6. ✅ Déployer sur GitHub

---

**Date de vérification** : _______________
**Vérifié par** : _______________

