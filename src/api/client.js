// API Client with automatic credentials and token management

const API_BASE = '/api';

export function getStoredToken() {
  return localStorage.getItem('blogweb_admin_token') || '';
}

export function setStoredToken(token) {
  if (token) {
    localStorage.setItem('blogweb_admin_token', token);
  } else {
    localStorage.removeItem('blogweb_admin_token');
  }
}

export async function apiRequest(endpoint, options = {}) {
  const token = getStoredToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const config = {
    ...options,
    headers,
    credentials: 'include'
  };

  if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
    config.body = JSON.stringify(options.body);
  }

  const res = await fetch(`${API_BASE}${endpoint}`, config);

  if (res.status === 401) {
    if (!endpoint.includes('/auth/login')) {
      setStoredToken('');
    }
  }

  let data;
  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    data = await res.json();
  } else {
    data = await res.text();
  }

  if (!res.ok) {
    const errorMsg = (data && data.error) ? data.error : (typeof data === 'string' ? data : `HTTP ${res.status}`);
    throw new Error(errorMsg);
  }

  return data;
}

export const api = {
  // Auth
  login: (username, password) => apiRequest('/auth/login', { method: 'POST', body: { username, password } }),
  getMe: () => apiRequest('/auth/me'),
  logout: () => apiRequest('/auth/logout', { method: 'POST' }),

  // Admin Stats & Time Range
  getStats: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/admin/stats${query ? `?${query}` : ''}`);
  },

  // Admin Analytics
  getAnalytics: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/admin/analytics${query ? `?${query}` : ''}`);
  },

  // Admin Posts
  getPosts: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/admin/posts${query ? `?${query}` : ''}`);
  },
  getPost: (id) => apiRequest(`/admin/posts/${id}`),
  createPost: (data) => apiRequest('/admin/posts', { method: 'POST', body: data }),
  updatePost: (id, data) => apiRequest(`/admin/posts/${id}`, { method: 'PUT', body: data }),
  deletePost: (id) => apiRequest(`/admin/posts/${id}`, { method: 'DELETE' }),
  togglePostStatus: (id) => apiRequest(`/admin/posts/${id}/status`, { method: 'PATCH' }),

  // Bulk Post Actions
  bulkPostAction: (action, ids, selectAllMatching = false, filterQuery = {}) => {
    return apiRequest('/admin/posts/bulk', {
      method: 'POST',
      body: { action, ids, selectAllMatching, filterQuery }
    });
  },

  // Danger Zone: Purge all posts
  deleteAllPosts: (confirmationPhrase) => {
    return apiRequest('/admin/posts/delete-all', {
      method: 'POST',
      body: { confirmationPhrase }
    });
  },

  // Admin Categories
  getCategories: () => apiRequest('/admin/categories'),
  createCategory: (data) => apiRequest('/admin/categories', { method: 'POST', body: data }),
  updateCategory: (id, data) => apiRequest(`/admin/categories/${id}`, { method: 'PUT', body: data }),
  deleteCategory: (id) => apiRequest(`/admin/categories/${id}`, { method: 'DELETE' }),

  // Admin Custom Scripts (Header / Footer / GTM)
  getScripts: () => apiRequest('/admin/scripts'),
  createScript: (data) => apiRequest('/admin/scripts', { method: 'POST', body: data }),
  updateScript: (id, data) => apiRequest(`/admin/scripts/${id}`, { method: 'PUT', body: data }),
  deleteScript: (id) => apiRequest(`/admin/scripts/${id}`, { method: 'DELETE' }),
  toggleScript: (id) => apiRequest(`/admin/scripts/${id}/toggle`, { method: 'PATCH' }),

  // Admin Settings
  getSettings: () => apiRequest('/admin/settings'),
  updateSettings: (data) => apiRequest('/admin/settings', { method: 'PUT', body: data }),

  // Admin Staff
  getStaff: () => apiRequest('/admin/staff'),
  createStaff: (data) => apiRequest('/admin/staff', { method: 'POST', body: data }),
  updateStaff: (id, data) => apiRequest(`/admin/staff/${id}`, { method: 'PUT', body: data }),
  deleteStaff: (id) => apiRequest(`/admin/staff/${id}`, { method: 'DELETE' }),

  // Image Upload via Google Drive Storage
  uploadImage: async (file) => {
    return new Promise((resolve, reject) => {
      if (!file) {
        return reject(new Error('No file provided for upload.'));
      }
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const res = await apiRequest('/uploads/image', {
            method: 'POST',
            body: {
              imageBase64: reader.result,
              fileName: file.name || `image_${Date.now()}.png`,
              mimeType: file.type || 'image/png'
            }
          });
          resolve(res);
        } catch (err) {
          // Fallback to /admin/upload for maximum server route compatibility
          try {
            const fallbackRes = await apiRequest('/admin/upload', {
              method: 'POST',
              body: {
                imageBase64: reader.result,
                fileName: file.name || `image_${Date.now()}.png`,
                mimeType: file.type || 'image/png'
              }
            });
            resolve(fallbackRes);
          } catch (fallbackErr) {
            reject(err);
          }
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file buffer.'));
      reader.readAsDataURL(file);
    });
  },

  // Avatar Upload via Google Drive (Staff & HRM)
  uploadAvatar: async (file, staffId = null) => {
    return new Promise((resolve, reject) => {
      if (!file) {
        return reject(new Error('Vui lòng chọn ảnh đại diện.'));
      }
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const res = await apiRequest('/uploads/avatar', {
            method: 'POST',
            body: {
              imageBase64: reader.result,
              fileName: file.name || `avatar_${Date.now()}.jpg`,
              mimeType: file.type || 'image/jpeg',
              staffId
            }
          });
          resolve(res);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error('Không thể đọc file ảnh.'));
      reader.readAsDataURL(file);
    });
  },

  // Google Drive Diagnostics & Health Check
  getUploadHealth: () => apiRequest('/uploads/health'),

  // Public Reader Endpoints
  getPublicPosts: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/posts${query ? `?${query}` : ''}`);
  },
  getPublicPostBySlug: (slug) => apiRequest(`/posts/${slug}`),
  getPublicCategories: () => apiRequest('/categories'),
  getPublicCategoryBySlug: (slug) => apiRequest(`/categories/${slug}`),
  getPublicSettings: () => apiRequest('/settings'),
  getPublicScripts: () => apiRequest('/scripts'),
  sendContactInquiry: (data) => apiRequest('/contact', { method: 'POST', body: data })
};
