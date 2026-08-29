const API_BASE = '/api';

export const api = {
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
      const res = await fetch(`${API_BASE}/posts`);
      if (!res.ok) throw new Error('Failed to fetch posts');
      return await res.json();
    } catch (e) {
      console.warn('[API Warning] Using local cache for posts:', e);
      return null;
    }
  },

  async getPostBySlug(slug) {
    try {
      const res = await fetch(`${API_BASE}/posts/${slug}`);
      if (!res.ok) throw new Error('Post not found');
      return await res.json();
    } catch {
      return null;
    }
  },

  async savePost(postData) {
    try {
      const isNew = !postData.id || postData.id.startsWith('new-');
      const url = isNew ? `${API_BASE}/posts` : `${API_BASE}/posts/${postData.id}`;
      const method = isNew ? 'POST' : 'PUT';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postData)
      });
      return await res.json();
    } catch (e) {
      console.error('[API Error] savePost failed:', e);
      return postData;
    }
  },

  async deletePost(id) {
    try {
      const res = await fetch(`${API_BASE}/posts/${id}`, { method: 'DELETE' });
      return await res.json();
    } catch (e) {
      console.error('[API Error] deletePost failed:', e);
      return { success: false };
    }
  },

  async incrementView(slug) {
    try {
      const res = await fetch(`${API_BASE}/posts/${slug}/view`, { method: 'POST' });
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

  async saveCategory(catData) {
    try {
      const isNew = !catData.id;
      const url = isNew ? `${API_BASE}/categories` : `${API_BASE}/categories/${catData.id}`;
      const method = isNew ? 'POST' : 'PUT';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(catData)
      });
      return await res.json();
    } catch {
      return catData;
    }
  },

  async deleteCategory(id) {
    try {
      const res = await fetch(`${API_BASE}/categories/${id}`, { method: 'DELETE' });
      return await res.json();
    } catch {
      return { success: false };
    }
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

  async saveAuthor(authorData) {
    try {
      const isNew = !authorData.id;
      const url = isNew ? `${API_BASE}/authors` : `${API_BASE}/authors/${authorData.id}`;
      const method = isNew ? 'POST' : 'PUT';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authorData)
      });
      return await res.json();
    } catch {
      return authorData;
    }
  },

  async deleteAuthor(id) {
    try {
      const res = await fetch(`${API_BASE}/authors/${id}`, { method: 'DELETE' });
      return await res.json();
    } catch {
      return { success: false };
    }
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
    try {
      const res = await fetch(`${API_BASE}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsData)
      });
      return await res.json();
    } catch {
      return settingsData;
    }
  },

  async resetData() {
    try {
      const res = await fetch(`${API_BASE}/settings/reset`, { method: 'POST' });
      return await res.json();
    } catch {
      return { success: false };
    }
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
    try {
      const res = await fetch(`${API_BASE}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(commentData)
      });
      return await res.json();
    } catch {
      return commentData;
    }
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
    try {
      const res = await fetch(`${API_BASE}/comments/${id}`, { method: 'DELETE' });
      return await res.json();
    } catch {
      return { success: false };
    }
  },

  // Subscribers
  async getSubscribers() {
    try {
      const res = await fetch(`${API_BASE}/subscribers`);
      return await res.json();
    } catch {
      return [];
    }
  },

  async addSubscriber(email, source) {
    try {
      const res = await fetch(`${API_BASE}/subscribers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source })
      });
      return await res.json();
    } catch {
      return { success: true, email };
    }
  },

  async deleteSubscriber(email) {
    try {
      const res = await fetch(`${API_BASE}/subscribers/${encodeURIComponent(email)}`, { method: 'DELETE' });
      return await res.json();
    } catch {
      return { success: false };
    }
  },

  // Referrals
  async getReferrals() {
    try {
      const res = await fetch(`${API_BASE}/referrals`);
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

  // Auth & Staff
  async loginAdmin(identifier, password) {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password })
      });
      return await res.json();
    } catch {
      return { error: 'Network error' };
    }
  },

  async getStaffList() {
    try {
      const res = await fetch(`${API_BASE}/staff`);
      return await res.json();
    } catch {
      return null;
    }
  },

  async addStaff(staffData) {
    try {
      const res = await fetch(`${API_BASE}/staff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(staffData)
      });
      return await res.json();
    } catch {
      return null;
    }
  },

  async updateStaff(id, staffData) {
    try {
      const res = await fetch(`${API_BASE}/staff/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(staffData)
      });
      return await res.json();
    } catch {
      return null;
    }
  },

  async deleteStaff(id) {
    try {
      await fetch(`${API_BASE}/staff/${encodeURIComponent(id)}`, { method: 'DELETE' });
      return { success: true };
    } catch {
      return { success: false };
    }
  },

  // Activity Logs
  async getActivityLogs() {
    try {
      const res = await fetch(`${API_BASE}/activity-logs`);
      return await res.json();
    } catch {
      return null;
    }
  },

  async addActivityLog(logData) {
    try {
      const res = await fetch(`${API_BASE}/activity-logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logData)
      });
      return await res.json();
    } catch {
      return null;
    }
  }
};
