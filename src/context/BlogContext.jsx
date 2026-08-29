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
    // If user opened with legacy hash (e.g. #/post/slug or #/admin), automatically convert to clean URL
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
  
  // Persist Admin Auth
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(() => {
    const sessionAuth = sessionStorage.getItem('horizon_admin_session');
    const localAuth = localStorage.getItem('horizon_admin_session');
    return sessionAuth === 'true' || localAuth === 'true';
  });
  
  const [userRole, setUserRole] = useState(() => {
    return sessionStorage.getItem('horizon_user_role') || localStorage.getItem('horizon_user_role') || 'admin';
  });

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const sessionUser = sessionStorage.getItem('horizon_current_user');
      const localUser = localStorage.getItem('horizon_current_user');
      if (sessionUser) return JSON.parse(sessionUser);
      if (localUser) return JSON.parse(localUser);
      const isAuth = sessionStorage.getItem('horizon_admin_session') === 'true' || localStorage.getItem('horizon_admin_session') === 'true';
      if (isAuth) {
        const staff = storageService.getStaffList().find(s => s.role === 'admin');
        return staff || {
          id: 'staff-1',
          name: 'Nguyễn Quốc Bảo',
          username: 'admin',
          email: 'admin@thehori.click',
          role: 'admin',
          roleName: 'Quản Lý Tổng Biên Tập'
        };
      }
      return null;
    } catch {
      return null;
    }
  });

  // Enforce Clean Editorial Light Theme (WSJ / Financial Times Standard)
  useEffect(() => {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('horizon_theme', 'light');
  }, []);

  // Initialize data from MongoDB API & Local storage
  useEffect(() => {
    refreshAllData();

    // Async sync with MongoDB Backend
    storageService.initializeFromDB().then((dbData) => {
      if (dbData) {
        if (dbData.posts) setPosts(dbData.posts);
        if (dbData.categories) setCategories(dbData.categories);
        if (dbData.authors) setAuthors(dbData.authors);
        if (dbData.settings) setSettings(dbData.settings);
        if (dbData.staffList) setStaffList(dbData.staffList);
        if (dbData.activityLogs) setActivityLogs(dbData.activityLogs);
      }
    });

    // Listen to history popstate & hash changes for clean routing
    const handleRouteChange = () => {
      setCurrentRoute(getInitialRoute());
      window.scrollTo(0, 0);
    };

    window.addEventListener('popstate', handleRouteChange);
    window.addEventListener('hashchange', handleRouteChange);
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
      window.removeEventListener('hashchange', handleRouteChange);
    };
  }, []);

  // Automatic Seeding Referral Tracker on Route Change
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
      const refCode = urlParams.get('ref') || hashParams.get('ref') || urlParams.get('utm_source');
      
      if (refCode) {
        const result = storageService.recordSeedingHit(refCode, currentRoute || window.location.pathname);
        if (result) {
          if (result.posts) setPosts([...result.posts]);
          if (result.activityLogs) setActivityLogs([...result.activityLogs]);
          if (result.staffList) setStaffList([...result.staffList]);
        }
      }
    } catch {}
  }, [currentRoute]);

  const refreshAllData = () => {
    setPosts(storageService.getPosts());
    setCategories(storageService.getCategories());
    setAuthors(storageService.getAuthors());
    setSettings(storageService.getSettings());
    setBookmarks(storageService.getBookmarks());
    setStaffList(storageService.getStaffList());
    setActivityLogs(storageService.getActivityLogs());
  };

  const incrementPostView = async (slug) => {
    const updated = await storageService.incrementView(slug);
    if (updated) setPosts([...updated]);
  };

  const navigate = (path) => {
    if (!path) return;
    let clean = path.startsWith('#') ? path.replace(/^#/, '') : path;
    if (!clean.startsWith('/')) clean = `/${clean}`;

    window.history.pushState(null, '', clean);
    setCurrentRoute(clean);
    window.scrollTo(0, 0);
  };

  const showToast = (message, type = 'success', title = '', duration = 4000) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const timeStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const newToast = { id, message, type, title, timeStr, duration };
    setToasts(prev => [newToast, ...prev].slice(0, 4));

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const showConfirm = ({ title, message, confirmText = 'Xác Nhận', cancelText = 'Hủy Bỏ', variant = 'danger', onConfirm }) => {
    setDialog({
      type: 'confirm',
      title,
      message,
      confirmText,
      cancelText,
      variant,
      onConfirm
    });
  };

  const showPrompt = ({ title, message, inputLabel, placeholder, defaultValue = '', confirmText = 'Xác Nhận', cancelText = 'Hủy Bỏ', onConfirm }) => {
    setDialog({
      type: 'prompt',
      title,
      message,
      inputLabel,
      placeholder,
      defaultValue,
      confirmText,
      cancelText,
      onConfirm
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
    const inputId = (identifier || '').trim().toLowerCase();
    const inputPass = (password || '').trim();

    if (!inputId || !inputPass) {
      showToast('Vui lòng nhập tên đăng nhập/email và mật khẩu', 'error');
      return false;
    }

    let authenticatedUser = null;

    try {
      // API call to backend auth
      const response = await api.loginAdmin(inputId, inputPass);
      if (response && response.success && response.staff) {
        authenticatedUser = response.staff;
      }
    } catch (error) {
      console.error('Login failed', error);
    }

    if (authenticatedUser) {
      setIsAdminAuthenticated(true);
      setUserRole(authenticatedUser.role || 'editor');
      setCurrentUser(authenticatedUser);
      
      sessionStorage.setItem('horizon_admin_session', 'true');
      localStorage.setItem('horizon_admin_session', 'true');
      sessionStorage.setItem('horizon_user_role', authenticatedUser.role || 'editor');
      localStorage.setItem('horizon_user_role', authenticatedUser.role || 'editor');
      sessionStorage.setItem('horizon_current_user', JSON.stringify(authenticatedUser));
      localStorage.setItem('horizon_current_user', JSON.stringify(authenticatedUser));

      // Record Activity Log
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
      
      const destination = customTarget || (currentRoute && currentRoute.startsWith('/admin') ? currentRoute : (authenticatedUser.role === 'admin' ? '/admin' : '/admin/posts'));
      navigate(destination);
      return true;
    }

    showToast('Tài khoản hoặc mật khẩu không chính xác!', 'error');
    return false;
  };

  const logoutAdmin = () => {
    setIsAdminAuthenticated(false);
    setUserRole('admin');
    setCurrentUser(null);
    sessionStorage.removeItem('horizon_admin_session');
    localStorage.removeItem('horizon_admin_session');
    sessionStorage.removeItem('horizon_user_role');
    localStorage.removeItem('horizon_user_role');
    sessionStorage.removeItem('horizon_current_user');
    localStorage.removeItem('horizon_current_user');
    showToast('Đã đăng xuất khỏi trang Quản trị', 'info');
    navigate('/');
  };

  // CRUD Operations
  const savePost = async (postData) => {
    const updated = await storageService.savePost(postData);
    setPosts(updated);
    setActivityLogs(storageService.getActivityLogs());
    showToast(postData.id && !postData.id.startsWith('new-') ? 'Cập nhật bài viết thành công!' : 'Đã xuất bản bài viết mới!');
    return updated;
  };

  const deletePost = async (id) => {
    const updated = await storageService.deletePost(id);
    setPosts(updated);
    showToast('Đã xóa bài viết khỏi hệ thống', 'info');
    return updated;
  };

  const updateSettings = async (newSettings) => {
    await storageService.saveSettings(newSettings);
    setSettings(newSettings);
    showToast('Đã lưu cấu hình Website & AdSense thành công!');
    return newSettings;
  };

  const updateCategories = async (newCategories) => {
    await storageService.saveCategories(newCategories);
    setCategories(newCategories);
    showToast('Đã cập nhật danh sách chuyên mục!');
    return newCategories;
  };

  const addCategory = async (categoryData) => {
    const newCat = await storageService.addCategory(categoryData);
    setCategories(storageService.getCategories());
    setActivityLogs(storageService.getActivityLogs());
    showToast(`Đã tạo chuyên mục "${newCat.name}" thành công!`);
    return newCat;
  };

  const deleteCategory = async (id) => {
    const updated = await storageService.deleteCategory(id);
    setCategories(updated);
    showToast('Đã xóa chuyên mục khỏi hệ thống', 'info');
    return updated;
  };

  const updateAuthors = async (newAuthors) => {
    await storageService.saveAuthors(newAuthors);
    setAuthors(newAuthors);
    showToast('Đã cập nhật danh sách tác giả!');
    return newAuthors;
  };

  const addAuthor = async (authorData) => {
    const newAuthor = await storageService.addAuthor(authorData);
    setAuthors(storageService.getAuthors());
    showToast(`Đã thêm tác giả "${newAuthor.name}" thành công!`, 'success');
    return newAuthor;
  };

  const deleteAuthor = async (id) => {
    const updated = await storageService.deleteAuthor(id);
    setAuthors(updated);
    showToast('Đã xóa tác giả khỏi danh sách', 'info');
    return updated;
  };

  // Staff & Payroll CRUD
  const saveStaff = (staffData, customToast = null) => {
    const isNew = !staffList.some(s => s.id === staffData.id);
    const updated = storageService.saveStaff(staffData);
    setStaffList(updated);
    setActivityLogs(storageService.getActivityLogs());
    if (customToast !== false) {
      showToast(customToast || (isNew ? `Đã thêm mới nhân sự "${staffData.name}" thành công!` : `Đã lưu cập nhật hồ sơ "${staffData.name}"!`), 'success');
    }
    return updated;
  };

  const deleteStaff = (id) => {
    const updated = storageService.deleteStaff(id);
    setStaffList(updated);
    showToast('Đã xóa nhân sự khỏi danh sách', 'info');
    return updated;
  };

  const updateStaffSalary = (id, salaryData) => {
    const updated = storageService.updateStaffSalary(id, salaryData);
    setStaffList(updated);
    setActivityLogs(storageService.getActivityLogs());
    showToast('Đã cập nhật phiếu lương nhân viên thành công!');
    return updated;
  };

  const addActivityLog = (logItem) => {
    const updated = storageService.addActivityLog(logItem);
    setActivityLogs(updated);
    return updated;
  };

  const clearActivityLogs = () => {
    storageService.clearActivityLogs();
    setActivityLogs([]);
    showToast('Đã làm sạch lịch sử hoạt động', 'info');
  };

  const toggleBookmark = (slug) => {
    const updated = storageService.toggleBookmark(slug);
    setBookmarks(updated);
    if (updated.includes(slug)) {
      showToast('Saved to reading list!');
    } else {
      showToast('Removed from reading list', 'info');
    }
    return updated;
  };

  const resetData = () => {
    storageService.resetToDefaults();
    refreshAllData();
    showToast('Đã khôi phục bộ dữ liệu mẫu chuẩn Mỹ!');
  };

  return (
    <BlogContext.Provider
      value={{
        posts,
        categories,
        authors,
        settings,
        bookmarks,
        toggleBookmark,
        currentRoute,
        navigate,
        searchOpen,
        setSearchOpen,
        setIsSearchOpen: setSearchOpen,
        toasts,
        showToast,
        removeToast,
        dialog,
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
        staffList,
        saveStaff,
        deleteStaff,
        updateStaffSalary,
        activityLogs,
        addActivityLog,
        clearActivityLogs,
        resetData,
        refreshAllData,
        incrementPostView,
      }}
    >
      {children}
    </BlogContext.Provider>
  );
};
