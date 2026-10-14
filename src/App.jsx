import React, { useEffect, useState } from 'react';
import { api, setStoredToken, getStoredToken } from './api/client';
import AdminLayout from './components/admin/AdminLayout';
import AdminDashboard from './components/admin/AdminDashboard';
import AdminPosts from './components/admin/AdminPosts';
import AdminPostForm from './components/admin/AdminPostForm';
import AdminCategories from './components/admin/AdminCategories';
import AdminStaff from './components/admin/AdminStaff';
import AdminSettings from './components/admin/AdminSettings';
import LoginPage from './pages/LoginPage';
import PublicNavbar from './components/public/PublicNavbar';
import HomePage from './components/public/HomePage';
import PostDetailPage from './components/public/PostDetailPage';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

export default function App() {
  // Navigation: 'public-home' | 'public-detail' | 'admin-login' | 'admin'
  const [currentView, setCurrentView] = useState('admin');
  const [adminTab, setAdminTab] = useState('dashboard');
  const [editingPostId, setEditingPostId] = useState(null);
  const [activeSlug, setActiveSlug] = useState('');

  // Auth state
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Global settings
  const [settings, setSettings] = useState(null);

  // Toast state
  const [toasts, setToasts] = useState([]);

  function showToast(message, type = 'info') {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }

  function removeToast(id) {
    setToasts(prev => prev.filter(t => t.id !== id));
  }

  useEffect(() => {
    checkSession();
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const data = await api.getPublicSettings();
      setSettings(data);
    } catch (e) {
      console.warn('Could not load settings:', e);
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
    showToast('Logged out of admin session.', 'info');
    setCurrentView('admin-login');
  }

  function handleLoginSuccess(user) {
    setCurrentUser(user);
    showToast(`Welcome back, ${user.name || user.username}!`, 'success');
    setCurrentView('admin');
    setAdminTab('dashboard');
  }

  function handleSelectPost(slug) {
    setActiveSlug(slug);
    setCurrentView('public-detail');
  }

  function handleEditPost(id) {
    setEditingPostId(id);
    setAdminTab('post-form');
    setCurrentView('admin');
  }

  function handleNewPost() {
    setEditingPostId(null);
    setAdminTab('post-form');
    setCurrentView('admin');
  }

  function handlePreviewPost(slug) {
    setActiveSlug(slug);
    setCurrentView('public-detail');
  }

  return (
    <div className="app-root">
      {/* 1. PUBLIC READER VIEWS */}
      {currentView === 'public-home' && (
        <div>
          <PublicNavbar
            settings={settings}
            onAdminClick={() => {
              if (currentUser) {
                setCurrentView('admin');
              } else {
                setCurrentView('admin-login');
              }
            }}
          />
          <HomePage onSelectPost={handleSelectPost} />
        </div>
      )}

      {currentView === 'public-detail' && (
        <div>
          <PublicNavbar
            settings={settings}
            onAdminClick={() => {
              if (currentUser) {
                setCurrentView('admin');
              } else {
                setCurrentView('admin-login');
              }
            }}
          />
          <PostDetailPage
            slug={activeSlug}
            settings={settings}
            onBack={() => setCurrentView('public-home')}
          />
        </div>
      )}

      {/* 2. ADMIN LOGIN PAGE */}
      {currentView === 'admin-login' && (
        <LoginPage
          onLoginSuccess={handleLoginSuccess}
          onViewSite={() => setCurrentView('public-home')}
        />
      )}

      {/* 3. ADMIN PORTAL (Requires login) */}
      {currentView === 'admin' && (
        authLoading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: 'var(--text-muted)' }}>
            Verifying administrative access...
          </div>
        ) : !currentUser ? (
          <LoginPage
            onLoginSuccess={handleLoginSuccess}
            onViewSite={() => setCurrentView('public-home')}
          />
        ) : (
          <AdminLayout
            user={currentUser}
            currentTab={adminTab}
            onTabChange={(tab) => {
              setAdminTab(tab);
              if (tab !== 'post-form') setEditingPostId(null);
            }}
            onLogout={handleLogout}
            onViewSite={() => setCurrentView('public-home')}
            onNewPost={handleNewPost}
          >
            {adminTab === 'dashboard' && (
              <AdminDashboard
                onNavigate={(tab) => setAdminTab(tab)}
                onEditPost={handleEditPost}
                onPreviewPost={handlePreviewPost}
              />
            )}

            {adminTab === 'posts' && (
              <AdminPosts
                onNewPost={handleNewPost}
                onEditPost={handleEditPost}
                onPreviewPost={handlePreviewPost}
                showToast={showToast}
              />
            )}

            {adminTab === 'post-form' && (
              <AdminPostForm
                postId={editingPostId}
                onBack={() => setAdminTab('posts')}
                onSuccess={() => setAdminTab('posts')}
                showToast={showToast}
              />
            )}

            {adminTab === 'categories' && (
              <AdminCategories showToast={showToast} />
            )}

            {adminTab === 'staff' && (
              <AdminStaff
                currentUser={currentUser}
                showToast={showToast}
              />
            )}

            {adminTab === 'settings' && (
              <AdminSettings showToast={showToast} />
            )}
          </AdminLayout>
        )
      )}

      {/* Toast Notifications */}
      {toasts.length > 0 && (
        <div className="toast-container">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`toast ${toast.type === 'success' ? 'toast-success' : toast.type === 'error' ? 'toast-error' : ''}`}
            >
              {toast.type === 'success' ? (
                <CheckCircle2 size={16} color="#10b981" />
              ) : (
                <AlertCircle size={16} color="#f87171" />
              )}
              <span style={{ flex: 1 }}>{toast.message}</span>
              <button
                onClick={() => removeToast(toast.id)}
                style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: 0 }}
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
