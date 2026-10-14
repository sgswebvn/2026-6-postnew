import React, { useEffect, useState } from 'react';
import { api, setStoredToken, getStoredToken } from './api/client';
import AdminLayout from './components/admin/AdminLayout';
import AdminDashboard from './components/admin/AdminDashboard';
import AdminPosts from './components/admin/AdminPosts';
import AdminPostForm from './components/admin/AdminPostForm';
import AdminCategories from './components/admin/AdminCategories';
import AdminAnalytics from './components/admin/AdminAnalytics';
import AdminScripts from './components/admin/AdminScripts';
import AdminStaff from './components/admin/AdminStaff';
import AdminSettings from './components/admin/AdminSettings';
import LoginPage from './pages/LoginPage';
import PublicNavbar from './components/public/PublicNavbar';
import PublicFooter from './components/public/PublicFooter';
import HomePage from './components/public/HomePage';
import PostDetailPage from './components/public/PostDetailPage';
import CategoryPage from './components/public/CategoryPage';
import SearchPage from './components/public/SearchPage';
import AboutPage from './components/public/AboutPage';
import ContactPage from './components/public/ContactPage';
import PrivacyPolicyPage from './components/public/PrivacyPolicyPage';
import TermsPage from './components/public/TermsPage';
import CookiePolicyPage from './components/public/CookiePolicyPage';
import NotFoundPage from './components/public/NotFoundPage';
import ScriptInjector from './components/public/ScriptInjector';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export default function App() {
  // Current browser URL pathname
  const [pathname, setPathname] = useState(window.location.pathname || '/');

  // Auth state
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Global settings & categories
  const [settings, setSettings] = useState(null);
  const [categories, setCategories] = useState([]);

  // Toast notification state
  const [toasts, setToasts] = useState([]);

  // Post editor state for sub-routes
  const [editingPostId, setEditingPostId] = useState(null);

  // Router listener for popstate (Back / Forward navigation)
  useEffect(() => {
    function handlePopState() {
      setPathname(window.location.pathname || '/');
    }
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    checkSession();
    loadSettings();
    loadCategories();
  }, []);

  function navigate(path) {
    if (path !== window.location.pathname) {
      window.history.pushState(null, '', path);
    }
    setPathname(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function showToast(message, type = 'info') {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  }

  function removeToast(id) {
    setToasts(prev => prev.filter(t => t.id !== id));
  }

  async function loadSettings() {
    try {
      const data = await api.getPublicSettings();
      setSettings(data);
    } catch (e) {
      console.warn('Could not load public settings:', e);
    }
  }

  async function loadCategories() {
    try {
      const data = await api.getPublicCategories();
      setCategories(Array.isArray(data) ? data : []);
    } catch (e) {
      console.warn('Could not load public categories:', e);
    }
  }

  async function checkSession() {
    setAuthLoading(true);
    try {
      const res = await api.getMe();
      if (res && res.user) {
        setCurrentUser(res.user);
      } else {
        setCurrentUser(null);
      }
    } catch (e) {
      setCurrentUser(null);
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleLogout() {
    try {
      await api.logout();
    } catch (e) {}
    setStoredToken('');
    setCurrentUser(null);
    showToast('You have logged out of the admin panel.', 'info');
    navigate('/admin/login');
  }

  function handleLoginSuccess(user) {
    setCurrentUser(user);
    showToast(`Welcome back, ${user.name || user.username}!`, 'success');
    navigate('/admin');
  }

  // Determine active admin tab based on URL path
  function getActiveAdminTab() {
    if (pathname === '/admin/posts/new') return 'post-form';
    if (pathname.startsWith('/admin/posts/edit/')) return 'post-form';
    if (pathname.startsWith('/admin/posts')) return 'posts';
    if (pathname.startsWith('/admin/categories')) return 'categories';
    if (pathname.startsWith('/admin/analytics')) return 'analytics';
    if (pathname.startsWith('/admin/settings/scripts')) return 'scripts';
    if (pathname.startsWith('/admin/settings')) return 'settings';
    if (pathname.startsWith('/admin/staff')) return 'staff';
    return 'dashboard';
  }

  function handleAdminTabChange(tabId) {
    switch (tabId) {
      case 'dashboard':
        navigate('/admin');
        break;
      case 'posts':
        navigate('/admin/posts');
        break;
      case 'post-form':
        setEditingPostId(null);
        navigate('/admin/posts/new');
        break;
      case 'categories':
        navigate('/admin/categories');
        break;
      case 'analytics':
        navigate('/admin/analytics');
        break;
      case 'scripts':
        navigate('/admin/settings/scripts');
        break;
      case 'settings':
        navigate('/admin/settings');
        break;
      case 'staff':
        navigate('/admin/staff');
        break;
      default:
        navigate('/admin');
        break;
    }
  }

  // Toast container renderer helper
  function renderToastContainer() {
    if (toasts.length === 0) return null;
    return (
      <div className="toast-container">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`toast ${
              toast.type === 'success'
                ? 'toast-success'
                : toast.type === 'error'
                ? 'toast-error'
                : ''
            }`}
          >
            {toast.type === 'success' && <CheckCircle2 size={16} color="#10b981" />}
            {toast.type === 'error' && <AlertCircle size={16} color="#f87171" />}
            {toast.type === 'warning' && <AlertTriangle size={16} color="#f59e0b" />}
            {toast.type === 'info' && <Info size={16} color="#60a5fa" />}
            <span style={{ flex: 1 }}>{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 0 }}
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    );
  }

  // --- ROUTE RENDERING ---

  // 1. ADMIN LOGIN PAGE: /admin/login
  if (pathname === '/admin/login') {
    return (
      <div className="app-root admin-theme">
        <ScriptInjector settings={settings} pathname={pathname} />
        <LoginPage
          onLoginSuccess={handleLoginSuccess}
          onViewSite={() => navigate('/')}
        />
        {renderToastContainer()}
      </div>
    );
  }

  // 2. ADMIN PORTAL (PROTECTED ROUTES: /admin, /admin/posts, /admin/analytics, etc.)
  if (pathname.startsWith('/admin')) {
    if (authLoading) {
      return (
        <div className="admin-theme" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f8fafc', color: '#64748b' }}>
          Verifying administrative credentials...
        </div>
      );
    }

    if (!currentUser) {
      return (
        <div className="app-root admin-theme">
          <ScriptInjector settings={settings} pathname={pathname} />
          <LoginPage
            onLoginSuccess={handleLoginSuccess}
            onViewSite={() => navigate('/')}
          />
          {renderToastContainer()}
        </div>
      );
    }

    const activeTab = getActiveAdminTab();
    const editMatch = pathname.match(/^\/admin\/posts\/edit\/([^/]+)/);
    const targetPostId = editMatch ? editMatch[1] : editingPostId;

    return (
      <div className="app-root admin-theme">
        <ScriptInjector settings={settings} pathname={pathname} />
        <AdminLayout
          user={currentUser}
          currentTab={activeTab}
          onTabChange={handleAdminTabChange}
          onLogout={handleLogout}
          onViewSite={() => navigate('/')}
          onNewPost={() => {
            setEditingPostId(null);
            navigate('/admin/posts/new');
          }}
        >
          {activeTab === 'dashboard' && (
            <AdminDashboard
              onNavigateTab={handleAdminTabChange}
              onNewPost={() => {
                setEditingPostId(null);
                navigate('/admin/posts/new');
              }}
              onEditPost={(id) => {
                setEditingPostId(id);
                navigate(`/admin/posts/edit/${id}`);
              }}
              onPreviewPost={(slug) => navigate(`/post/${slug}`)}
            />
          )}

          {activeTab === 'posts' && (
            <AdminPosts
              onNewPost={() => {
                setEditingPostId(null);
                navigate('/admin/posts/new');
              }}
              onEditPost={(id) => {
                setEditingPostId(id);
                navigate(`/admin/posts/edit/${id}`);
              }}
              onPreviewPost={(slug) => navigate(`/post/${slug}`)}
              showToast={showToast}
            />
          )}

          {activeTab === 'post-form' && (
            <AdminPostForm
              postId={targetPostId}
              onBack={() => navigate('/admin/posts')}
              onSuccess={() => navigate('/admin/posts')}
              showToast={showToast}
            />
          )}

          {activeTab === 'categories' && (
            <AdminCategories showToast={showToast} />
          )}

          {activeTab === 'analytics' && (
            <AdminAnalytics showToast={showToast} />
          )}

          {activeTab === 'scripts' && (
            <AdminScripts showToast={showToast} />
          )}

          {activeTab === 'staff' && (
            <AdminStaff
              currentUser={currentUser}
              showToast={showToast}
            />
          )}

          {activeTab === 'settings' && (
            <AdminSettings showToast={showToast} />
          )}
        </AdminLayout>

        {renderToastContainer()}
      </div>
    );
  }

  // 3. PUBLIC READER PAGES (WHITE UI THEME)
  let publicContent = null;

  if (pathname.startsWith('/post/')) {
    const slug = pathname.replace('/post/', '').split('?')[0].split('#')[0];
    publicContent = (
      <PostDetailPage
        slug={slug}
        settings={settings}
        onNavigate={navigate}
        onSelectPost={(postSlug) => navigate(`/post/${postSlug}`)}
      />
    );
  } else if (pathname.startsWith('/category/')) {
    const catSlug = pathname.replace('/category/', '').split('?')[0].split('#')[0];
    publicContent = (
      <CategoryPage
        slug={catSlug}
        onNavigate={navigate}
        onSelectPost={(postSlug) => navigate(`/post/${postSlug}`)}
      />
    );
  } else if (pathname === '/search' || pathname.startsWith('/search?')) {
    const urlParams = new URLSearchParams(window.location.search);
    const q = urlParams.get('q') || '';
    publicContent = (
      <SearchPage
        initialQuery={q}
        onNavigate={navigate}
        onSelectPost={(postSlug) => navigate(`/post/${postSlug}`)}
      />
    );
  } else if (pathname === '/about') {
    publicContent = <AboutPage settings={settings} onNavigate={navigate} />;
  } else if (pathname === '/contact') {
    publicContent = <ContactPage settings={settings} onNavigate={navigate} showToast={showToast} />;
  } else if (pathname === '/privacy-policy') {
    publicContent = <PrivacyPolicyPage settings={settings} onNavigate={navigate} />;
  } else if (pathname === '/terms') {
    publicContent = <TermsPage settings={settings} onNavigate={navigate} />;
  } else if (pathname === '/cookie-policy') {
    publicContent = <CookiePolicyPage settings={settings} onNavigate={navigate} />;
  } else if (pathname === '/' || pathname === '') {
    publicContent = (
      <HomePage
        settings={settings}
        onNavigate={navigate}
        onSelectPost={(slug) => navigate(`/post/${slug}`)}
      />
    );
  } else {
    publicContent = <NotFoundPage onNavigate={navigate} />;
  }

  return (
    <div className="app-root public-theme">
      <ScriptInjector settings={settings} pathname={pathname} />
      <PublicNavbar
        settings={settings}
        categories={categories}
        onNavigate={navigate}
        onAdminClick={() => navigate(currentUser ? '/admin' : '/admin/login')}
      />
      <main style={{ minHeight: 'calc(100vh - 280px)', backgroundColor: '#ffffff' }}>
        {publicContent}
      </main>
      <PublicFooter
        settings={settings}
        categories={categories}
        onNavigate={navigate}
      />
      {renderToastContainer()}
    </div>
  );
}
