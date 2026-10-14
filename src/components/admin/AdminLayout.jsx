import React, { useState } from 'react';
import {
  LayoutDashboard,
  FileText,
  FolderTree,
  Users,
  Settings,
  LogOut,
  ExternalLink,
  PlusCircle,
  Menu,
  X,
  ShieldCheck,
  Globe,
  TrendingUp,
  Code2
} from 'lucide-react';

export default function AdminLayout({
  user,
  currentTab,
  onTabChange,
  onLogout,
  onViewSite,
  onNewPost,
  children
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'posts', label: 'Articles & Posts', icon: FileText },
    { id: 'categories', label: 'Categories', icon: FolderTree },
    { id: 'analytics', label: 'Traffic & Analytics', icon: TrendingUp },
    { id: 'scripts', label: 'Header/Footer Scripts', icon: Code2 },
    ...(user?.role === 'admin' ? [{ id: 'staff', label: 'Staff & Roles', icon: Users }] : []),
    ...(user?.role === 'admin' ? [{ id: 'settings', label: 'Site Settings', icon: Settings }] : [])
  ];

  function handleNav(id) {
    onTabChange(id);
    setMobileMenuOpen(false);
  }

  const titleMap = {
    dashboard: 'Administrative Overview',
    posts: 'Editorial Post Management',
    'post-form': 'Article Content Editor',
    categories: 'Taxonomy Categories',
    analytics: 'Traffic & Audience Analytics',
    scripts: 'Header & Footer Script Injection',
    staff: 'Staff Access & Editorial Roles',
    settings: 'Site Configuration & SEO'
  };

  return (
    <div className="app-layout">
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          className="modal-overlay"
          style={{ zIndex: 35 }}
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`admin-sidebar ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="brand-badge">
            <div className="brand-icon">
              <ShieldCheck size={20} color="#fff" />
            </div>
            <span>BlogWeb CMS</span>
          </div>
          <button
            className="btn-icon btn-secondary"
            style={{ display: 'none' }}
            onClick={() => setMobileMenuOpen(false)}
          >
            <X size={18} />
          </button>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-title">Navigation</div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`nav-link ${isActive ? 'active' : ''}`}
              >
                <Icon size={18} className="nav-icon" />
                <span>{item.label}</span>
              </button>
            );
          })}

          <div className="nav-section-title" style={{ marginTop: '1rem' }}>Quick Shortcuts</div>
          <button
            onClick={() => { onNewPost(); setMobileMenuOpen(false); }}
            className="nav-link"
            style={{ color: '#60a5fa' }}
          >
            <PlusCircle size={18} />
            <span>+ Write New Post</span>
          </button>

          <button
            onClick={() => { onViewSite(); setMobileMenuOpen(false); }}
            className="nav-link"
          >
            <Globe size={18} />
            <span>View Public Website</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="user-mini-card">
            <div className="user-avatar">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
            </div>
            <div className="user-info">
              <div className="user-name">{user?.name || user?.username}</div>
              <span className={`user-role-badge ${user?.role === 'admin' ? 'badge-admin' : 'badge-editor'}`}>
                {user?.role || 'staff'}
              </span>
            </div>
            <button
              onClick={onLogout}
              className="btn-icon btn-secondary"
              title="Log out of session"
              style={{ width: '30px', height: '30px' }}
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <main className="admin-main">
        <header className="admin-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              className="btn btn-secondary btn-icon"
              style={{ display: window.innerWidth <= 900 ? 'inline-flex' : 'none' }}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu size={18} />
            </button>
            <div className="header-title-wrap">
              <h1 style={{ textTransform: 'none' }}>
                {titleMap[currentTab] || currentTab}
              </h1>
            </div>
          </div>

          <div className="header-actions">
            <button
              onClick={onNewPost}
              className="btn btn-primary"
            >
              <PlusCircle size={16} />
              <span style={{ display: 'inline' }}>New Article</span>
            </button>

            <button
              onClick={onViewSite}
              className="btn btn-secondary"
              title="Open public website view"
            >
              <ExternalLink size={16} />
              <span>Reader View</span>
            </button>
          </div>
        </header>

        <div className="admin-body">
          {children}
        </div>
      </main>
    </div>
  );
}
