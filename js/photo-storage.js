// Système de gestion des photos en dossier local
// Migration du stockage Base64 vers fichiers locaux

class PhotoStorageManager {
  constructor() {
    this.basePath = 'images/profiles/';
    this.allowedExtensions = ['jpg', 'jpeg', 'png', 'webp'];
    this.maxFileSize = 2 * 1024 * 1024; // 2MB
    this.maxDimensions = { width: 400, height: 400 };
  }

  // Générer un nom de fichier unique
  generateFileName(username, extension) {
    const timestamp = Date.now();
    const cleanUsername = username.replace(/[^a-zA-Z0-9]/g, '_');
    return `user_${cleanUsername}_${timestamp}.${extension}`;
  }

  // Valider un fichier image
  validateFile(file) {
    const errors = [];
    
    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      errors.push('Le fichier doit être une image');
    }
    
    // Vérifier l'extension
    const extension = file.name.split('.').pop().toLowerCase();
    if (!this.allowedExtensions.includes(extension)) {
      errors.push(`Extensions autorisées: ${this.allowedExtensions.join(', ')}`);
    }
    
    // Vérifier la taille
    if (file.size > this.maxFileSize) {
      errors.push(`Taille maximum: ${this.formatBytes(this.maxFileSize)}`);
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors,
      extension: extension
    };
  }

  // Formater la taille en bytes
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Traiter l'upload d'une photo
  async processPhotoUpload(file, username, type = 'users') {
    const validation = this.validateFile(file);
    
    if (!validation.isValid) {
      throw new Error(validation.errors.join(', '));
    }

    const fileName = this.generateFileName(username, validation.extension);
    const relativePath = `${this.basePath}${type}/${fileName}`;
    
    // Créer un aperçu de l'image pour validation
    const preview = await this.createImagePreview(file);
    
    return {
      fileName: fileName,
      relativePath: relativePath,
      fullPath: `C:/APPJEUNE-KZI/${relativePath}`,
      preview: preview,
      size: file.size,
      type: file.type
    };
  }

  // Créer un aperçu de l'image
  createImagePreview(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // Sauvegarder les métadonnées de la photo
  savePhotoMetadata(username, photoData) {
    const profiles = JSON.parse(localStorage.getItem('userProfiles') || '{}');
    
    if (!profiles[username]) {
      profiles[username] = {};
    }
    
    // Supprimer l'ancienne photo Base64 si elle existe
    if (profiles[username].photo) {
      delete profiles[username].photo;
    }
    
    // Sauvegarder les nouvelles métadonnées
    profiles[username].photoPath = photoData.relativePath;
    profiles[username].photoFileName = photoData.fileName;
    profiles[username].photoSize = photoData.size;
    profiles[username].photoType = photoData.type;
    profiles[username].photoUpdatedAt = new Date().toISOString();
    
    localStorage.setItem('userProfiles', JSON.stringify(profiles));
    
    return profiles[username];
  }

  // Charger une photo de profil
  loadProfilePhoto(username) {
    const profiles = JSON.parse(localStorage.getItem('userProfiles') || '{}');
    const userProfile = profiles[username] || {};
    
    if (userProfile.photoPath) {
      return {
        type: 'file',
        path: userProfile.photoPath,
        metadata: {
          fileName: userProfile.photoFileName,
          size: userProfile.photoSize,
          type: userProfile.photoType,
          updatedAt: userProfile.photoUpdatedAt
        }
      };
    } else if (userProfile.photo) {
      // Ancienne méthode Base64 (pour compatibilité)
      return {
        type: 'base64',
        data: userProfile.photo
      };
    } else {
      return {
        type: 'initials',
        initials: this.getInitials(username)
      };
    }
  }

  // Générer les initiales
  getInitials(name) {
    if (!name || typeof name !== 'string') return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  }

  // Vérifier si un fichier existe
  async checkFileExists(filePath) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = filePath;
    });
  }

  // Nettoyer les fichiers orphelins
  async cleanupOrphanFiles() {
    const profiles = JSON.parse(localStorage.getItem('userProfiles') || '{}');
    const usedFiles = [];
    
    // Collecter tous les fichiers utilisés
    Object.values(profiles).forEach(profile => {
      if (profile.photoPath) {
        usedFiles.push(profile.photoPath);
      }
    });
    
    // Note: En environnement web, nous ne pouvons pas lister les fichiers du système
    // Cette fonction serait plus utile dans un environnement serveur
    console.log('Fichiers utilisés:', usedFiles);
    
    return {
      usedFiles: usedFiles,
      message: 'Nettoyage manuel requis - vérifiez les fichiers dans images/profiles/'
    };
  }

  // Migrer depuis Base64 vers fichiers
  migrateFromBase64() {
    const profiles = JSON.parse(localStorage.getItem('userProfiles') || '{}');
    const migrations = [];
    
    Object.entries(profiles).forEach(([username, profile]) => {
      if (profile.photo && profile.photo.startsWith('data:image/')) {
        // Créer les instructions de migration
        const extension = profile.photo.includes('jpeg') ? 'jpg' : 'png';
        const fileName = this.generateFileName(username, extension);
        const relativePath = `${this.basePath}users/${fileName}`;
        
        migrations.push({
          username: username,
          oldData: profile.photo,
          newPath: relativePath,
          fileName: fileName,
          instructions: `Sauvegarder l'image Base64 comme fichier: ${relativePath}`
        });
      }
    });
    
    return migrations;
  }

  // Générer un rapport de stockage
  generateStorageReport() {
    const profiles = JSON.parse(localStorage.getItem('userProfiles') || '{}');
    let base64Count = 0;
    let fileCount = 0;
    let totalBase64Size = 0;
    
    Object.values(profiles).forEach(profile => {
      if (profile.photo && profile.photo.startsWith('data:image/')) {
        base64Count++;
        totalBase64Size += profile.photo.length;
      } else if (profile.photoPath) {
        fileCount++;
      }
    });
    
    return {
      totalProfiles: Object.keys(profiles).length,
      base64Photos: base64Count,
      filePhotos: fileCount,
      base64Size: totalBase64Size,
      base64SizeFormatted: this.formatBytes(totalBase64Size),
      migrationNeeded: base64Count > 0
    };
  }
}

// Instance globale
window.photoStorage = new PhotoStorageManager();

// Fonctions utilitaires pour compatibilité
window.updateProfilePhotoFromFile = function(username) {
  const photoData = window.photoStorage.loadProfilePhoto(username);
  const profilePhoto = document.getElementById('profilePhoto') || document.getElementById('headerProfilePhoto');
  
  if (!profilePhoto) return;
  
  switch (photoData.type) {
    case 'file':
      profilePhoto.innerHTML = `<img src="${photoData.path}" alt="Photo de profil" onerror="this.parentElement.innerHTML='<span>${photoData.initials || 'U'}</span>'">`;
      break;
    case 'base64':
      profilePhoto.innerHTML = `<img src="${photoData.data}" alt="Photo de profil">`;
      break;
    case 'initials':
    default:
      profilePhoto.innerHTML = `<span>${photoData.initials}</span>`;
      break;
  }
};

// Export pour utilisation dans d'autres modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PhotoStorageManager;
}
