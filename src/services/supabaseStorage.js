// Supabase Storage Client for THE HORI CLICK
// Direct upload to Supabase Bucket 'postnew' for ultra-fast CDN delivery

const SUPABASE_URL = 'https://mmltqgekvpdnezqdavvc.supabase.co';
const SUPABASE_SERVICE_ROLE = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1tbHRxZ2VrdnBkbmV6cWRhdnZjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzkzMDY3NywiZXhwIjoyMTAzNTA2Njc3fQ.q_cgtmcVGrBeD8eCuov4xHzl4Lahy5bJIAlsZ8Y_ZUo';
const BUCKET_NAME = 'postnew';

export const supabaseStorage = {
  /**
   * Upload an image file/blob to Supabase Storage bucket 'postnew'
   * @param {File|Blob} file 
   * @param {string} customName 
   * @returns {Promise<{ url: string, key: string }>}
   */
  async uploadImage(file, customName = '') {
    try {
      const ext = file.name ? file.name.split('.').pop() : 'webp';
      const cleanName = customName || `img_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
      const filePath = `uploads/${cleanName}`;
      const uploadEndpoint = `${SUPABASE_URL}/storage/v1/object/${BUCKET_NAME}/${filePath}`;

      const response = await fetch(uploadEndpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE}`,
          'apikey': SUPABASE_SERVICE_ROLE,
          'Content-Type': file.type || 'image/webp',
          'x-upsert': 'true'
        },
        body: file
      });

      if (!response.ok) {
        const errText = await response.text();
        console.warn('Supabase upload response not ok:', errText);
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${filePath}`;
      return {
        url: publicUrl,
        key: `${BUCKET_NAME}/${filePath}`
      };
    } catch (error) {
      console.error('Supabase Storage Upload Error:', error);
      throw error;
    }
  },

  /**
   * Save Post metadata JSON to Supabase CDN for resilient Open Graph SSR
   * @param {Object} post 
   */
  async savePostMetadata(post) {
    if (!post || !post.slug) return null;
    try {
      const cleanSlug = post.slug.toLowerCase().trim().replace(/[^a-z0-9-]/g, '-');
      const filePath = `posts/${cleanSlug}.json`;
      const uploadEndpoint = `${SUPABASE_URL}/storage/v1/object/${BUCKET_NAME}/${filePath}`;

      const jsonBlob = new Blob([JSON.stringify(post, null, 2)], { type: 'application/json' });
      await fetch(uploadEndpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE}`,
          'apikey': SUPABASE_SERVICE_ROLE,
          'Content-Type': 'application/json',
          'x-upsert': 'true'
        },
        body: jsonBlob
      });

      // Update posts_manifest.json
      try {
        let manifest = [];
        const manRes = await fetch(`${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/posts_manifest.json`);
        if (manRes.ok) {
          const parsed = await manRes.json();
          if (Array.isArray(parsed)) manifest = parsed;
        }
        const updatedManifest = [post, ...manifest.filter(p => p.id !== post.id && p.slug !== post.slug)];
        const manBlob = new Blob([JSON.stringify(updatedManifest, null, 2)], { type: 'application/json' });
        await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET_NAME}/posts_manifest.json`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE}`,
            'apikey': SUPABASE_SERVICE_ROLE,
            'Content-Type': 'application/json',
            'x-upsert': 'true'
          },
          body: manBlob
        });
      } catch (me) {}

      return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${filePath}`;
    } catch (e) {
      console.warn('Could not sync post metadata to Supabase:', e);
      return null;
    }
  },

  /**
   * Delete post metadata and remove from posts_manifest.json on Supabase
   * @param {string} id 
   * @param {string} slug 
   */
  async deletePostMetadata(id, slug = '') {
    try {
      // 1. Update posts_manifest.json
      let manifest = [];
      try {
        const manRes = await fetch(`${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/posts_manifest.json`);
        if (manRes.ok) {
          const parsed = await manRes.json();
          if (Array.isArray(parsed)) manifest = parsed;
        }
      } catch (e) {}

      const updatedManifest = manifest.filter(p => p.id !== id && (!slug || p.slug !== slug));
      const manBlob = new Blob([JSON.stringify(updatedManifest, null, 2)], { type: 'application/json' });
      await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET_NAME}/posts_manifest.json`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE}`,
          'apikey': SUPABASE_SERVICE_ROLE,
          'Content-Type': 'application/json',
          'x-upsert': 'true'
        },
        body: manBlob
      });

      // 2. Delete individual post JSON if slug is present
      if (slug) {
        const cleanSlug = slug.toLowerCase().trim().replace(/[^a-z0-9-]/g, '-');
        await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET_NAME}/posts/${cleanSlug}.json`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE}`,
            'apikey': SUPABASE_SERVICE_ROLE
          }
        });
      }
    } catch (err) {
      console.warn('Failed to delete post from Supabase manifest:', err);
    }
  },

  /**
   * Save and sync Staff list to Supabase Cloud Storage
   * @param {Array} staffList 
   */
  async saveStaffManifest(staffList) {
    if (!Array.isArray(staffList)) return;
    try {
      const blob = new Blob([JSON.stringify(staffList, null, 2)], { type: 'application/json' });
      await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET_NAME}/staff_manifest.json`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE}`,
          'apikey': SUPABASE_SERVICE_ROLE,
          'Content-Type': 'application/json',
          'x-upsert': 'true'
        },
        body: blob
      });
    } catch (err) {
      console.warn('Failed to save staff manifest to Supabase:', err);
    }
  },

  /**
   * Save and sync Categories list to Supabase Cloud Storage
   * @param {Array} categories 
   */
  async saveCategoriesManifest(categories) {
    if (!Array.isArray(categories)) return;
    try {
      const blob = new Blob([JSON.stringify(categories, null, 2)], { type: 'application/json' });
      await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET_NAME}/categories_manifest.json`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE}`,
          'apikey': SUPABASE_SERVICE_ROLE,
          'Content-Type': 'application/json',
          'x-upsert': 'true'
        },
        body: blob
      });
    } catch (err) {
      console.warn('Failed to save categories manifest to Supabase:', err);
    }
  },

  /**
   * Save and sync Authors list to Supabase Cloud Storage
   * @param {Array} authors 
   */
  async saveAuthorsManifest(authors) {
    if (!Array.isArray(authors)) return;
    try {
      const blob = new Blob([JSON.stringify(authors, null, 2)], { type: 'application/json' });
      await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET_NAME}/authors_manifest.json`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE}`,
          'apikey': SUPABASE_SERVICE_ROLE,
          'Content-Type': 'application/json',
          'x-upsert': 'true'
        },
        body: blob
      });
    } catch (err) {
      console.warn('Failed to save authors manifest to Supabase:', err);
    }
  },

  /**
   * Save and sync Settings to Supabase Cloud Storage
   * @param {Object} settings 
   */
  async saveSettingsManifest(settings) {
    if (!settings) return;
    try {
      const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
      await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET_NAME}/settings.json`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE}`,
          'apikey': SUPABASE_SERVICE_ROLE,
          'Content-Type': 'application/json',
          'x-upsert': 'true'
        },
        body: blob
      });
    } catch (err) {
      console.warn('Failed to save settings to Supabase:', err);
    }
  }
};
