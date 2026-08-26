import { api } from './api';
import { initialPosts, initialCategories, initialAuthors, initialSettings, initialComments, initialSubscribers } from '../../server/seedData.js';

const STORAGE_KEYS = {
  POSTS: 'horizon_posts_v2',
  CATEGORIES: 'horizon_categories_v2',
  SETTINGS: 'horizon_settings_v2',
  AUTHORS: 'horizon_authors_v2',
  COMMENTS: 'horizon_comments_v2',
  SUBSCRIBERS: 'horizon_subscribers_v2',
  BOOKMARKS: 'horizon_bookmarks_v2',
  ADMIN_AUTH: 'horizon_admin_auth_v2'
};

export const storageService = {
  // Sync all with MongoDB on boot
  async initializeFromDB() {
    try {
      const [posts, categories, authors, settings] = await Promise.all([
        api.getPosts(),
        api.getCategories(),
        api.getAuthors(),
        api.getSettings()
      ]);

      if (posts && posts.length > 0) localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(posts));
      if (categories && categories.length > 0) localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
      if (authors && authors.length > 0) localStorage.setItem(STORAGE_KEYS.AUTHORS, JSON.stringify(authors));
      if (settings && settings.siteName) localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));

      return { posts, categories, authors, settings };
    } catch {
      return null;
    }
  },

  // Posts
  getPosts() {
    const raw = localStorage.getItem(STORAGE_KEYS.POSTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(initialPosts));
      return initialPosts;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return initialPosts;
    }
  },

  async savePost(post) {
    const posts = this.getPosts();
    let updated;
    const isNew = !post.id || post.id.startsWith('new-');

    if (isNew) {
      const newPost = {
        ...post,
        id: `post-${Date.now()}`,
        publishedAt: new Date().toISOString(),
        views: 0
      };
      updated = [newPost, ...posts];
      api.savePost(newPost).catch(() => {});
    } else {
      updated = posts.map(p => p.id === post.id ? { ...p, ...post, updatedAt: new Date().toISOString() } : p);
      api.savePost(post).catch(() => {});
    }

    localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(updated));
    return updated;
  },

  async deletePost(id) {
    const posts = this.getPosts().filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(posts));
    api.deletePost(id).catch(() => {});
    return posts;
  },

  async incrementView(slug) {
    const posts = this.getPosts();
    const target = posts.find(p => p.slug === slug);
    if (target) {
      target.views = (target.views || 0) + 1;
      localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(posts));
      api.incrementView(slug).catch(() => {});
    }
  },

  // Categories
  getCategories() {
    const raw = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(initialCategories));
      return initialCategories;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return initialCategories;
    }
  },

  saveCategories(categories) {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  },

  // Authors
  getAuthors() {
    const raw = localStorage.getItem(STORAGE_KEYS.AUTHORS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.AUTHORS, JSON.stringify(initialAuthors));
      return initialAuthors;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return initialAuthors;
    }
  },

  saveAuthors(authors) {
    localStorage.setItem(STORAGE_KEYS.AUTHORS, JSON.stringify(authors));
  },

  // Settings
  getSettings() {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(initialSettings));
      return initialSettings;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return initialSettings;
    }
  },

  saveSettings(settings) {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    api.updateSettings(settings).catch(() => {});
  },

  // Comments
  getAllComments() {
    const raw = localStorage.getItem(STORAGE_KEYS.COMMENTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(initialComments));
      return initialComments;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return initialComments;
    }
  },

  getComments(postId) {
    const all = this.getAllComments();
    return all.filter(c => c.postId === postId);
  },

  addComment(postId, commentData) {
    const all = this.getAllComments();
    const newComm = {
      id: `comm-${Date.now()}`,
      postId,
      authorName: commentData.authorName || 'Verified Reader',
      authorRole: commentData.authorRole || 'Executive Subscriber',
      avatar: commentData.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150',
      content: commentData.content,
      likes: 1,
      status: 'approved',
      createdAt: new Date().toISOString()
    };
    const updated = [newComm, ...all];
    localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(updated));
    api.addComment(newComm).catch(() => {});
    return newComm;
  },

  likeComment(id) {
    const all = this.getAllComments();
    const updated = all.map(c => c.id === id ? { ...c, likes: (c.likes || 1) + 1 } : c);
    localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(updated));
    api.likeComment(id).catch(() => {});
    return updated;
  },

  deleteComment(id) {
    const all = this.getAllComments().filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(all));
    api.deleteComment(id).catch(() => {});
    return all;
  },

  // Subscribers
  getSubscribers() {
    const raw = localStorage.getItem(STORAGE_KEYS.SUBSCRIBERS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.SUBSCRIBERS, JSON.stringify(initialSubscribers));
      return initialSubscribers;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return initialSubscribers;
    }
  },

  addSubscriber(email, source = 'Website Form') {
    const list = this.getSubscribers();
    if (!list.some(s => s.email.toLowerCase() === email.toLowerCase())) {
      const updated = [{ email: email.toLowerCase(), date: new Date().toISOString(), source }, ...list];
      localStorage.setItem(STORAGE_KEYS.SUBSCRIBERS, JSON.stringify(updated));
      api.addSubscriber(email, source).catch(() => {});
    }
    return true;
  },

  deleteSubscriber(email) {
    const list = this.getSubscribers().filter(s => s.email.toLowerCase() !== email.toLowerCase());
    localStorage.setItem(STORAGE_KEYS.SUBSCRIBERS, JSON.stringify(list));
    api.deleteSubscriber(email).catch(() => {});
    return list;
  },

  // Bookmarks
  getBookmarks() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.BOOKMARKS) || '[]');
    } catch {
      return [];
    }
  },

  toggleBookmark(slug) {
    const current = this.getBookmarks();
    let updated;
    if (current.includes(slug)) {
      updated = current.filter(s => s !== slug);
    } else {
      updated = [...current, slug];
    }
    localStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(updated));
    return updated;
  },

  // Reset Data
  resetToDefaults() {
    localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(initialPosts));
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(initialCategories));
    localStorage.setItem(STORAGE_KEYS.AUTHORS, JSON.stringify(initialAuthors));
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(initialSettings));
    localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(initialComments));
    localStorage.setItem(STORAGE_KEYS.SUBSCRIBERS, JSON.stringify(initialSubscribers));
    api.resetData().catch(() => {});
  },

  // Auth
  isAdminAuth() {
    return localStorage.getItem(STORAGE_KEYS.ADMIN_AUTH) === 'true';
  },

  setAdminAuth(val) {
    localStorage.setItem(STORAGE_KEYS.ADMIN_AUTH, val ? 'true' : 'false');
  }
};
