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
  }
};
