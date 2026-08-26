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
  // Theme state: dark / light
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('horizon_theme');
    if (saved) return saved === 'dark';
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Global Data State
  const [posts, setPosts] = useState(() => storageService.getPosts());
  const [categories, setCategories] = useState(() => storageService.getCategories());
  const [authors, setAuthors] = useState(() => storageService.getAuthors());
  const [settings, setSettings] = useState(() => storageService.getSettings());
  const [bookmarks, setBookmarks] = useState(() => storageService.getBookmarks());
  const [currentRoute, setCurrentRoute] = useState(window.location.hash || '#/');
  const [searchOpen, setSearchOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(() => {
    return sessionStorage.getItem('horizon_admin_session') === 'true';
  });

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

    // Listen to hash changes for routing
    const handleHashChange = () => {
      setCurrentRoute(window.location.hash || '#/');
      window.scrollTo(0, 0);
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Sync theme with DOM
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('horizon_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('horizon_theme', 'light');
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(prev => !prev);

  const refreshAllData = () => {
    setPosts(storageService.getPosts());
    setCategories(storageService.getCategories());
    setAuthors(storageService.getAuthors());
    setSettings(storageService.getSettings());
    setBookmarks(storageService.getBookmarks());
  };

  const navigate = (path) => {
    window.location.hash = path.startsWith('#') ? path : `#${path}`;
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  const loginAdmin = (password) => {
    if (password === 'admin123' || password === 'horizon2026') {
      setIsAdminAuthenticated(true);
      sessionStorage.setItem('horizon_admin_session', 'true');
      showToast('Đăng nhập Quản trị viên thành công!', 'success');
      return true;
    }
    showToast('Mã bảo mật không đúng (Mặc định: admin123)', 'error');
    return false;
  };

  const logoutAdmin = () => {
    setIsAdminAuthenticated(false);
    sessionStorage.removeItem('horizon_admin_session');
    showToast('Đã đăng xuất khỏi trang Quản trị', 'info');
    navigate('#/');
  };

  // CRUD Operations
  const savePost = async (postData) => {
    const updated = await storageService.savePost(postData);
    setPosts(updated);
    showToast(postData.id ? 'Cập nhật bài viết thành công!' : 'Đã xuất bản bài viết mới!');
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

  const updateAuthors = (newAuthors) => {
    storageService.saveAuthors(newAuthors);
    setAuthors(newAuthors);
    showToast('Đã cập nhật danh sách tác giả!');
    return newAuthors;
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
        darkMode,
        toggleDarkMode,
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
        loginAdmin,
        logoutAdmin,
        savePost,
        deletePost,
        updateSettings,
        updateCategories,
        updateAuthors,
        resetData,
        refreshAllData,
      }}
    >
      {children}
    </BlogContext.Provider>
  );
};
