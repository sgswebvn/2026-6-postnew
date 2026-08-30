// Supabase Storage Client for THE HORI CLICK
// Secure Frontend Client: ZERO Service Role Secrets, Zero Client Manifest Overwrites
import { api } from './api.js';

const SUPABASE_URL = 'https://mmltqgekvpdnezqdavvc.supabase.co';
const BUCKET_NAME = 'postnew';

export const supabaseStorage = {
  /**
   * Upload an image file to Supabase via the secure Backend API
   * @param {File|Blob} file 
   * @param {string} customName 
   * @returns {Promise<{ url: string, key: string }>}
   */
  async uploadImage(file, customName = '') {
    try {
      const res = await api.uploadImage(file, customName);
      if (res && res.url) {
        return {
          url: res.url,
          key: res.path || `${BUCKET_NAME}/${customName}`
        };
      }
      throw new Error(res?.error || 'Upload failed');
    } catch (error) {
      console.error('Image Upload Error:', error);
      throw error;
    }
  },

  /**
   * Public CDN helper: get public post URL
   * @param {string} slug 
   */
  getPublicPostUrl(slug) {
    if (!slug) return '';
    const cleanSlug = slug.toLowerCase().trim().replace(/[^a-z0-9-]/g, '-');
    return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/posts/${cleanSlug}.json`;
  },

  /**
   * Public CDN helper: get public manifest URL
   * @param {string} manifestName 
   */
  getPublicManifestUrl(manifestName) {
    return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${manifestName}`;
  },

  // Backward compatible no-op stubs (mutations are now performed atomically on Backend API)
  async savePostMetadata(post) { return null; },
  async deletePostMetadata(id, slug = '') { return true; },
  async saveStaffManifest(staffList) { return staffList; },
  async saveCategoriesManifest(categories) { return categories; },
  async saveAuthorsManifest(authors) { return authors; },
  async saveSettingsManifest(settings) { return settings; }
};
