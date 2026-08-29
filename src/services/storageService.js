import { api } from './api.js';
import { initialPosts, initialCategories, initialAuthors, initialSettings, initialComments, initialSubscribers } from '../../server/seedData.js';

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

// initialStaffList and initialActivityLogs moved to server/seedData.js

export const storageService = {
  // Sync all with MongoDB on boot
  async initializeFromDB() {
    try {
      const [posts, categories, authors, settings, referrals, staffList, activityLogs] = await Promise.all([
        api.getPosts(),
        api.getCategories(),
        api.getAuthors(),
        api.getSettings(),
        api.getReferrals(),
        api.getStaffList(),
        api.getActivityLogs()
      ]);

      if (posts && posts.length > 0) localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(posts));
      if (categories && categories.length > 0) localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
      if (authors && authors.length > 0) localStorage.setItem(STORAGE_KEYS.AUTHORS, JSON.stringify(authors));
      if (settings && settings.siteName) localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
      if (staffList && staffList.length > 0) localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(staffList));
      if (activityLogs && activityLogs.length > 0) localStorage.setItem(STORAGE_KEYS.ACTIVITY_LOGS, JSON.stringify(activityLogs));
      
      if (referrals) {
        localStorage.setItem('horizon_staff_referrals_v2', JSON.stringify(referrals));
      }

      return { posts, categories, authors, settings, referrals, staffList, activityLogs };
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
      const list = JSON.parse(raw);
      // Optional cache bust for old images: if any image is old, force refresh from initialPosts
      if (Array.isArray(list) && list.some(p => p.coverImage && p.coverImage.includes('/images/'))) {
        localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(initialPosts));
        return initialPosts;
      }
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
        publishedAt: post.publishedAt || new Date().toISOString(),
        views: post.views || 0
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
    }

    localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(updated));
    return updated;
  },

  async deletePost(id) {
    try {
      await api.deletePost(id);
    } catch (err) {
      console.warn('Backend deletePost fallback:', err);
    }
    const posts = this.getPosts().filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(posts));
    return posts;
  },

  async incrementView(slug) {
    if (!slug) return this.getPosts();
    const posts = this.getPosts();
    const target = posts.find(p => p.slug === slug);
    if (target) {
      target.views = (target.views || 0) + 1;
      localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(posts));
      api.incrementView(slug).catch(() => {});
    }
    return posts;
  },

  getReferralHits() {
    try {
      return JSON.parse(localStorage.getItem('horizon_staff_referrals_v2') || '{"QB": 18, "MINH": 12, "AN": 9, "LINH": 6}');
    } catch {
      return { "QB": 18, "MINH": 12, "AN": 9, "LINH": 6 };
    }
  },

  async recordSeedingHit(refCode, path = '/') {
    if (!refCode) return;
    const cleanRef = refCode.toUpperCase().trim();
    
    // Call Backend API to increment globally
    let globalRefs = await api.recordSeedingHit(cleanRef);
    
    // Fallback or update local map
    const REFERRALS_KEY = 'horizon_staff_referrals_v2';
    let referrals = {};
    if (globalRefs) {
      referrals = globalRefs;
    } else {
      try {
        referrals = JSON.parse(localStorage.getItem(REFERRALS_KEY) || '{"QB": 18, "MINH": 12, "AN": 9, "LINH": 6}');
      } catch {
        referrals = { "QB": 18, "MINH": 12, "AN": 9, "LINH": 6 };
      }
      referrals[cleanRef] = (referrals[cleanRef] || 0) + 1;
    }
    localStorage.setItem(REFERRALS_KEY, JSON.stringify(referrals));

    // 2. Find matching staff and update direct referral hits & KPI bonus
    const staffList = this.getStaffList();
    let matchedStaff = null;
    const updatedStaffList = staffList.map(s => {
      if (s.refCode && s.refCode.toUpperCase() === cleanRef) {
        matchedStaff = s;
        const hits = referrals[cleanRef] || (s.seedingHits || 0) + 1;
        const currentBase = Number(s.salary?.baseSalary || 10000000);
        const currentDeduction = Number(s.salary?.deduction || 0);
        const currentKpi = (s.salary?.kpiBonus || 0) + 500;
        return {
          ...s,
          seedingHits: hits,
          salary: {
            ...s.salary,
            baseSalary: currentBase,
            kpiBonus: currentKpi,
            deduction: currentDeduction,
            netSalary: Math.max(0, currentBase + currentKpi - currentDeduction)
          }
        };
      }
      return s;
    });
    localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(updatedStaffList));

    // 3. If on a post, increment post views
    let targetPost = null;
    let postSlug = '';
    if (path.includes('/post/')) {
      postSlug = path.split('/post/')[1]?.split('?')[0];
    }
    if (postSlug) {
      const posts = this.getPosts();
      targetPost = posts.find(p => p.slug === postSlug);
      if (targetPost) {
        targetPost.views = (targetPost.views || 0) + 1;
        localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(posts));
        api.incrementView(postSlug).catch(() => {});
      }
    }

    // 4. Record Activity Log
    this.addActivityLog({
      staffId: matchedStaff?.id || 'seeding-visitor',
      staffName: matchedStaff?.name || `Mã Ref: ${cleanRef}`,
      refCode: cleanRef,
      action: 'seeding',
      title: `Ghi nhận +1 lượt đọc Seeding (?ref=${cleanRef})`,
      details: targetPost 
        ? `Độc giả đọc bài "${targetPost.title.slice(0, 45)}..." qua link của ${matchedStaff?.name || cleanRef}` 
        : `Độc giả truy cập trang ${path} qua link Seeding của ${matchedStaff?.name || cleanRef}`,
      type: 'success'
    });

    return { 
      referrals, 
      posts: this.getPosts(), 
      staffList: updatedStaffList, 
      activityLogs: this.getActivityLogs() 
    };
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

  async saveCategories(categories) {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
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
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(updated));
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
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
    return categories;
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

  async saveAuthors(authors) {
    localStorage.setItem(STORAGE_KEYS.AUTHORS, JSON.stringify(authors));
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
    localStorage.setItem(STORAGE_KEYS.AUTHORS, JSON.stringify(updated));
    return newAuthor;
  },

  async deleteAuthor(id) {
    try {
      await api.deleteAuthor(id);
    } catch (err) {
      console.warn('Backend deleteAuthor fallback:', err);
    }
    const authors = this.getAuthors().filter(a => a.id !== id);
    localStorage.setItem(STORAGE_KEYS.AUTHORS, JSON.stringify(authors));
    return authors;
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

  async saveSettings(settings) {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    try {
      await api.updateSettings(settings);
    } catch (err) {
      console.warn('Backend updateSettings fallback:', err);
    }
  },

  // Staff & Payroll Management
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

  saveStaff(staffMember) {
    const list = this.getStaffList();
    const existingIndex = list.findIndex(s => s.id === staffMember.id);
    let updated;
    let isNew = false;
    
    if (existingIndex === -1) {
      isNew = true;
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
      api.addStaff(newStaff).catch(() => {});
      this.addActivityLog({
        staffName: 'Quản Trị Viên',
        action: 'staff_add',
        title: 'Thêm nhân sự mới',
        details: `Thêm nhân viên: ${newStaff.name} (${newStaff.roleName || newStaff.role})`,
        type: 'success'
      });
    } else {
      updated = list.map(s => s.id === staffMember.id ? { ...s, ...staffMember } : s);
      api.updateStaff(staffMember.id, staffMember).catch(() => {});
      this.addActivityLog({
        staffName: 'Quản Trị Viên',
        action: 'staff_update',
        title: 'Cập nhật hồ sơ nhân sự',
        details: `Cập nhật thông tin nhân viên: ${staffMember.name}`,
        type: 'neutral'
      });
    }
    localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(updated));
    return updated;
  },

  deleteStaff(id) {
    const list = this.getStaffList().filter(s => s.id !== id);
    localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(list));
    api.deleteStaff(id).catch(() => {});
    return list;
  },

  updateStaffSalary(id, salaryData) {
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
    localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(updated));
    if (targetStaff) {
      api.updateStaff(targetStaff.id, targetStaff).catch(() => {});
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

  // Activity Logs
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
    localStorage.setItem(STORAGE_KEYS.ACTIVITY_LOGS, JSON.stringify(updated));
    api.addActivityLog(newLog).catch(() => {});
    return updated;
  },

  clearActivityLogs() {
    localStorage.setItem(STORAGE_KEYS.ACTIVITY_LOGS, JSON.stringify([]));
    api.deleteActivityLogs && api.deleteActivityLogs().catch(() => {});
    return [];
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
      avatar: commentData.avatar || 'https://mmltqgekvpdnezqdavvc.supabase.co/storage/v1/object/public/postnew/uploads/post_img_30.jpg',
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
    localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(initialStaffList));
    localStorage.setItem(STORAGE_KEYS.ACTIVITY_LOGS, JSON.stringify(initialActivityLogs));
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
