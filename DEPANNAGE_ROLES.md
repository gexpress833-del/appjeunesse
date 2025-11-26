# 🔧 Dépannage des Rôles Utilisateurs

## 🚨 **Problème identifié :**
Le compte "secretariat" se connecte avec le rôle "admin" au lieu du rôle "secretariat".

## 🔍 **Cause probable :**
Les données utilisateurs dans le `localStorage` du navigateur contiennent des informations incorrectes ou obsolètes.

## ✅ **Solutions :**

### **Solution 1 : Réinitialisation automatique (RECOMMANDÉE)**
1. Ouvrir le fichier : `C:/APPJEUNE-KZI/reset-users.html`
2. Vérifier les utilisateurs actuels affichés
3. Cliquer sur "🔄 Réinitialiser les utilisateurs"
4. Confirmer l'opération
5. Retourner à la page de connexion
6. Se connecter avec les identifiants corrects

### **Solution 2 : Nettoyage manuel du navigateur**
1. Ouvrir la console du navigateur (F12)
2. Aller dans l'onglet "Application" ou "Storage"
3. Trouver "Local Storage" → votre domaine
4. Supprimer les clés suivantes :
   - `appUsers`
   - `appRole`
   - `appUser`
   - `appUserName`
   - `appLoginTime`
   - `appDept`
   - `userProfiles`
5. Actualiser la page de connexion
6. Les utilisateurs par défaut seront recréés

### **Solution 3 : Vérification via console**
1. Ouvrir la console (F12)
2. Taper : `console.log(JSON.parse(localStorage.getItem('appUsers')))`
3. Vérifier que le compte "secretariat" a bien `role: "secretariat"`
4. Si ce n'est pas le cas, utiliser la Solution 1

## 👥 **Identifiants corrects après réinitialisation :**

| Utilisateur | Mot de passe | Rôle | Nom |
|-------------|--------------|------|-----|
| `admin` | `admin123` | `admin` | Jean-Baptiste Mukendi |
| `secretariat` | `secret123` | `secretariat` | Marie Kabongo |
| `responsable` | `resp123` | `responsable` | Paul Mwanza |
| `user` | `user123` | `user` | Grace Kasongo |

## 🔍 **Vérification après correction :**

### **Test du compte secrétariat :**
1. Se connecter avec : `secretariat` / `secret123`
2. Vérifier que vous arrivez sur la page du secrétariat
3. Vérifier que le menu contient "👤 Créer utilisateurs"
4. Vérifier que vous pouvez accéder au formulaire de création

### **Test du compte admin :**
1. Se connecter avec : `admin` / `admin123`
2. Vérifier que vous arrivez sur la page d'administration
3. Vérifier que le menu contient "⚙️ Gestion des rôles"
4. Vérifier que vous pouvez attribuer des rôles mais pas créer de comptes

## 🚨 **Si le problème persiste :**

1. **Vider complètement le cache du navigateur**
2. **Utiliser un mode navigation privée** pour tester
3. **Vérifier dans la console** s'il y a des erreurs JavaScript
4. **Tester avec un autre navigateur**

## 📞 **Debug avancé :**

Si vous voulez voir ce qui se passe en détail :
1. Ouvrir la console (F12) avant de vous connecter
2. Se connecter avec le compte "secretariat"
3. Regarder les messages de debug qui s'affichent :
   - "Utilisateur trouvé: ..." 
   - "Données de session stockées: ..."
4. Vérifier que `appRole` est bien "secretariat"

---

**La solution la plus simple et efficace est d'utiliser `reset-users.html` !** 🎯
