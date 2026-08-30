import { api } from './api.js';
import { supabaseStorage } from './supabaseStorage.js';
import { 
  initialPosts, 
  initialCategories, 
  initialAuthors, 
  initialSettings, 
  initialComments, 
  initialSubscribers,
  initialStaffList,
  initialActivityLogs
} from '../../server/seedData.js';

const STORAGE_KEYS = {
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

// Trim heavy HTML content from browser localStorage cache (full content is loaded from Cloud/Supabase)
const compressPostsForCache = (postsList) => {
  if (!Array.isArray(postsList)) return [];
  return postsList.map(p => {
    const { content, ...meta } = p;
    return {
      ...meta,
      content: (content && content.length > 500) ? content.slice(0, 500) : content
    };
  });
};

// Safe setItem that never throws QuotaExceededError and optimizes cache footprint
const safeSetItem = (key, value) => {
  try {
    let finalVal = value;
    if (key === STORAGE_KEYS.POSTS) {
      try {
        const parsed = JSON.parse(value);
        finalVal = JSON.stringify(compressPostsForCache(parsed));
      } catch (e) {}
    }
    localStorage.setItem(key, finalVal);
  } catch (err) {
    try {
      localStorage.removeItem(STORAGE_KEYS.POSTS);
      localStorage.removeItem('horizon_telemetry_events_v2');
      if (key === STORAGE_KEYS.POSTS) {
        const parsed = JSON.parse(value);
        localStorage.setItem(key, JSON.stringify(compressPostsForCache(parsed)));
      } else {
        localStorage.setItem(key, value);
      }
    } catch (fallbackErr) {
      // Cloud database is always primary, silent fallback
    }
  }
};

export const storageService = {
  // Sync all with Cloud Database & Supabase on boot
  async initializeFromDB() {
    try {
      const [remotePosts, categories, authors, settings, referrals, staffList, activityLogs] = await Promise.all([
        api.getPosts(),
        api.getCategories(),
        api.getAuthors(),
        api.getSettings(),
        api.getReferrals(),
        api.getStaffList(),
        api.getActivityLogs()
      ]);

      // 1. Fetch Supabase posts manifest
      let supabasePosts = [];
      try {
        const sbRes = await fetch('https://mmltqgekvpdnezqdavvc.supabase.co/storage/v1/object/public/postnew/posts_manifest.json');
        if (sbRes.ok) {
          const parsed = await sbRes.json();
          if (Array.isArray(parsed)) supabasePosts = parsed;
        }
      } catch (e) {}

      let mergedPosts = [...(remotePosts || [])];
      for (const sp of supabasePosts) {
        if (!mergedPosts.some(rp => rp.id === sp.id || (rp.slug && sp.slug && rp.slug === sp.slug))) {
          mergedPosts.unshift(sp);
        }
      }

      if (mergedPosts.length > 0) {
        safeSetItem(STORAGE_KEYS.POSTS, JSON.stringify(mergedPosts));
      }

      // 2. Fetch Supabase staff manifest
      let supabaseStaff = [];
      try {
        const sbStaffRes = await fetch('https://mmltqgekvpdnezqdavvc.supabase.co/storage/v1/object/public/postnew/staff_manifest.json');
        if (sbStaffRes.ok) {
          const parsed = await sbStaffRes.json();
          if (Array.isArray(parsed)) supabaseStaff = parsed;
        }
      } catch (e) {}

      let mergedStaff = [...(staffList || [])];
      for (const ss of supabaseStaff) {
        if (!mergedStaff.some(ms => ms.id === ss.id || ms.username === ss.username || (ms.refCode && ss.refCode && ms.refCode === ss.refCode))) {
          mergedStaff.push(ss);
        }
      }

      if (mergedStaff.length > 0) {
        safeSetItem(STORAGE_KEYS.STAFF, JSON.stringify(mergedStaff));
      }

      // 3. Categories, Authors, Settings, Logs
      if (categories && categories.length > 0) safeSetItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
      if (authors && authors.length > 0) safeSetItem(STORAGE_KEYS.AUTHORS, JSON.stringify(authors));
      if (settings && settings.siteName) safeSetItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
      if (activityLogs && activityLogs.length > 0) safeSetItem(STORAGE_KEYS.ACTIVITY_LOGS, JSON.stringify(activityLogs));

      return { 
        posts: mergedPosts.length > 0 ? mergedPosts : initialPosts, 
        categories: (categories && categories.length > 0) ? categories : initialCategories, 
        authors: (authors && authors.length > 0) ? authors : initialAuthors, 
        settings: settings || initialSettings, 
        referrals: referrals || {}, 
        staffList: mergedStaff.length > 0 ? mergedStaff : initialStaffList, 
        activityLogs: activityLogs || [] 
      };
    } catch {
      return null;
    }
  },

  // ==========================================
  // POSTS CRUD (Direct Cloud Database & Supabase)
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
      try {
        const saved = await api.createPost(newPost);
        if (saved && saved.id) {
          Object.assign(newPost, saved);
        }
      } catch (err) {
        console.warn('Backend createPost fallback:', err);
      }
      updated = [newPost, ...posts.filter(p => p.id !== newPost.id)];
      this.addActivityLog({
        staffName: post.authorName || 'Biên Tập Viên',
        action: 'publish_post',
        title: 'Xuất bản bài viết mới',
        details: `Đã xuất bản: "${newPost.title}"`,
        type: 'success'
      });
      await supabaseStorage.savePostMetadata(newPost).catch(() => {});
    } else {
      const updatedPost = { ...post, updatedAt: new Date().toISOString() };
      try {
        const saved = await api.updatePost(post.id, updatedPost);
        if (saved && saved.id) {
          Object.assign(updatedPost, saved);
        }
      } catch (err) {
        console.warn('Backend updatePost fallback:', err);
      }
      updated = posts.map(p => p.id === post.id ? updatedPost : p);
      this.addActivityLog({
        staffName: post.authorName || 'Biên Tập Viên',
        action: 'edit_post',
        title: 'Chỉnh sửa bài viết',
        details: `Cập nhật bài: "${post.title}"`,
        type: 'neutral'
      });
      await supabaseStorage.savePostMetadata(updatedPost).catch(() => {});
    }

    safeSetItem(STORAGE_KEYS.POSTS, JSON.stringify(updated));
    return updated;
  },

  async deletePost(id) {
    const currentPosts = this.getPosts();
    const target = currentPosts.find(p => p.id === id);
    const targetSlug = target?.slug || '';

    // Direct deletion from Supabase Cloud CDN manifest
    await supabaseStorage.deletePostMetadata(id, targetSlug).catch(() => {});

    try {
      await api.deletePost(id);
    } catch (err) {
      console.warn('Backend deletePost fallback:', err);
    }
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

  async recordSeedingHit(refCode, path = '/') {
    if (!refCode) return;
    const cleanRef = refCode.toUpperCase().trim();
    api.recordSeedingHit(cleanRef).catch(() => {});
  },

  // ==========================================
  // CATEGORIES CRUD (Direct Cloud Database & Supabase)
  // ==========================================
  getCategories() {
    const raw = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    if (!raw) {
      safeSetItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(initialCategories));
      return initialCategories;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return initialCategories;
    }
  },

  async saveCategories(categories) {
    safeSetItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
    await supabaseStorage.saveCategoriesManifest(categories).catch(() => {});
    for (const cat of categories) {
      api.saveCategory(cat).catch(() => {});
    }
  },

  async addCategory(category) {
    const categories = this.getCategories();
    const newCat = {
      id: category.id || `cat-${Date.now()}`,
      name: category.name,
      slug: category.slug || category.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      description: category.description || '',
      color: category.color || 'blue'
    };
    try {
      const saved = await api.createCategory(newCat);
      if (saved && saved.id) Object.assign(newCat, saved);
    } catch (err) {
      console.warn('Backend createCategory fallback:', err);
    }
    const updated = [...categories.filter(c => c.id !== newCat.id), newCat];
    safeSetItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(updated));
    await supabaseStorage.saveCategoriesManifest(updated).catch(() => {});
    this.addActivityLog({
      staffName: 'Quản Trị Viên',
      action: 'category_create',
      title: 'Tạo chuyên mục mới',
      details: `Đã tạo chuyên mục: "${newCat.name}"`,
      type: 'success'
    });
    return newCat;
  },

  async deleteCategory(id) {
    try {
      await api.deleteCategory(id);
    } catch (err) {
      console.warn('Backend deleteCategory fallback:', err);
    }
    const categories = this.getCategories().filter(c => c.id !== id);
    safeSetItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
    await supabaseStorage.saveCategoriesManifest(categories).catch(() => {});
    return categories;
  },

  // ==========================================
  // AUTHORS CRUD (Direct Cloud Database & Supabase)
  // ==========================================
  getAuthors() {
    const raw = localStorage.getItem(STORAGE_KEYS.AUTHORS);
    if (!raw) {
      safeSetItem(STORAGE_KEYS.AUTHORS, JSON.stringify(initialAuthors));
      return initialAuthors;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return initialAuthors;
    }
  },

  async saveAuthors(authors) {
    safeSetItem(STORAGE_KEYS.AUTHORS, JSON.stringify(authors));
    await supabaseStorage.saveAuthorsManifest(authors).catch(() => {});
    for (const author of authors) {
      api.saveAuthor(author).catch(() => {});
    }
  },

  async addAuthor(author) {
    const authors = this.getAuthors();
    const newAuthor = {
      id: author.id || `author-${Date.now()}`,
      name: author.name,
      slug: author.slug || author.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      role: author.role || 'Biên tập viên',
      avatar: author.avatar || '',
      bio: author.bio || '',
      verified: true
    };
    try {
      const saved = await api.createAuthor(newAuthor);
      if (saved && saved.id) Object.assign(newAuthor, saved);
    } catch (err) {
      console.warn('Backend createAuthor fallback:', err);
    }
    const updated = [...authors.filter(a => a.id !== newAuthor.id), newAuthor];
    safeSetItem(STORAGE_KEYS.AUTHORS, JSON.stringify(updated));
    await supabaseStorage.saveAuthorsManifest(updated).catch(() => {});
    return newAuthor;
  },

  async deleteAuthor(id) {
    try {
      await api.deleteAuthor(id);
    } catch (err) {
      console.warn('Backend deleteAuthor fallback:', err);
    }
    const authors = this.getAuthors().filter(a => a.id !== id);
    safeSetItem(STORAGE_KEYS.AUTHORS, JSON.stringify(authors));
    await supabaseStorage.saveAuthorsManifest(authors).catch(() => {});
    return authors;
  },

  // ==========================================
  // SETTINGS CRUD (Direct Cloud Database & Supabase)
  // ==========================================
  getSettings() {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) {
      safeSetItem(STORAGE_KEYS.SETTINGS, JSON.stringify(initialSettings));
      return initialSettings;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return initialSettings;
    }
  },

  async saveSettings(settings) {
    safeSetItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    await supabaseStorage.saveSettingsManifest(settings).catch(() => {});
    try {
      await api.updateSettings(settings);
    } catch (err) {
      console.warn('Backend updateSettings fallback:', err);
    }
  },

  // ==========================================
  // STAFF & PROFILE MANAGEMENT (Direct Cloud Database & Supabase)
  // ==========================================
  getStaffList() {
    const raw = localStorage.getItem(STORAGE_KEYS.STAFF);
    if (!raw) {
      return [];
    }
    try {
      const list = JSON.parse(raw);
      return Array.isArray(list) ? list : [];
    } catch {
      return [];
    }
  },

  async saveStaff(staffMember) {
    const list = this.getStaffList();
    const existingIndex = list.findIndex(s => s.id === staffMember.id || (s.username && staffMember.username && s.username === staffMember.username));
    let updated;
    
    if (existingIndex === -1) {
      const newStaff = {
        ...staffMember,
        id: staffMember.id || `staff-${Date.now()}`,
        joinDate: staffMember.joinDate || new Date().toISOString().split('T')[0],
        status: staffMember.status || 'active',
        permissions: staffMember.permissions || {
          canManagePosts: true,
          canPublishPosts: false,
          canManageCategories: false,
          canViewRevenue: false,
          canManageStaff: false,
          canManagePayroll: false,
          canManageComments: true,
          canManageSettings: false
        },
        salary: staffMember.salary || {
          baseSalary: 10000000,
          kpiBonus: 0,
          deduction: 0,
          netSalary: 10000000,
          payPeriod: '08/2026',
          paymentStatus: 'pending',
          paymentDate: ''
        }
      };
      updated = [newStaff, ...list];
      try { await api.addStaff(newStaff); } catch (e) {}
      await supabaseStorage.saveStaffManifest(updated).catch(() => {});
      this.addActivityLog({
        staffName: 'Quản Trị Viên',
        action: 'staff_add',
        title: 'Thêm nhân sự mới',
        details: `Thêm nhân viên: ${newStaff.name} (${newStaff.roleName || newStaff.role})`,
        type: 'success'
      });
    } else {
      updated = list.map(s => (s.id === staffMember.id || s.username === staffMember.username) ? { ...s, ...staffMember } : s);
      try { await api.updateStaff(staffMember.id, staffMember); } catch (e) {}
      await supabaseStorage.saveStaffManifest(updated).catch(() => {});
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
    const list = this.getStaffList().filter(s => s.id !== id);
    safeSetItem(STORAGE_KEYS.STAFF, JSON.stringify(list));
    try { await api.deleteStaff(id); } catch (e) {}
    await supabaseStorage.saveStaffManifest(list).catch(() => {});
    return list;
  },

  async updateStaffSalary(id, salaryData) {
    const list = this.getStaffList();
    let targetStaffName = 'Nhân sự';
    let targetStaff = null;
    const updated = list.map(s => {
      if (s.id === id) {
        targetStaffName = s.name;
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
    safeSetItem(STORAGE_KEYS.STAFF, JSON.stringify(updated));
    if (targetStaff) {
      try { await api.updateStaff(targetStaff.id, targetStaff); } catch (e) {}
      await supabaseStorage.saveStaffManifest(updated).catch(() => {});
    }
    this.addActivityLog({
      staffName: 'Kế Toán / Quản Trị',
      action: 'payroll_update',
      title: 'Điều chỉnh phiếu lương',
      details: `Cập nhật lương cho ${targetStaffName}: Thực nhận ${(salaryData.netSalary || 0).toLocaleString()} đ (${salaryData.payPeriod || '08/2026'})`,
      type: 'warning'
    });
    return updated;
  },

  // ==========================================
  // ACTIVITY LOGS
  // ==========================================
  getActivityLogs() {
    const raw = localStorage.getItem(STORAGE_KEYS.ACTIVITY_LOGS);
    if (!raw) {
      return [];
    }
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

  clearActivityLogs() {
    safeSetItem(STORAGE_KEYS.ACTIVITY_LOGS, JSON.stringify([]));
    api.deleteActivityLogs && api.deleteActivityLogs().catch(() => {});
    return [];
  },

  // ==========================================
  // COMMENTS
  // ==========================================
  getAllComments() {
    const raw = localStorage.getItem(STORAGE_KEYS.COMMENTS);
    if (!raw) {
      safeSetItem(STORAGE_KEYS.COMMENTS, JSON.stringify(initialComments));
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
      avatar: commentData.avatar || 'https://mmltqgekvpdnezqdavvc.supabase.co/storage/v1/object/public/postnew/uploads/post_img_30.jpg',
      content: commentData.content,
      likes: 1,
      status: 'approved',
      createdAt: new Date().toISOString()
    };
    const updated = [newComm, ...all];
    safeSetItem(STORAGE_KEYS.COMMENTS, JSON.stringify(updated));
    api.addComment(newComm).catch(() => {});
    return newComm;
  },

  likeComment(id) {
    const all = this.getAllComments();
    const updated = all.map(c => c.id === id ? { ...c, likes: (c.likes || 1) + 1 } : c);
    safeSetItem(STORAGE_KEYS.COMMENTS, JSON.stringify(updated));
    api.likeComment(id).catch(() => {});
    return updated;
  },

  deleteComment(id) {
    const all = this.getAllComments().filter(c => c.id !== id);
    safeSetItem(STORAGE_KEYS.COMMENTS, JSON.stringify(all));
    api.deleteComment(id).catch(() => {});
    return all;
  },

  // ==========================================
  // SUBSCRIBERS
  // ==========================================
  getSubscribers() {
    const raw = localStorage.getItem(STORAGE_KEYS.SUBSCRIBERS);
    if (!raw) {
      safeSetItem(STORAGE_KEYS.SUBSCRIBERS, JSON.stringify(initialSubscribers));
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
      safeSetItem(STORAGE_KEYS.SUBSCRIBERS, JSON.stringify(updated));
      api.addSubscriber(email, source).catch(() => {});
    }
    return true;
  },

  deleteSubscriber(email) {
    const list = this.getSubscribers().filter(s => s.email.toLowerCase() !== email.toLowerCase());
    safeSetItem(STORAGE_KEYS.SUBSCRIBERS, JSON.stringify(list));
    api.deleteSubscriber(email).catch(() => {});
    return list;
  },

  // ==========================================
  // BOOKMARKS
  // ==========================================
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
    safeSetItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(updated));
    return updated;
  },

  // Reset Data
  resetToDefaults() {
    safeSetItem(STORAGE_KEYS.POSTS, JSON.stringify(initialPosts));
    safeSetItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(initialCategories));
    safeSetItem(STORAGE_KEYS.AUTHORS, JSON.stringify(initialAuthors));
    safeSetItem(STORAGE_KEYS.SETTINGS, JSON.stringify(initialSettings));
    safeSetItem(STORAGE_KEYS.COMMENTS, JSON.stringify(initialComments));
    safeSetItem(STORAGE_KEYS.SUBSCRIBERS, JSON.stringify(initialSubscribers));
    safeSetItem(STORAGE_KEYS.STAFF, JSON.stringify(initialStaffList));
    safeSetItem(STORAGE_KEYS.ACTIVITY_LOGS, JSON.stringify(initialActivityLogs));
    api.resetData().catch(() => {});
  },

  // Auth
  isAdminAuth() {
    return localStorage.getItem(STORAGE_KEYS.ADMIN_AUTH) === 'true';
  },

  setAdminAuth(val) {
    safeSetItem(STORAGE_KEYS.ADMIN_AUTH, val ? 'true' : 'false');
  }
};
