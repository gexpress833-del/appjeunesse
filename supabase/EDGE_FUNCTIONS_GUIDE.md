# Guide d'Implémentation des Supabase Edge Functions pour Cloudinary

## 📋 Vue d'ensemble

Ce guide explique comment implémenter les Edge Functions Supabase pour gérer l'upload et la suppression d'images via Cloudinary de manière sécurisée.

## 🔧 Prérequis

- Supabase CLI installé (`npm install -g supabase`)
- Compte Cloudinary avec API Key et API Secret
- Projet Supabase lié localement

## 📁 Structure des Edge Functions

```
supabase/
├── functions/
│   ├── cloudinary-upload/
│   │   └── index.ts
│   └── cloudinary-delete/
│       └── index.ts
```

## 🔐 Configuration des Secrets Cloudinary

Dans votre projet Supabase (dashboard ou CLI), ajoutez ces secrets :

```bash
supabase secrets set CLOUDINARY_API_KEY=votre_api_key
supabase secrets set CLOUDINARY_API_SECRET=votre_api_secret
supabase secrets set CLOUDINARY_CLOUD_NAME=votre_cloud_name
```

## 📝 Edge Function: cloudinary-upload

Créez `supabase/functions/cloudinary-upload/index.ts` :

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const CLOUDINARY_API_KEY = Deno.env.get('CLOUDINARY_API_KEY')!
const CLOUDINARY_API_SECRET = Deno.env.get('CLOUDINARY_API_SECRET')!
const CLOUDINARY_CLOUD_NAME = Deno.env.get('CLOUDINARY_CLOUD_NAME')!

serve(async (req) => {
  try {
    const { file, folder, eventId } = await req.json()

    if (!file) {
      return new Response(JSON.stringify({ error: 'Fichier manquant' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Upload vers Cloudinary
    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', 'unsigned') // Ou utiliser signed upload
    formData.append('folder', folder || 'events')
    if (eventId) formData.append('tags', `event_${eventId}`)

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData
      }
    )

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error?.message || 'Upload failed')
    }

    return new Response(JSON.stringify({
      url: data.secure_url,
      publicId: data.public_id
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})
```

## 📝 Edge Function: cloudinary-delete

Créez `supabase/functions/cloudinary-delete/index.ts` :

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const CLOUDINARY_API_KEY = Deno.env.get('CLOUDINARY_API_KEY')!
const CLOUDINARY_API_SECRET = Deno.env.get('CLOUDINARY_API_SECRET')!
const CLOUDINARY_CLOUD_NAME = Deno.env.get('CLOUDINARY_CLOUD_NAME')!

serve(async (req) => {
  try {
    const { publicId } = await req.json()

    if (!publicId) {
      return new Response(JSON.stringify({ error: 'publicId manquant' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Génération de la signature pour suppression sécurisée
    const timestamp = Math.floor(Date.now() / 1000)
    const signatureString = `public_id=${publicId}&timestamp=${timestamp}${CLOUDINARY_API_SECRET}`
    
    // Pour la production, utilisez crypto.subtle pour hasher avec SHA-1
    // Ici, une version simplifiée
    
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/destroy`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${btoa(`${CLOUDINARY_API_KEY}:${CLOUDINARY_API_SECRET}`)}`
        },
        body: JSON.stringify({
          public_id: publicId,
          timestamp,
          signature: 'generated_signature' // À implémenter correctement
        })
      }
    )

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error?.message || 'Delete failed')
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})
```

## 🚀 Déploiement des Edge Functions

```bash
# Lier le projet local au projet Supabase
supabase link --project-ref votre-projet-ref

# Déployer toutes les fonctions
supabase functions deploy

# Déployer une fonction spécifique
supabase functions deploy cloudinary-upload
supabase functions deploy cloudinary-delete
```

## 🔧 Mise à jour de js/storage.js

Une fois les Edge Functions déployées, remplacez les placeholders dans `js/storage.js` :

```javascript
// Dans uploadEventPhoto
const { data, error } = await window.supabase.functions.invoke('cloudinary-upload', {
  body: { file, folder: 'events', eventId }
});

// Dans deleteEventPhoto
const { error } = await window.supabase.functions.invoke('cloudinary-delete', {
  body: { publicId }
});
```

## ⚠️ Notes de Sécurité

1. **Jamais** exposer `CLOUDINARY_API_SECRET` dans le frontend
2. Utiliser des signatures pour les uploads signed en production
3. Valider les types et tailles de fichiers côté serveur
4. Limiter les permissions des Edge Functions

## 📚 Ressources

- [Supabase Edge Functions Documentation](https://supabase.com/docs/guides/functions)
- [Cloudinary API Documentation](https://cloudinary.com/documentation)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli)
