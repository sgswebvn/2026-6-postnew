import { 
  initialCategories, 
  initialAuthors, 
  initialPosts, 
  initialComments, 
  initialSubscribers, 
  initialSettings,
  initialStaffList
} from '../../server/seedData.js';
import { api } from './api.js';
import { supabaseStorage } from './supabaseStorage.js';

export const STORAGE_KEYS = {
  POSTS: 'horizon_posts_v2',
  CATEGORIES: 'horizon_categories_v2',
  SETTINGS: 'horizon_settings_v2',
  AUTHORS: 'horizon_authors_v2',
  COMMENTS: 'horizon_comments_v2',
  SUBSCRIBERS: 'horizon_subscribers_v2',
  BOOKMARKS: 'horizon_bookmarks_v2',
  ADMIN_AUTH: 'horizon_admin_auth_v2',
  STAFF: 'horizon_staff_v2',
  ACTIVITY_LOGS: 'horizon_activity_logs_v2'
};

const safeSetItem = (key, value) => {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (err) {
    if (err.name === 'QuotaExceededError' || err.code === 22) {
      console.warn(`[Storage Cache Warning] LocalStorage quota exceeded for key "${key}". Cache bypassed; cloud state is authoritative.`);
      return false;
    }
    console.error(`[Storage Cache Error] Error setting localStorage key "${key}":`, err);
    return false;
  }
};

