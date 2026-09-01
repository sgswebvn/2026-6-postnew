import React, { createContext, useContext, useState, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { api } from '../services/api';

const BlogContext = createContext();

export const useBlog = () => {
  const context = useContext(BlogContext);
  if (!context) {
    throw new Error('useBlog must be used within a BlogProvider');
  }
  return context;
};

export const BlogProvider = ({ children }) => {
  // Global Data State
  const [posts, setPosts] = useState(() => storageService.getPosts());
  const [categories, setCategories] = useState(() => storageService.getCategories());
  const [authors, setAuthors] = useState(() => storageService.getAuthors());
  const [settings, setSettings] = useState(() => storageService.getSettings());
  const [bookmarks, setBookmarks] = useState(() => storageService.getBookmarks());
  const [staffList, setStaffList] = useState(() => storageService.getStaffList());
  const [activityLogs, setActivityLogs] = useState(() => storageService.getActivityLogs());

  const getInitialRoute = () => {
    if (typeof window === 'undefined') return '/';
    if (window.location.hash && window.location.hash.startsWith('#/')) {
      const clean = window.location.hash.replace(/^#/, '');
      window.history.replaceState(null, '', clean);
      return clean;
    }
    if (window.location.hash && window.location.hash === '#admin') {
      window.history.replaceState(null, '', '/admin');
      return '/admin';
    }
    return window.location.pathname || '/';
  };

  const [currentRoute, setCurrentRoute] = useState(getInitialRoute);
  const [searchOpen, setSearchOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [dialog, setDialog] = useState(null);
  
  // Persist Admin Auth (Server-verified via Token)
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(() => {
    const token = localStorage.getItem('horizon_auth_token') || sessionStorage.getItem('horizon_auth_token');
    return Boolean(token);
  });
  
  const [userRole, setUserRole] = useState(() => {
    return sessionStorage.getItem('horizon_user_role') || localStorage.getItem('horizon_user_role') || 'editor';
  });

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const sessionUser = sessionStorage.getItem('horizon_current_user') || localStorage.getItem('horizon_current_user');
      if (sessionUser) return JSON.parse(sessionUser);
      return null;
    } catch {
      return null;
    }
  });

  // Enforce Clean Editorial Light Theme
  useEffect(() => {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('horizon_theme', 'light');
  }, []);

  // Initialize data from MongoDB API & verify session token
  useEffect(() => {
    refreshAllData();

    // Verify session token against server. Only log out on a real 401.
    // Network/503 must not wipe a still-valid local session.
    const token = localStorage.getItem('horizon_auth_token') || sessionStorage.getItem('horizon_auth_token');
    if (token) {
      api.getMe().then(result => {
        if (result?.ok && result.user) {
          const user = result.user;
          setIsAdminAuthenticated(true);
          setUserRole(user.role || 'editor');
          setCurrentUser(user);
        } else if (result?.unauthorized) {
          api.logout();
          setIsAdminAuthenticated(false);
          setCurrentUser(null);
        }
      }).catch(() => {});
    }

    // Async sync with MongoDB Backend
    storageService.initializeFromDB().then((freshData) => {
      if (freshData) {
        if (Array.isArray(freshData.posts)) setPosts(freshData.posts);
        if (Array.isArray(freshData.categories)) setCategories(freshData.categories);
        if (Array.isArray(freshData.authors)) setAuthors(freshData.authors);
        if (Array.isArray(freshData.staffList)) setStaffList(freshData.staffList);
        if (freshData.settings) setSettings(freshData.settings);
      }
      refreshAllData();
    });
  }, []);

  const refreshAllData = () => {
    const freshPosts = storageService.getPosts();
    const freshCategories = storageService.getCategories();
    const freshAuthors = storageService.getAuthors();
    const freshSettings = storageService.getSettings();
    const freshStaff = storageService.getStaffList();
    const freshBookmarks = storageService.getBookmarks();
    const freshLogs = storageService.getActivityLogs();

    setPosts(freshPosts);
    setCategories(freshCategories);
    setAuthors(freshAuthors);
    setSettings(freshSettings);
    setStaffList(freshStaff);
    setBookmarks(freshBookmarks);
    setActivityLogs(freshLogs);

    // Sync currentUser if updated in staffList. Do not overwrite a logged-in
    // session with the public staff projection (no role / username / permissions).
    try {
      const savedUserStr = localStorage.getItem('horizon_current_user') || sessionStorage.getItem('horizon_current_user');
      const savedUser = savedUserStr ? JSON.parse(savedUserStr) : null;
      if (savedUser && Array.isArray(freshStaff)) {
        const found = freshStaff.find(s => s.id === savedUser.id || (s.username && s.username === savedUser.username));
        const isFullRecord = Boolean(found && (found.role || found.username || found.permissions));
        if (isFullRecord) {
          const merged = { ...savedUser, ...found, role: found.role || savedUser.role };
          setCurrentUser(merged);
          localStorage.setItem('horizon_current_user', JSON.stringify(merged));
          sessionStorage.setItem('horizon_current_user', JSON.stringify(merged));
        }
      }
    } catch (e) {}
  };

  // Sync route on popstate
  useEffect(() => {
    const handlePopState = () => {
      let path = window.location.pathname;
      if (window.location.hash && window.location.hash.startsWith('#/')) {
        path = window.location.hash.replace(/^#/, '');
        window.history.replaceState(null, '', path);
      }
      setCurrentRoute(path || '/');
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path) => {
    if (currentRoute === path) return;
    window.history.pushState(null, '', path);
    setCurrentRoute(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const showToast = (message, type = 'success', duration = 3500) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type, duration }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const showDialog = (options = {}) => {
    const {
      title,
      message,
      type,
      variant,
      confirmText = 'Xác nhận',
      cancelText = 'Hủy',
      onConfirm,
      inputLabel,
      placeholder,
      defaultValue,
      showCancel
    } = options;

    const resolvedType = type || (variant === 'danger' ? 'danger' : variant) || 'danger';

    setDialog({
      title,
      message,
      type: resolvedType,
      variant: variant || resolvedType,
      confirmText,
      cancelText,
      onConfirm,
      inputLabel,
      placeholder,
      defaultValue,
      showCancel
    });
  };

  const showConfirm = (options = {}) => {
    showDialog({
      ...options,
      type: options.type || options.variant || 'danger',
      variant: options.variant || options.type || 'danger'
    });
  };

  const showPrompt = (options = {}) => {
    showDialog({
      ...options,
      type: 'prompt'
    });
  };

  const closeDialog = () => {
    setDialog(null);
  };

  const hasPermission = (permissionKey) => {
    if (userRole === 'admin') return true;
    if (!currentUser) return false;
    if (currentUser.role === 'admin') return true;
    if (!permissionKey) return true;
    return Boolean(currentUser.permissions && currentUser.permissions[permissionKey]);
  };

  const loginAdmin = async (identifier, password, customTarget = null) => {
    const inputId = (identifier || '').trim();
    const inputPass = (password || '').trim();

    if (!inputId || !inputPass) {
      showToast('Vui lòng nhập tên đăng nhập/email và mật khẩu', 'error');
      return false;
    }

    try {
      const response = await api.loginAdmin(inputId, inputPass);
      if (response && response.success && response.user) {
        const authenticatedUser = response.user;
        setIsAdminAuthenticated(true);
        setUserRole(authenticatedUser.role || 'editor');
        setCurrentUser(authenticatedUser);

        storageService.addActivityLog({
          staffId: authenticatedUser.id,
          staffName: authenticatedUser.name,
          refCode: authenticatedUser.refCode || '',
          action: 'login',
          title: 'Đăng nhập hệ thống',
          details: `Nhân viên ${authenticatedUser.name} (${authenticatedUser.roleName || authenticatedUser.role}) đã đăng nhập thành công.`,
          type: 'info'
        });
        setActivityLogs(storageService.getActivityLogs());

        showToast(`Chào mừng ${authenticatedUser.name} (${authenticatedUser.roleName || authenticatedUser.role})!`, 'success');

        storageService.initializeFromDB().then((freshData) => {
          if (!freshData) return;
          if (Array.isArray(freshData.posts)) setPosts(freshData.posts);
          if (Array.isArray(freshData.categories)) setCategories(freshData.categories);
          if (Array.isArray(freshData.authors)) setAuthors(freshData.authors);
          if (Array.isArray(freshData.staffList)) setStaffList(freshData.staffList);
          if (freshData.settings) setSettings(freshData.settings);
        }).catch(() => {});
        
        const destination = customTarget || (currentRoute && currentRoute.startsWith('/admin') ? currentRoute : (authenticatedUser.role === 'admin' ? '/admin' : '/admin/posts'));
        navigate(destination);
        return true;
      }
    } catch (error) {
      showToast(error.message || 'Tài khoản hoặc mật khẩu không chính xác!', 'error');
      return false;
    }

    showToast('Tài khoản hoặc mật khẩu không chính xác!', 'error');
    return false;
  };

  const logoutAdmin = () => {
    api.logout();
    setIsAdminAuthenticated(false);
    setUserRole('editor');
    setCurrentUser(null);
    showToast('Đã đăng xuất khỏi trang Quản trị', 'info');
    navigate('/');
  };

  // CRUD Operations with Strict Error Propagation (Zero False Success)
  const savePost = async (postData) => {
    try {
      const updated = await storageService.savePost(postData);
      setPosts(updated);
      setActivityLogs(storageService.getActivityLogs());
      showToast(postData.id && !postData.id.startsWith('new-') ? 'Cập nhật bài viết thành công!' : 'Đã xuất bản bài viết mới!', 'success');
      return updated;
    } catch (error) {
      showToast(`❌ Không thể lưu bài viết: ${error.message}`, 'error');
      throw error;
    }
  };

  const deletePost = async (id) => {
    try {
      const updated = await storageService.deletePost(id);
      setPosts(updated);
      showToast('Đã xóa bài viết khỏi hệ thống', 'info');
      return updated;
    } catch (error) {
      showToast(`❌ Không thể xóa bài viết: ${error.message}`, 'error');
      throw error;
    }
  };

  const updateSettings = async (newSettings) => {
    try {
      await storageService.saveSettings(newSettings);
      setSettings(newSettings);
      showToast('Đã lưu cấu hình Website & AdSense thành công!', 'success');
      return newSettings;
    } catch (error) {
      showToast(`❌ Không thể lưu cấu hình: ${error.message}`, 'error');
      throw error;
    }
  };

  const updateCategories = async (newCategories) => {
    try {
      await storageService.saveCategories(newCategories);
      setCategories(newCategories);
      showToast('Đã cập nhật danh sách chuyên mục!', 'success');
      return newCategories;
    } catch (error) {
      showToast(`❌ Không thể cập nhật chuyên mục: ${error.message}`, 'error');
      throw error;
    }
  };

  const addCategory = async (categoryData) => {
    try {
      const newCat = await storageService.addCategory(categoryData);
      setCategories(storageService.getCategories());
      setActivityLogs(storageService.getActivityLogs());
      showToast(`Đã tạo chuyên mục "${categoryData.name}" thành công!`, 'success');
      return newCat;
    } catch (error) {
      showToast(`❌ Không thể tạo chuyên mục: ${error.message}`, 'error');
      throw error;
    }
  };

  const deleteCategory = async (id) => {
    try {
      const updated = await storageService.deleteCategory(id);
      setCategories(updated);
      showToast('Đã xóa chuyên mục khỏi hệ thống', 'info');
      return updated;
    } catch (error) {
      showToast(`❌ Không thể xóa chuyên mục: ${error.message}`, 'error');
      throw error;
    }
  };

  const updateAuthors = async (newAuthors) => {
    try {
      await storageService.saveAuthors(newAuthors);
      setAuthors(newAuthors);
      showToast('Đã cập nhật danh sách tác giả!', 'success');
      return newAuthors;
    } catch (error) {
      showToast(`❌ Không thể lưu tác giả: ${error.message}`, 'error');
      throw error;
    }
  };

  const addAuthor = async (authorData) => {
    try {
      const newAuthor = await storageService.addAuthor(authorData);
      setAuthors(storageService.getAuthors());
      showToast(`Đã thêm tác giả "${authorData.name}" thành công!`, 'success');
      return newAuthor;
    } catch (error) {
      showToast(`❌ Không thể thêm tác giả: ${error.message}`, 'error');
      throw error;
    }
  };

  const deleteAuthor = async (id) => {
    try {
      const updated = await storageService.deleteAuthor(id);
      setAuthors(updated);
      showToast('Đã xóa tác giả khỏi danh sách', 'info');
      return updated;
    } catch (error) {
      showToast(`❌ Không thể xóa tác giả: ${error.message}`, 'error');
      throw error;
    }
  };

  const saveStaff = async (staffMember) => {
    try {
      const updated = await storageService.saveStaff(staffMember);
      setStaffList(updated);

      // Immediately sync currentUser in state and localStorage if updating own profile
      if (currentUser && (currentUser.id === staffMember.id || (currentUser.username && currentUser.username === staffMember.username))) {
        const syncedUser = { ...currentUser, ...staffMember };
        setCurrentUser(syncedUser);
        try {
          localStorage.setItem('horizon_current_user', JSON.stringify(syncedUser));
          sessionStorage.setItem('horizon_current_user', JSON.stringify(syncedUser));
        } catch (e) {}
      }

      setActivityLogs(storageService.getActivityLogs());
      showToast(`Đã cập nhật hồ sơ "${staffMember.name}" thành công!`, 'success');
      return updated;
    } catch (error) {
      showToast(`❌ Không thể lưu thông tin nhân sự: ${error.message}`, 'error');
      throw error;
    }
  };

  const deleteStaff = async (id) => {
    try {
      const updated = await storageService.deleteStaff(id);
      setStaffList(updated);
      showToast('Đã xóa nhân sự khỏi hệ thống', 'info');
      return updated;
    } catch (error) {
      showToast(`❌ Không thể xóa nhân sự: ${error.message}`, 'error');
      throw error;
    }
  };

  const updateStaffSalary = async (id, salaryData) => {
    try {
      const updated = await storageService.updateStaffSalary(id, salaryData);
      setStaffList(updated);
      setActivityLogs(storageService.getActivityLogs());
      showToast('Đã cập nhật phiếu lương thành công!', 'success');
      return updated;
    } catch (error) {
      showToast(`❌ Không thể cập nhật lương: ${error.message}`, 'error');
      throw error;
    }
  };

  const toggleBookmark = (slug) => {
    const updated = storageService.toggleBookmark(slug);
    setBookmarks(updated);
    const isNowSaved = updated.includes(slug);
    showToast(isNowSaved ? 'Đã lưu bài viết vào danh sách đọc sau' : 'Đã bỏ lưu bài viết', 'info');
  };

  const isBookmarked = (slug) => {
    return bookmarks.includes(slug);
  };

  const addComment = async (slug, comment) => {
    try {
      const newComment = await storageService.addComment(slug, comment);
      showToast('Bình luận của bạn đã được đăng thành công!', 'success');
      return newComment;
    } catch (error) {
      showToast(`❌ Không thể đăng bình luận: ${error.message}`, 'error');
      throw error;
    }
  };

  const likeComment = async (commentId) => {
    await storageService.likeComment(commentId);
  };

  const deleteComment = async (commentId) => {
    try {
      await storageService.deleteComment(commentId);
      showToast('Đã xóa bình luận', 'info');
    } catch (error) {
      showToast(`❌ Không thể xóa bình luận: ${error.message}`, 'error');
    }
  };

  const addSubscriber = async (email, source) => {
    try {
      const res = await storageService.addSubscriber(email, source);
      if (res.success) {
        showToast(res.message, 'success');
      } else {
        showToast(res.message, 'error');
      }
      return res;
    } catch (error) {
      showToast(`❌ Lỗi đăng ký: ${error.message}`, 'error');
      return { success: false, message: error.message };
    }
  };

  const deleteSubscriber = async (email) => {
    try {
      await storageService.deleteSubscriber(email);
      showToast(`Đã hủy đăng ký cho ${email}`, 'info');
    } catch (error) {
      showToast(`❌ Lỗi: ${error.message}`, 'error');
    }
  };

  const resetAllData = async () => {
    try {
      await api.resetData();
      localStorage.clear();
      sessionStorage.clear();
      refreshAllData();
      showToast('Đã khôi phục dữ liệu gốc thành công!', 'warning');
      navigate('/');
    } catch (error) {
      showToast(`❌ Không thể reset dữ liệu: ${error.message}`, 'error');
    }
  };

  const incrementPostView = (slug) => {
    if (!slug) return;
    storageService.incrementView(slug);
  };

  const clearActivityLogs = () => {
    const updated = storageService.clearActivityLogs();
    setActivityLogs(updated);
    showToast('Đã làm sạch nhật ký hoạt động', 'info');
  };

  return (
    <BlogContext.Provider value={{
      posts,
      categories,
      authors,
      settings,
      staffList,
      bookmarks,
      activityLogs,
      currentRoute,
      navigate,
      searchOpen,
      setSearchOpen,
      toasts,
      showToast,
      removeToast,
      dialog,
      showDialog,
      showConfirm,
      showPrompt,
      closeDialog,
      isAdminAuthenticated,
      userRole,
      currentUser,
      hasPermission,
      loginAdmin,
      logoutAdmin,
      savePost,
      deletePost,
      updateSettings,
      updateCategories,
      addCategory,
      deleteCategory,
      updateAuthors,
      addAuthor,
      deleteAuthor,
      saveStaff,
      deleteStaff,
      updateStaffSalary,
      toggleBookmark,
      isBookmarked,
      addComment,
      likeComment,
      deleteComment,
      addSubscriber,
      deleteSubscriber,
      resetAllData,
      resetData: resetAllData,
      refreshAllData,
      incrementPostView,
      clearActivityLogs
    }}>
      {children}
    </BlogContext.Provider>
  );
};
