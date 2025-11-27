# Guide d'Intégration Supabase

## 📋 Résumé des modifications

L'application a été intégrée avec Supabase pour la persistance des données. Voici ce qui a été fait :

### ✅ Fichiers créés

1. **js/config.js** - Configuration Supabase
2. **js/supabase.js** - Module Supabase avec toutes les fonctions CRUD
3. **supabase/schema.sql** - Schéma de base de données
4. **CONFIG.md** - Guide de configuration
5. **SETUP.md** - Guide d'installation rapide
6. **.gitignore** - Fichiers à ignorer dans Git

### ✅ Fichiers modifiés

1. **login.html** - Intégration Supabase pour l'authentification
2. **js/data.js** - Utilisation de Supabase avec fallback localStorage
3. **js/users.js** - Utilisation de Supabase pour la gestion des utilisateurs
4. **README.md** - Documentation mise à jour

## 🔌 Comment inclure Supabase dans vos pages HTML

Pour utiliser Supabase dans une page HTML, incluez ces scripts dans l'ordre :

```html
<!-- 1. Bibliothèque Supabase (CDN) -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

<!-- 2. Configuration Supabase -->
<script src="js/config.js"></script>

<!-- 3. Module Supabase -->
<script src="js/supabase.js"></script>

<!-- 4. Vos autres scripts -->
<script src="js/data.js"></script>
<script src="js/auth.js"></script>
```

## 📊 Structure de la base de données

### Tables créées

1. **users** - Utilisateurs de l'application
2. **departments** - Départements
3. **members** - Membres de l'équipe
4. **events** - Événements
5. **attendances** - Présences aux événements

### Relations

- `members.dept` → `departments.name` (Foreign Key)
- `attendances.member_id` → `members.id` (Foreign Key)
- `attendances.event_id` → `events.id` (Foreign Key)

## 🔧 Utilisation de l'API Supabase

### Exemple : Récupérer les membres

```javascript
// Avec Supabase
if (window.supabaseDB && window.supabaseDB.getClient()) {
  const members = await window.supabaseDB.getMembers();
  console.log(members);
}

// Fallback localStorage
const members = JSON.parse(localStorage.getItem('members') || '[]');
```

### Exemple : Créer un membre

```javascript
try {
  const newMember = await window.supabaseDB.createMember({
    name: 'John Doe',
    dept: 'DLB',
    role: 'user',
    email: 'john@example.com'
  });
  console.log('Membre créé:', newMember);
} catch (error) {
  console.error('Erreur:', error);
}
```

### Exemple : Mettre à jour un membre

```javascript
try {
  const updated = await window.supabaseDB.updateMember(memberId, {
    name: 'Jane Doe',
    dept: 'Chorale'
  });
  console.log('Membre mis à jour:', updated);
} catch (error) {
  console.error('Erreur:', error);
}
```

## 🔄 Migration des données

### Depuis localStorage vers Supabase

1. Les données existantes dans localStorage restent disponibles
2. Les nouvelles données sont automatiquement sauvegardées dans Supabase
3. Pour migrer manuellement, utilisez la fonction `syncToSupabase()` :

```javascript
// Dans la console du navigateur
await window.syncToSupabase();
```

## 🛡️ Sécurité

### Row Level Security (RLS)

Le schéma SQL inclut des commentaires pour activer RLS. Pour l'activer :

1. Dans Supabase, allez dans **Authentication** > **Policies**
2. Activez RLS pour chaque table
3. Créez des politiques selon vos besoins

### Mots de passe

⚠️ **Important** : Les mots de passe sont stockés en clair dans la base de données pour la démo. En production :

1. Utilisez l'authentification Supabase native
2. Ou hash les mots de passe avec bcrypt avant de les stocker

## 🐛 Dépannage

### L'application ne se connecte pas à Supabase

1. Vérifiez `js/config.js` - les clés sont-elles correctes ?
2. Vérifiez la console du navigateur - y a-t-il des erreurs ?
3. Vérifiez que le schéma SQL a été exécuté dans Supabase

### Les données ne se synchronisent pas

1. Vérifiez votre connexion internet
2. Vérifiez les permissions dans Supabase
3. Consultez la console pour les erreurs détaillées

### Mode fallback activé

Si vous voyez `ℹ️ Mode localStorage activé` dans la console :
- Supabase n'est pas configuré ou il y a une erreur
- L'application fonctionne toujours avec localStorage
- Configurez Supabase pour activer le mode cloud

## 📚 Ressources

- [Documentation Supabase](https://supabase.com/docs)
- [Guide JavaScript Supabase](https://supabase.com/docs/reference/javascript/introduction)
- [Schéma SQL](supabase/schema.sql)

---

**Note** : L'application fonctionne avec ou sans Supabase. Si Supabase n'est pas configuré, elle utilise automatiquement localStorage.

