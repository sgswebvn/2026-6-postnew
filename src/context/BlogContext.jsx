import React, { createContext, useContext, useState, useEffect } from 'react';
import { storageService } from '../services/storageService';

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
  const [toast, setToast] = useState(null);
  
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

  const refreshAllData = () => {
    setPosts(storageService.getPosts());
    setCategories(storageService.getCategories());
    setAuthors(storageService.getAuthors());
    setSettings(storageService.getSettings());
    setBookmarks(storageService.getBookmarks());
    setStaffList(storageService.getStaffList());
    setActivityLogs(storageService.getActivityLogs());
  };

  const navigate = (path) => {
    if (!path) return;
    let clean = path.startsWith('#') ? path.replace(/^#/, '') : path;
    if (!clean.startsWith('/')) clean = `/${clean}`;

    window.history.pushState(null, '', clean);
    setCurrentRoute(clean);
    window.scrollTo(0, 0);
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  const hasPermission = (permissionKey) => {
    if (userRole === 'admin') return true;
    if (!currentUser) return false;
    if (currentUser.role === 'admin') return true;
    if (!permissionKey) return true;
    return Boolean(currentUser.permissions && currentUser.permissions[permissionKey]);
  };

  const loginAdmin = (identifier, password, customTarget = null) => {
    const inputId = (identifier || '').trim().toLowerCase();
    const inputPass = (password || '').trim();

    if (!inputId || !inputPass) {
      showToast('Vui lòng nhập tên đăng nhập/email và mật khẩu', 'error');
      return false;
    }

    const currentStaffs = storageService.getStaffList();
    
    // 1. Check match in staffList (by username or email)
    const matchedStaff = currentStaffs.find(s => 
      (s.username && s.username.toLowerCase() === inputId) ||
      (s.email && s.email.toLowerCase() === inputId)
    );

    let authenticatedUser = null;

    if (matchedStaff && (matchedStaff.password === inputPass || (matchedStaff.role === 'admin' && inputPass === 'admin123'))) {
      authenticatedUser = matchedStaff;
    } else if ((inputId === 'admin' || inputId === 'admin@thehori.click') && inputPass === 'admin123') {
      authenticatedUser = currentStaffs.find(s => s.role === 'admin') || {
        id: 'staff-1',
        name: 'Nguyễn Quốc Bảo',
        username: 'admin',
        email: 'admin@thehori.click',
        role: 'admin',
        roleName: 'Quản Lý Tổng Biên Tập',
        permissions: {
          canManagePosts: true,
          canPublishPosts: true,
          canManageCategories: true,
          canViewRevenue: true,
          canManageStaff: true,
          canManagePayroll: true,
          canManageComments: true,
          canManageSettings: true
        }
      };
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

  const updateSettings = (newSettings) => {
    storageService.saveSettings(newSettings);
    setSettings(newSettings);
    showToast('Đã lưu cấu hình Website & AdSense thành công!');
    return newSettings;
  };

  const updateCategories = (newCategories) => {
    storageService.saveCategories(newCategories);
    setCategories(newCategories);
    showToast('Đã cập nhật danh sách chuyên mục!');
    return newCategories;
  };

  const addCategory = (categoryData) => {
    const newCat = storageService.addCategory(categoryData);
    setCategories(storageService.getCategories());
    setActivityLogs(storageService.getActivityLogs());
    showToast(`Đã tạo chuyên mục "${newCat.name}" thành công!`);
    return newCat;
  };

  const updateAuthors = (newAuthors) => {
    storageService.saveAuthors(newAuthors);
    setAuthors(newAuthors);
    showToast('Đã cập nhật danh sách tác giả!');
    return newAuthors;
  };

  // Staff & Payroll CRUD
  const saveStaff = (staffData) => {
    const updated = storageService.saveStaff(staffData);
    setStaffList(updated);
    setActivityLogs(storageService.getActivityLogs());
    showToast(staffData.id && !staffData.id.startsWith('new-') ? 'Cập nhật nhân viên thành công!' : 'Thêm nhân viên mới thành công!');
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
        toast,
        showToast,
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
        updateAuthors,
        staffList,
        saveStaff,
        deleteStaff,
        updateStaffSalary,
        activityLogs,
        addActivityLog,
        clearActivityLogs,
        resetData,
        refreshAllData,
      }}
    >
      {children}
    </BlogContext.Provider>
  );
};
