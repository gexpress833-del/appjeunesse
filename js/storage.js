// ============================================================================
// STORAGE - Gestion du stockage d'images avec Cloudinary
// ============================================================================
// Ce module gère l'upload et la suppression d'images via Cloudinary.
// L'implémentation actuelle est un placeholder pour les Supabase Edge Functions.
// ============================================================================
// À FAIRE: Implémenter les Edge Functions Supabase pour:
// - /functions/cloudinary-upload - Upload d'images
// - /functions/cloudinary-delete - Suppression d'images
// ============================================================================

// Configuration Cloudinary depuis APP_CONFIG
function getCloudinaryConfig() {
  return {
    cloudName: window.APP_CONFIG?.cloudinaryCloudName || null,
    uploadPreset: window.APP_CONFIG?.cloudinaryUploadPreset || null
  };
}

// ==================== GESTION DES PHOTOS D'ÉVÉNEMENTS ====================

/**
 * Uploader une photo d'événement vers Cloudinary (via Supabase Edge Function)
 * @param {File} file - Le fichier image à uploader
 * @param {number} eventId - L'ID de l'événement (optionnel)
 * @returns {Promise<{url: string, publicId: string}>} L'URL publique et le public_id de l'image
 */
async function uploadEventPhoto(file, eventId = null) {
  const validation = validateImageFile(file);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  const config = getCloudinaryConfig();
  if (!config.cloudName || !config.uploadPreset) {
    throw new Error('Cloudinary n\'est pas configuré. Configurez-le via supabase-config.html');
  }

  // TODO: Remplacer par appel à Supabase Edge Function
  // const { data, error } = await window.supabase.functions.invoke('cloudinary-upload', {
  //   body: { file, folder: 'events', eventId }
  // });

  // Placeholder: Upload direct via Cloudinary API (non sécurisé pour production)
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', config.uploadPreset);
    formData.append('folder', 'events');
    if (eventId) formData.append('tags', `event_${eventId}`);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData
      }
    );

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || 'Erreur lors de l\'upload');
    }

    return {
      url: data.secure_url,
      publicId: data.public_id
    };
  } catch (error) {
    console.error('Erreur uploadEventPhoto:', error);
    throw new Error('Erreur lors de l\'upload de l\'image');
  }
}

/**
 * Supprimer une photo d'événement
 * @param {string} publicId - Le public_id Cloudinary de l'image
 */
async function deleteEventPhoto(publicId) {
  if (!publicId) {
    console.warn('deleteEventPhoto: publicId manquant');
    return;
  }

  // TODO: Remplacer par appel à Supabase Edge Function
  // const { error } = await window.supabase.functions.invoke('cloudinary-delete', {
  //   body: { publicId }
  // });

  // Placeholder: Log de l'action (la suppression nécessite une signature côté serveur)
  console.log(`Suppression de l'image Cloudinary: ${publicId} (nécessite Edge Function)`);
}

// ==================== GESTION DES PHOTOS DE PROFIL ====================

/**
 * Uploader une photo de profil utilisateur
 * @param {File} file - Le fichier image à uploader
 * @param {string} username - Le nom d'utilisateur
 * @returns {Promise<{url: string, publicId: string}>} L'URL publique et le public_id
 */
async function uploadUserProfilePhoto(file, username) {
  const validation = validateImageFile(file, { maxSize: 2 * 1024 * 1024 });
  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  const config = getCloudinaryConfig();
  if (!config.cloudName || !config.uploadPreset) {
    throw new Error('Cloudinary n\'est pas configuré');
  }

  // TODO: Remplacer par appel à Supabase Edge Function
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', config.uploadPreset);
    formData.append('folder', 'profiles');
    formData.append('public_id', `profile_${username}`);
    formData.append('overwrite', 'true');

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData
      }
    );

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || 'Erreur lors de l\'upload');
    }

    return {
      url: data.secure_url,
      publicId: data.public_id
    };
  } catch (error) {
    console.error('Erreur uploadUserProfilePhoto:', error);
    throw new Error('Erreur lors de l\'upload de la photo de profil');
  }
}

/**
 * Supprimer une photo de profil
 * @param {string} publicId - Le public_id Cloudinary
 */
async function deleteUserProfilePhoto(publicId) {
  if (!publicId) return;

  // TODO: Remplacer par appel à Supabase Edge Function
  console.log(`Suppression de la photo de profil: ${publicId} (nécessite Edge Function)`);
}

/**
 * Obtenir l'URL de la photo de profil depuis Supabase
 * @param {string} username - Le nom d'utilisateur
 * @returns {Promise<string|null>} L'URL de la photo ou null
 */
async function getUserProfilePhotoUrl(username) {
  if (!window.supabaseDB || !window.supabaseDB.getClient()) {
    return null;
  }
  try {
    const profile = await window.supabaseDB.getProfileByUsername(username);
    return profile?.profile_photo_url || null;
  } catch (error) {
    console.error('Erreur getUserProfilePhotoUrl:', error);
    return null;
  }
}

// ==================== FONCTIONS UTILITAIRES ====================

function validateImageFile(file, options = {}) {
  const maxSize = options.maxSize || 5 * 1024 * 1024;
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

// ==================== EXPORT ====================

window.storageManager = {
  uploadEventPhoto,
  deleteEventPhoto,
  uploadUserProfilePhoto,
  deleteUserProfilePhoto,
  getUserProfilePhotoUrl,
  validateImageFile,
  compressImage
};