export const storageService = {
  /**
   * Fast hydration from Local Cache, then refresh from Primary MongoDB and Supabase CDN
   */
  async initializeFromDB() {
    try {
      const [remotePosts, remoteStaff, remoteCats, remoteAuthors, remoteSettings] = await Promise.allSettled([
        api.getPosts(),
        api.getStaffList(),
        api.getCategories(),
        api.getAuthors(),
        api.getSettings()
      ]);

      if (remotePosts.status === 'fulfilled' && Array.isArray(remotePosts.value) && remotePosts.value.length > 0) {
        safeSetItem(STORAGE_KEYS.POSTS, JSON.stringify(remotePosts.value));
      } else {
        try {
          const cdnRes = await fetch(supabaseStorage.getPublicManifestUrl('posts_manifest.json'));
          if (cdnRes.ok) {
            const cdnData = await cdnRes.json();
            if (Array.isArray(cdnData) && cdnData.length > 0) {
              safeSetItem(STORAGE_KEYS.POSTS, JSON.stringify(cdnData));
            }
          }
        } catch (e) {}
      }

      if (remoteStaff.status === 'fulfilled' && Array.isArray(remoteStaff.value) && remoteStaff.value.length > 0) {
        safeSetItem(STORAGE_KEYS.STAFF, JSON.stringify(remoteStaff.value));
      }

      if (remoteCats.status === 'fulfilled' && Array.isArray(remoteCats.value) && remoteCats.value.length > 0) {
        safeSetItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(remoteCats.value));
      }

      if (remoteAuthors.status === 'fulfilled' && Array.isArray(remoteAuthors.value) && remoteAuthors.value.length > 0) {
        safeSetItem(STORAGE_KEYS.AUTHORS, JSON.stringify(remoteAuthors.value));
      }

      if (remoteSettings.status === 'fulfilled' && remoteSettings.value && !remoteSettings.value.error) {
        safeSetItem(STORAGE_KEYS.SETTINGS, JSON.stringify(remoteSettings.value));
      }
    } catch (err) {
      console.warn('[StorageService] initializeFromDB partial warning:', err);
    }
  },

  // ==========================================
  // POSTS
  // ==========================================
  getPosts() {
    const raw = localStorage.getItem(STORAGE_KEYS.POSTS);
    if (!raw) {
      safeSetItem(STORAGE_KEYS.POSTS, JSON.stringify(initialPosts));
      return initialPosts;
    }
    try {
      const list = JSON.parse(raw);
      return Array.isArray(list) ? list : initialPosts;
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
        publishedAt: post.publishedAt || new Date().toISOString()
      };
      // Primary write to MongoDB via API (Throws error if database write fails)
      const saved = await api.createPost(newPost);
      if (saved && saved.id) {
        Object.assign(newPost, saved);
      }
      updated = [newPost, ...posts.filter(p => p.id !== newPost.id)];
      this.addActivityLog({
        staffName: post.authorName || 'Biên Tập Viên',
        action: 'publish_post',
        title: 'Xuất bản bài viết mới',
        details: `Đã xuất bản: "${newPost.title}"`,
        type: 'success'
      });
    } else {
      const updatedPost = { ...post, updatedAt: new Date().toISOString() };
      // Primary update to MongoDB via API (Throws error if database write fails)
      const saved = await api.updatePost(post.id, updatedPost);
      if (saved && saved.id) {
        Object.assign(updatedPost, saved);
      }
      updated = posts.map(p => p.id === post.id ? updatedPost : p);
      this.addActivityLog({
        staffName: post.authorName || 'Biên Tập Viên',
        action: 'edit_post',
        title: 'Chỉnh sửa bài viết',
        details: `Cập nhật bài: "${post.title}"`,
        type: 'neutral'
      });
    }

    // Only commit to local cache after server confirmation
    safeSetItem(STORAGE_KEYS.POSTS, JSON.stringify(updated));
    return updated;
  },

  async deletePost(id) {
    const currentPosts = this.getPosts();
    const target = currentPosts.find(p => p.id === id);
    const targetSlug = target?.slug || '';

    // Primary delete from MongoDB via API (Throws error if database fails)
    await api.deletePost(id);

    const posts = currentPosts.filter(p => p.id !== id && (!targetSlug || p.slug !== targetSlug));
    safeSetItem(STORAGE_KEYS.POSTS, JSON.stringify(posts));
    return posts;
  },

  incrementView(slug) {
    if (!slug) return this.getPosts();
    api.incrementView(slug).catch(() => {});
    return this.getPosts();
  },

  getReferralHits() {
    try {
      return JSON.parse(localStorage.getItem('horizon_staff_referrals_v2') || '{}');
    } catch {
      return {};
    }
  },

  async recordSeedingHit(refCode) {
    if (!refCode) return;
    const cleanRef = refCode.toUpperCase().trim();
    api.recordSeedingHit(cleanRef).catch(() => {});
  },

  // ==========================================
  // CATEGORIES
  // ==========================================
  getCategories() {
    const raw = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    if (!raw) {
      safeSetItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(initialCategories));
      return initialCategories;
    }
    try {
      const list = JSON.parse(raw);
      return Array.isArray(list) ? list : initialCategories;
    } catch {
      return initialCategories;
    }
  },

  async saveCategories(categories) {
    if (!Array.isArray(categories)) return this.getCategories();
    safeSetItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
    for (const cat of categories) {
      await api.saveCategory(cat);
    }
    return categories;
  },

  async addCategory(category) {
    const categories = this.getCategories();
    const newCat = {
      ...category,
      id: category.id || `cat-${Date.now()}`
    };
    const saved = await api.createCategory(newCat);
    const updated = [...categories, saved || newCat];
    safeSetItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(updated));
    return updated;
  },

  async deleteCategory(id) {
    const categories = this.getCategories();
    await api.deleteCategory(id);
    const updated = categories.filter(c => c.id !== id);
    safeSetItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(updated));
    return updated;
  },

  // ==========================================
  // AUTHORS
  // ==========================================
  getAuthors() {
    const raw = localStorage.getItem(STORAGE_KEYS.AUTHORS);
    if (!raw) {
      safeSetItem(STORAGE_KEYS.AUTHORS, JSON.stringify(initialAuthors));
      return initialAuthors;
    }
    try {
      const list = JSON.parse(raw);
      return Array.isArray(list) ? list : initialAuthors;
    } catch {
      return initialAuthors;
    }
  },

  async saveAuthors(authors) {
    if (!Array.isArray(authors)) return this.getAuthors();
    safeSetItem(STORAGE_KEYS.AUTHORS, JSON.stringify(authors));
    for (const author of authors) {
      await api.saveAuthor(author);
    }
    return authors;
  },

  async addAuthor(author) {
    const authors = this.getAuthors();
    const newAuthor = {
      ...author,
      id: author.id || `author-${Date.now()}`
    };
    const saved = await api.createAuthor(newAuthor);
    const updated = [...authors, saved || newAuthor];
    safeSetItem(STORAGE_KEYS.AUTHORS, JSON.stringify(updated));
    return updated;
  },

  async deleteAuthor(id) {
    const authors = this.getAuthors();
    await api.deleteAuthor(id);
    const updated = authors.filter(a => a.id !== id);
    safeSetItem(STORAGE_KEYS.AUTHORS, JSON.stringify(updated));
    return updated;
  },

  // ==========================================
  // SETTINGS
  // ==========================================
  getSettings() {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) {
      safeSetItem(STORAGE_KEYS.SETTINGS, JSON.stringify(initialSettings));
      return initialSettings;
    }
    try {
      const parsed = JSON.parse(raw);
      return (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) ? parsed : initialSettings;
    } catch {
      return initialSettings;
    }
  },

  async saveSettings(settings) {
    const saved = await api.updateSettings(settings);
    const result = saved || settings;
    safeSetItem(STORAGE_KEYS.SETTINGS, JSON.stringify(result));
    return result;
  },

  // ==========================================
  // STAFF MANAGEMENT
  // ==========================================
  getStaffList() {
    const raw = localStorage.getItem(STORAGE_KEYS.STAFF);
    if (!raw) {
      safeSetItem(STORAGE_KEYS.STAFF, JSON.stringify(initialStaffList));
      return initialStaffList;
    }
    try {
      const list = JSON.parse(raw);
      return Array.isArray(list) ? list : initialStaffList;
    } catch {
      return initialStaffList;
    }
  },

  async saveStaff(staffMember) {
    const list = this.getStaffList();
    let updated;
    const isNew = !staffMember.id || staffMember.id.startsWith('new-');

    if (isNew) {
      const newStaff = {
        ...staffMember,
        id: `staff-${Date.now()}`,
        joinDate: staffMember.joinDate || '08/2026',
        status: 'active'
      };
      const saved = await api.addStaff(newStaff);
      updated = [saved || newStaff, ...list];
      this.addActivityLog({
        staffName: 'Quản Trị Viên',
        action: 'staff_add',
        title: 'Thêm nhân sự mới',
        details: `Thêm nhân viên: ${newStaff.name}`,
        type: 'success'
      });
    } else {
      const saved = await api.updateStaff(staffMember.id, staffMember);
      updated = list.map(s => (s.id === staffMember.id || s.username === staffMember.username) ? (saved || { ...s, ...staffMember }) : s);
      this.addActivityLog({
        staffName: 'Quản Trị Viên',
        action: 'staff_update',
        title: 'Cập nhật hồ sơ nhân sự',
        details: `Cập nhật thông tin nhân viên: ${staffMember.name}`,
        type: 'neutral'
      });
    }
    safeSetItem(STORAGE_KEYS.STAFF, JSON.stringify(updated));
    return updated;
  },

  async deleteStaff(id) {
    await api.deleteStaff(id);
    const list = this.getStaffList().filter(s => s.id !== id);
    safeSetItem(STORAGE_KEYS.STAFF, JSON.stringify(list));
    return list;
  },

  async updateStaffSalary(id, salaryData) {
    const list = this.getStaffList();
    let targetStaff = null;
    const updated = list.map(s => {
      if (s.id === id) {
        const base = Number(salaryData.baseSalary || 0);
        const bonus = Number(salaryData.kpiBonus || 0);
        const deduction = Number(salaryData.deduction || 0);
        const net = Math.max(0, base + bonus - deduction);
        targetStaff = {
          ...s,
          salary: {
            ...s.salary,
            ...salaryData,
            baseSalary: base,
            kpiBonus: bonus,
            deduction,
            netSalary: net
          }
        };
        return targetStaff;
      }
      return s;
    });

    if (targetStaff) {
      await api.updateStaff(targetStaff.id, targetStaff);
    }
    safeSetItem(STORAGE_KEYS.STAFF, JSON.stringify(updated));
    return updated;
  },

  // ==========================================
  // ACTIVITY LOGS
  // ==========================================
  getActivityLogs() {
    const raw = localStorage.getItem(STORAGE_KEYS.ACTIVITY_LOGS);
    if (!raw) return [];
    try {
      const list = JSON.parse(raw);
      return Array.isArray(list) ? list : [];
    } catch {
      return [];
    }
  },

  addActivityLog(logItem) {
    const logs = this.getActivityLogs();
    const newLog = {
      id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      timestamp: new Date().toISOString(),
      type: logItem.type || 'info',
      ...logItem
    };
    const updated = [newLog, ...logs].slice(0, 100);
    safeSetItem(STORAGE_KEYS.ACTIVITY_LOGS, JSON.stringify(updated));
    api.addActivityLog(newLog).catch(() => {});
    return updated;
  },

  // ==========================================
  // COMMENTS
  // ==========================================
  getAllComments() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.COMMENTS);
      return raw ? JSON.parse(raw) : initialComments;
    } catch {
      return initialComments;
    }
  },

  getCommentsByPostSlug(slug) {
    const comments = this.getAllComments();
    return comments.filter(c => c.postSlug === slug);
  },

  async addComment(slug, comment) {
    const comments = this.getAllComments();
    const newComment = {
      id: `comment-${Date.now()}`,
      postSlug: slug,
      author: comment.author || 'Độc giả',
      avatar: comment.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${Date.now()}`,
      content: comment.content,
      createdAt: new Date().toISOString(),
      likes: 0
    };
    const saved = await api.addComment(newComment);
    const updated = [saved || newComment, ...comments];
    safeSetItem(STORAGE_KEYS.COMMENTS, JSON.stringify(updated));
    return saved || newComment;
  },

  async likeComment(commentId) {
    const comments = this.getAllComments();
    const updated = comments.map(c => c.id === commentId ? { ...c, likes: (c.likes || 0) + 1 } : c);
    safeSetItem(STORAGE_KEYS.COMMENTS, JSON.stringify(updated));
    api.likeComment(commentId).catch(() => {});
    return updated;
  },

  async deleteComment(commentId) {
    await api.deleteComment(commentId);
    const comments = this.getAllComments().filter(c => c.id !== commentId);
    safeSetItem(STORAGE_KEYS.COMMENTS, JSON.stringify(comments));
    return comments;
  },

  // ==========================================
  // SUBSCRIBERS
  // ==========================================
  getSubscribers() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SUBSCRIBERS);
      return raw ? JSON.parse(raw) : initialSubscribers;
    } catch {
      return initialSubscribers;
    }
  },

  async addSubscriber(email, source = 'footer') {
    const subscribers = this.getSubscribers();
    const cleanEmail = email.toLowerCase().trim();
    if (subscribers.some(s => s.email.toLowerCase() === cleanEmail)) {
      return { success: false, message: 'Email đã được đăng ký trước đó' };
    }
    const newSub = {
      id: `sub-${Date.now()}`,
      email: cleanEmail,
      source,
      subscribedAt: new Date().toISOString()
    };
    await api.addSubscriber(cleanEmail, source);
    const updated = [newSub, ...subscribers];
    safeSetItem(STORAGE_KEYS.SUBSCRIBERS, JSON.stringify(updated));
    return { success: true, message: 'Đăng ký nhận bản tin thành công!' };
  },

  async deleteSubscriber(email) {
    await api.deleteSubscriber(email);
    const subscribers = this.getSubscribers().filter(s => s.email.toLowerCase() !== email.toLowerCase());
    safeSetItem(STORAGE_KEYS.SUBSCRIBERS, JSON.stringify(subscribers));
    return subscribers;
  },

  // ==========================================
  // BOOKMARKS (Local Client Storage Acceptable for Guests)
  // ==========================================
  getBookmarks() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.BOOKMARKS);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  toggleBookmark(postSlug) {
    const bookmarks = this.getBookmarks();
    let updated;
    if (bookmarks.includes(postSlug)) {
      updated = bookmarks.filter(slug => slug !== postSlug);
    } else {
      updated = [...bookmarks, postSlug];
    }
    safeSetItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(updated));
    return updated;
  },

  isBookmarked(postSlug) {
    const bookmarks = this.getBookmarks();
    return bookmarks.includes(postSlug);
  },

  // ==========================================
  // INITIALIZE FROM CLOUD DATABASE (MONGODB ATLAS)
  // ==========================================
  async initializeFromDB() {
    try {
      const [posts, categories, authors, staffList, settings, comments, subscribers] = await Promise.all([
        api.getPosts().catch(() => null),
        api.getCategories().catch(() => null),
        api.getAuthors().catch(() => null),
        api.getStaffList().catch(() => null),
        api.getSettings().catch(() => null),
        api.getComments().catch(() => null),
        api.getSubscribers().catch(() => null)
      ]);

      const result = {};

      if (Array.isArray(posts) && posts.length > 0) {
        safeSetItem(STORAGE_KEYS.POSTS, JSON.stringify(posts));
        result.posts = posts;
      }
      if (Array.isArray(categories) && categories.length > 0) {
        safeSetItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
        result.categories = categories;
      }
      if (Array.isArray(authors) && authors.length > 0) {
        safeSetItem(STORAGE_KEYS.AUTHORS, JSON.stringify(authors));
        result.authors = authors;
      }
      if (Array.isArray(staffList) && staffList.length > 0) {
        safeSetItem(STORAGE_KEYS.STAFF, JSON.stringify(staffList));
        result.staffList = staffList;
      }
      if (settings && typeof settings === 'object') {
        safeSetItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
        result.settings = settings;
      }
      if (Array.isArray(comments) && comments.length > 0) {
        safeSetItem(STORAGE_KEYS.COMMENTS, JSON.stringify(comments));
        result.comments = comments;
      }
      if (Array.isArray(subscribers) && subscribers.length > 0) {
        safeSetItem(STORAGE_KEYS.SUBSCRIBERS, JSON.stringify(subscribers));
        result.subscribers = subscribers;
      }

      return result;
    } catch (e) {
      console.warn('initializeFromDB warning:', e);
      return null;
    }
  }
};
