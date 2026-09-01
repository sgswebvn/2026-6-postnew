const API_BASE = '/api';

function getAuthHeaders(extraHeaders = {}) {
  const token = localStorage.getItem('horizon_auth_token') || sessionStorage.getItem('horizon_auth_token');
  const headers = { ...extraHeaders };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

function persistAuthUser(user) {
  if (!user) return;
  const raw = JSON.stringify(user);
  localStorage.setItem('horizon_current_user', raw);
  sessionStorage.setItem('horizon_current_user', raw);
  const role = user.role || 'editor';
  localStorage.setItem('horizon_user_role', role);
  sessionStorage.setItem('horizon_user_role', role);
}

function omitMongoMeta(doc) {
  if (!doc || typeof doc !== 'object') return {};
  const rest = { ...doc };
  delete rest._id;
  delete rest.__v;
  delete rest.createdAt;
  delete rest.updatedAt;
  return rest;
}

export const api = {
  // Authentication & Session
  async loginAdmin(identifier, password) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || `Đăng nhập thất bại (${res.status})`);
    }
    if (data.token) {
      localStorage.setItem('horizon_auth_token', data.token);
      sessionStorage.setItem('horizon_auth_token', data.token);
    }
    if (data.user) {
      persistAuthUser(data.user);
    }
    return data;
  },

  async getMe() {
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: getAuthHeaders()
      });
      if (res.status === 401) {
        return { ok: false, unauthorized: true };
      }
      if (!res.ok) {
        return { ok: false, unauthorized: false, status: res.status };
      }
      const user = await res.json();
      if (!user || !(user.id || user._id)) {
        return { ok: false, unauthorized: false };
      }
      persistAuthUser(user);
      return { ok: true, user };
    } catch {
      return { ok: false, unauthorized: false };
    }
  },

  async changePassword(currentPassword, newPassword) {
    const res = await fetch(`${API_BASE}/auth/change-password`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ currentPassword, newPassword })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Đổi mật khẩu thất bại');
    }
    if (data.token) {
      localStorage.setItem('horizon_auth_token', data.token);
      sessionStorage.setItem('horizon_auth_token', data.token);
    }
    return data;
  },

  logout() {
    localStorage.removeItem('horizon_auth_token');
    sessionStorage.removeItem('horizon_auth_token');
    localStorage.removeItem('horizon_admin_session');
    sessionStorage.removeItem('horizon_admin_session');
    localStorage.removeItem('horizon_current_user');
    sessionStorage.removeItem('horizon_current_user');
    localStorage.removeItem('horizon_user_role');
    sessionStorage.removeItem('horizon_user_role');
  },

  // Image Upload via Backend API
  async uploadImage(file, customName = '') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const res = await fetch(`${API_BASE}/upload`, {
            method: 'POST',
            headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({
              imageBase64: reader.result,
              fileName: customName || file.name || 'image.webp',
              mimeType: file.type || 'image/webp'
            })
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Upload failed');
          resolve(data);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = (e) => reject(new Error('Failed to read file buffer'));
      reader.readAsDataURL(file);
    });
  },

  // Health & Database
  async getStatus() {
    try {
      const res = await fetch(`${API_BASE}/status`);
      return await res.json();
    } catch {
      return { status: 'offline', database: { mode: 'Local Client Cache' } };
    }
  },

  // Posts
  async getPosts() {
    try {
      const res = await fetch(`${API_BASE}/posts`, {
        headers: getAuthHeaders()
      });
      if (!res.ok) throw new Error('Failed to fetch posts');
      return await res.json();
    } catch (e) {
      console.warn('[API Warning] Could not fetch posts from API:', e);
      return null;
    }
  },

  async getPostBySlug(slug) {
    try {
      const res = await fetch(`${API_BASE}/posts/${encodeURIComponent(slug)}`, {
        headers: getAuthHeaders()
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async createPost(postData) {
    const res = await fetch(`${API_BASE}/posts`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(postData)
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || `Server error: ${res.status}`);
    }
    return await res.json();
  },

  async updatePost(id, postData) {
    const res = await fetch(`${API_BASE}/posts/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(postData)
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || `Server error: ${res.status}`);
    }
    return await res.json();
  },

  async savePost(postData, isExplicitNew = false) {
    const isNew = isExplicitNew || !postData.id || postData.id.startsWith('new-');
    if (isNew) {
      return await this.createPost(postData);
    } else {
      return await this.updatePost(postData.id, postData);
    }
  },

  async deletePost(id) {
    const res = await fetch(`${API_BASE}/posts/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || `Failed to delete post: ${res.status}`);
    }
    return { success: true };
  },

  async incrementView(slug) {
    try {
      const res = await fetch(`${API_BASE}/posts/${encodeURIComponent(slug)}/view`, { method: 'POST' });
      return await res.json();
    } catch {
      return { views: 1 };
    }
  },

  // Categories
  async getCategories() {
    try {
      const res = await fetch(`${API_BASE}/categories`);
      if (!res.ok) throw new Error('Failed to fetch categories');
      return await res.json();
    } catch {
      return null;
    }
  },

  async createCategory(catData) {
    const res = await fetch(`${API_BASE}/categories`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(omitMongoMeta(catData))
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create category');
    }
    return await res.json();
  },

  async updateCategory(id, catData) {
    const res = await fetch(`${API_BASE}/categories/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(omitMongoMeta(catData))
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update category');
    }
    return await res.json();
  },

  async saveCategory(catData) {
    if (!catData.id || catData.id.startsWith('new-')) {
      return await this.createCategory(catData);
    }
    return await this.updateCategory(catData.id, catData);
  },

  async deleteCategory(id) {
    const res = await fetch(`${API_BASE}/categories/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to delete category');
    return { success: true };
  },

  // Authors
  async getAuthors() {
    try {
      const res = await fetch(`${API_BASE}/authors`);
      if (!res.ok) throw new Error('Failed to fetch authors');
      return await res.json();
    } catch {
      return null;
    }
  },

  async createAuthor(authorData) {
    const res = await fetch(`${API_BASE}/authors`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(authorData)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create author');
    }
    return await res.json();
  },

  async updateAuthor(id, authorData) {
    const res = await fetch(`${API_BASE}/authors/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(authorData)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update author');
    }
    return await res.json();
  },

  async saveAuthor(authorData) {
    if (!authorData.id || authorData.id.startsWith('new-')) {
      return await this.createAuthor(authorData);
    }
    return await this.updateAuthor(authorData.id, authorData);
  },

  async deleteAuthor(id) {
    const res = await fetch(`${API_BASE}/authors/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to delete author');
    return { success: true };
  },

  // Settings
  async getSettings() {
    try {
      const res = await fetch(`${API_BASE}/settings`);
      if (!res.ok) throw new Error('Failed to fetch settings');
      return await res.json();
    } catch {
      return null;
    }
  },

  async updateSettings(settingsData) {
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'PUT',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(settingsData)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update settings');
    }
    return await res.json();
  },

  async resetData() {
    const res = await fetch(`${API_BASE}/settings/reset`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to reset settings');
    return await res.json();
  },

  // Comments
  async getComments() {
    try {
      const res = await fetch(`${API_BASE}/comments`);
      return await res.json();
    } catch {
      return [];
    }
  },

  async addComment(commentData) {
    const res = await fetch(`${API_BASE}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(commentData)
    });
    if (!res.ok) throw new Error('Failed to post comment');
    return await res.json();
  },

  async likeComment(id) {
    try {
      const res = await fetch(`${API_BASE}/comments/${id}/like`, { method: 'POST' });
      return await res.json();
    } catch {
      return { likes: 1 };
    }
  },

  async deleteComment(id) {
    const res = await fetch(`${API_BASE}/comments/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to delete comment');
    return { success: true };
  },

  // Subscribers
  async getSubscribers() {
    try {
      const res = await fetch(`${API_BASE}/subscribers`, {
        headers: getAuthHeaders()
      });
      return await res.json();
    } catch {
      return [];
    }
  },

  async addSubscriber(email, source) {
    const res = await fetch(`${API_BASE}/subscribers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, source })
    });
    if (!res.ok) throw new Error('Failed to subscribe');
    return await res.json();
  },

  async deleteSubscriber(email) {
    const res = await fetch(`${API_BASE}/subscribers/${encodeURIComponent(email)}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to delete subscriber');
    return { success: true };
  },

  // Referrals
  async getReferrals() {
    try {
      const res = await fetch(`${API_BASE}/referrals`, {
        headers: getAuthHeaders()
      });
      return await res.json();
    } catch {
      return null;
    }
  },

  async recordSeedingHit(refCode) {
    try {
      const res = await fetch(`${API_BASE}/referrals/hit/${encodeURIComponent(refCode)}`, { method: 'POST' });
      return await res.json();
    } catch {
      return null;
    }
  },

  // Staff
  async getStaffList() {
    try {
      const res = await fetch(`${API_BASE}/staff`, {
        headers: getAuthHeaders()
      });
      return await res.json();
    } catch {
      return null;
    }
  },

  async addStaff(staffData) {
    const res = await fetch(`${API_BASE}/staff`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(staffData)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create staff');
    }
    return await res.json();
  },

  async updateStaff(id, staffData) {
    const res = await fetch(`${API_BASE}/staff/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(staffData)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update staff');
    }
    return await res.json();
  },

  async deleteStaff(id) {
    const res = await fetch(`${API_BASE}/staff/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to delete staff');
    return { success: true };
  },

  // Activity Logs
  async getActivityLogs() {
    try {
      const res = await fetch(`${API_BASE}/activity-logs`, {
        headers: getAuthHeaders()
      });
      return await res.json();
    } catch {
      return null;
    }
  },

  async addActivityLog(logData) {
    try {
      const res = await fetch(`${API_BASE}/activity-logs`, {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(logData)
      });
      return await res.json();
    } catch {
      return null;
    }
  },

  async getShortLinks() {
    const res = await fetch(`${API_BASE}/shortlinks`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      throw new Error('Failed to load short links');
    }
    return await res.json();
  },

  async createShortLink(payload) {
    const res = await fetch(`${API_BASE}/shortlinks`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || 'Failed to create short link');
    }
    return data;
  },

  async deleteShortLink(id) {
    const res = await fetch(`${API_BASE}/shortlinks/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to delete short link');
    }
    return { success: true };
  }
};
