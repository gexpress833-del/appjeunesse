// Module de gestion du stockage d'images avec Supabase Storage
// Remplace le stockage base64 par Supabase Storage

let storageClient = null;

// Initialiser le client de stockage Supabase
function initStorage() {
  const supabaseClient = window.supabaseDB?.getClient();
  if (!supabaseClient) {
    console.error('❌ Client Supabase non initialisé');
    return null;
  }
  
  storageClient = supabaseClient.storage;
  return storageClient;
}

// Obtenir le client de stockage
function getStorageClient() {
  if (!storageClient) {
    return initStorage();
  }
  return storageClient;
}

// ==================== GESTION DES PHOTOS D'ÉVÉNEMENTS ====================

/**
 * Uploader une photo d'événement vers Supabase Storage
 * @param {File} file - Le fichier image à uploader
 * @param {number} eventId - L'ID de l'événement (optionnel, pour mise à jour)
 * @returns {Promise<string>} L'URL publique de l'image
 */
async function uploadEventPhoto(file, eventId = null) {
  const storage = getStorageClient();
  if (!storage) {
    throw new Error('Supabase Storage n\'est pas disponible');
  }

  // Valider le fichier
  const validation = validateImageFile(file);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  // Générer un nom de fichier unique
  const extension = file.name.split('.').pop().toLowerCase();
  const timestamp = Date.now();
  const fileName = eventId 
    ? `event_${eventId}_${timestamp}.${extension}`
    : `event_${timestamp}.${extension}`;

  try {
    // Uploader le fichier
    const { data, error } = await storage
      .from('event-photos')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      throw error;
    }

    // Obtenir l'URL publique
    const { data: urlData } = storage
      .from('event-photos')
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  } catch (error) {
    console.error('Erreur lors de l\'upload de la photo d\'événement:', error);
    throw new Error(`Erreur lors de l'upload: ${error.message}`);
  }
}

/**
 * Supprimer une photo d'événement
 * @param {string} fileName - Le nom du fichier à supprimer
 */
async function deleteEventPhoto(fileName) {
  const storage = getStorageClient();
  if (!storage) {
    throw new Error('Supabase Storage n\'est pas disponible');
  }

  try {
    const { error } = await storage
      .from('event-photos')
      .remove([fileName]);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Erreur lors de la suppression de la photo:', error);
    throw error;
  }
}

/**
 * Extraire le nom de fichier depuis une URL Supabase
 * @param {string} url - L'URL complète de l'image
 * @returns {string} Le nom du fichier
 */
function extractFileNameFromUrl(url) {
  if (!url) return null;
  // Format: https://[project].supabase.co/storage/v1/object/public/event-photos/filename.jpg
  const parts = url.split('/');
  return parts[parts.length - 1];
}

// ==================== GESTION DES PHOTOS DE PROFIL ====================

/**
 * Uploader une photo de profil utilisateur
 * @param {File} file - Le fichier image à uploader
 * @param {string} username - Le nom d'utilisateur
 * @returns {Promise<string>} L'URL publique de l'image
 */
async function uploadUserProfilePhoto(file, username) {
  const storage = getStorageClient();
  if (!storage) {
    throw new Error('Supabase Storage n\'est pas disponible');
  }

  // Valider le fichier
  const validation = validateImageFile(file, { maxSize: 2 * 1024 * 1024 }); // 2MB max
  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  // Supprimer l'ancienne photo si elle existe
  await deleteUserProfilePhoto(username);

  // Générer un nom de fichier unique
  const extension = file.name.split('.').pop().toLowerCase();
  const timestamp = Date.now();
  const cleanUsername = username.replace(/[^a-zA-Z0-9]/g, '_');
  const fileName = `user_${cleanUsername}_${timestamp}.${extension}`;

  try {
    // Uploader le fichier
    const { data, error } = await storage
      .from('user-profiles')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      throw error;
    }

    // Obtenir l'URL publique
    const { data: urlData } = storage
      .from('user-profiles')
      .getPublicUrl(fileName);

    // Mettre à jour l'URL dans la base de données utilisateur
    if (window.supabaseDB && window.supabaseDB.getClient()) {
      try {
        await window.supabaseDB.updateUser(username, {
          profilePhotoUrl: urlData.publicUrl
        });
      } catch (dbError) {
        console.warn('Impossible de mettre à jour l\'URL dans la base de données:', dbError);
      }
    }

    return urlData.publicUrl;
  } catch (error) {
    console.error('Erreur lors de l\'upload de la photo de profil:', error);
    throw new Error(`Erreur lors de l'upload: ${error.message}`);
  }
}

/**
 * Supprimer une photo de profil utilisateur
 * @param {string} username - Le nom d'utilisateur
 */
async function deleteUserProfilePhoto(username) {
  const storage = getStorageClient();
  if (!storage) {
    return; // Pas d'erreur si storage n'est pas disponible
  }

  try {
    // Lister les fichiers de l'utilisateur
    const cleanUsername = username.replace(/[^a-zA-Z0-9]/g, '_');
    const { data: files, error } = await storage
      .from('user-profiles')
      .list('', {
        search: `user_${cleanUsername}_`
      });

    if (error) {
      console.warn('Erreur lors de la liste des fichiers:', error);
      return;
    }

    // Supprimer tous les fichiers de l'utilisateur
    if (files && files.length > 0) {
      const fileNames = files.map(f => f.name);
      await storage
        .from('user-profiles')
        .remove(fileNames);
    }
  } catch (error) {
    console.warn('Erreur lors de la suppression de la photo de profil:', error);
  }
}

/**
 * Obtenir l'URL de la photo de profil d'un utilisateur
 * @param {string} username - Le nom d'utilisateur
 * @returns {Promise<string|null>} L'URL de la photo ou null
 */
async function getUserProfilePhotoUrl(username) {
  if (!window.supabaseDB || !window.supabaseDB.getClient()) {
    return null;
  }

  try {
    const user = await window.supabaseDB.getUserByUsername(username);
    // Le champ dans la base de données est profile_photo_url (snake_case)
    return user?.profile_photo_url || null;
  } catch (error) {
    console.error('Erreur lors de la récupération de la photo de profil:', error);
    return null;
  }
}

// ==================== FONCTIONS UTILITAIRES ====================

/**
 * Valider un fichier image
 * @param {File} file - Le fichier à valider
 * @param {Object} options - Options de validation
 * @returns {Object} { isValid: boolean, error: string }
 */
function validateImageFile(file, options = {}) {
  const maxSize = options.maxSize || 5 * 1024 * 1024; // 5MB par défaut
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp'];

  if (!file) {
    return { isValid: false, error: 'Aucun fichier sélectionné' };
  }

  if (!file.type.startsWith('image/')) {
    return { isValid: false, error: 'Le fichier doit être une image' };
  }

  if (!allowedTypes.includes(file.type)) {
    return { isValid: false, error: 'Format non supporté. Utilisez JPG, PNG ou WebP' };
  }

  const extension = file.name.split('.').pop().toLowerCase();
  if (!allowedExtensions.includes(extension)) {
    return { isValid: false, error: 'Extension non supportée' };
  }

  if (file.size > maxSize) {
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
    return { isValid: false, error: `L'image ne doit pas dépasser ${maxSizeMB} MB` };
  }

  return { isValid: true };
}

/**
 * Compresser une image avant l'upload (optionnel)
 * @param {File} file - Le fichier image
 * @param {number} maxWidth - Largeur maximale
 * @param {number} quality - Qualité de compression (0-1)
 * @returns {Promise<File>} Le fichier compressé
 */
function compressImage(file, maxWidth = 1920, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now()
            });
            resolve(compressedFile);
          },
          file.type,
          quality
        );
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ==================== EXPORT DES FONCTIONS ====================

window.storageManager = {
  // Initialisation
  init: initStorage,
  getClient: getStorageClient,

  // Photos d'événements
  uploadEventPhoto,
  deleteEventPhoto,
  extractFileNameFromUrl,

  // Photos de profil
  uploadUserProfilePhoto,
  deleteUserProfilePhoto,
  getUserProfilePhotoUrl,

  // Utilitaires
  validateImageFile,
  compressImage
};

