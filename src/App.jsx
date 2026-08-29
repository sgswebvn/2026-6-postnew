import React from 'react';
import { BlogProvider, useBlog } from './context/BlogContext';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { Toast } from './components/common/Toast';
import { CustomDialog } from './components/common/CustomDialog';
import { SearchModal } from './components/common/SearchModal';
import { StickyBottomAd } from './components/ads/StickyBottomAd';

// Public Pages
import { HomePage } from './pages/HomePage';
import { PostDetailPage } from './pages/PostDetailPage';
import { CategoryPage } from './pages/CategoryPage';
import { TagPage } from './pages/TagPage';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';
import { TermsPage } from './pages/TermsPage';
import { DisclaimerPage } from './pages/DisclaimerPage';

// Admin CMS Pages (100% Tiếng Việt) - Lazy Loaded for Code Splitting
const AdminAuthModal = React.lazy(() => import('./pages/admin/AdminAuthModal').then(module => ({ default: module.AdminAuthModal })));
const AdminLayout = React.lazy(() => import('./pages/admin/AdminLayout').then(module => ({ default: module.AdminLayout })));
const AdminDashboard = React.lazy(() => import('./pages/admin/AdminDashboard').then(module => ({ default: module.AdminDashboard })));
const AdminPostsList = React.lazy(() => import('./pages/admin/AdminPostsList').then(module => ({ default: module.AdminPostsList })));
const AdminPostEditor = React.lazy(() => import('./pages/admin/AdminPostEditor').then(module => ({ default: module.AdminPostEditor })));
const AdminCategories = React.lazy(() => import('./pages/admin/AdminCategories').then(module => ({ default: module.AdminCategories })));
const AdminAdSense = React.lazy(() => import('./pages/admin/AdminAdSense').then(module => ({ default: module.AdminAdSense })));
const AdminComments = React.lazy(() => import('./pages/admin/AdminComments').then(module => ({ default: module.AdminComments })));
const AdminSubscribers = React.lazy(() => import('./pages/admin/AdminSubscribers').then(module => ({ default: module.AdminSubscribers })));
const AdminAuthors = React.lazy(() => import('./pages/admin/AdminAuthors').then(module => ({ default: module.AdminAuthors })));
const AdminSettings = React.lazy(() => import('./pages/admin/AdminSettings').then(module => ({ default: module.AdminSettings })));
const AdminStaff = React.lazy(() => import('./pages/admin/AdminStaff').then(module => ({ default: module.AdminStaff })));
const AdminProfile = React.lazy(() => import('./pages/admin/AdminProfile').then(module => ({ default: module.AdminProfile })));
const AdminStaffNew = React.lazy(() => import('./pages/admin/AdminStaffNew').then(module => ({ default: module.AdminStaffNew })));
const AdminStaffEdit = React.lazy(() => import('./pages/admin/AdminStaffEdit').then(module => ({ default: module.AdminStaffEdit })));
const AdminStaffSalary = React.lazy(() => import('./pages/admin/AdminStaffSalary').then(module => ({ default: module.AdminStaffSalary })));

const AppContent = () => {
  const { currentRoute, isAdminAuthenticated, userRole, currentUser, hasPermission } = useBlog();

  // Router parser
  const renderRoute = () => {
    let route = currentRoute || '/';
    if (route.startsWith('#')) route = route.replace(/^#/, '');
    if (!route.startsWith('/')) route = `/${route}`;
    const cleanPath = route.split('?')[0] || '/';

    // 1. Admin Portal Routes
    if (cleanPath.startsWith('/admin')) {
      if (!isAdminAuthenticated) {
        return <AdminAuthModal />;
      }

      // Check permission for Dashboard
      if (cleanPath === '/admin' || cleanPath === '/admin/') {
        if (userRole !== 'admin' && !hasPermission('canViewRevenue')) {
          return (
            <AdminLayout currentTab="posts">
              <AdminPostsList />
            </AdminLayout>
          );
        }
        return (
          <AdminLayout currentTab="dashboard">
            <AdminDashboard />
          </AdminLayout>
        );
      }
      if (cleanPath === '/admin/posts') {
        return (
          <AdminLayout currentTab="posts">
            <AdminPostsList />
          </AdminLayout>
        );
      }
      if (cleanPath === '/admin/posts/new') {
        return (
          <AdminLayout currentTab="new-post">
            <AdminPostEditor />
          </AdminLayout>
        );
      }
      if (cleanPath.startsWith('/admin/posts/edit/')) {
        const postId = cleanPath.replace('/admin/posts/edit/', '');
        return (
          <AdminLayout currentTab="posts">
            <AdminPostEditor postId={postId} />
          </AdminLayout>
        );
      }
      if (cleanPath === '/admin/profile') {
        return (
          <AdminLayout currentTab="profile">
            <AdminProfile />
          </AdminLayout>
        );
      }
      if (cleanPath === '/admin/categories') {
        return (
          <AdminLayout currentTab="categories">
            <AdminCategories />
          </AdminLayout>
        );
      }
      if (cleanPath === '/admin/staff/new') {
        return (
          <AdminLayout currentTab="staff">
            <AdminStaffNew />
          </AdminLayout>
        );
      }
      if (cleanPath.startsWith('/admin/staff/edit/')) {
        const staffId = cleanPath.replace('/admin/staff/edit/', '');
        return (
          <AdminLayout currentTab="staff">
            <AdminStaffEdit staffId={staffId} />
          </AdminLayout>
        );
      }
      if (cleanPath.startsWith('/admin/staff/salary/')) {
        const staffId = cleanPath.replace('/admin/staff/salary/', '');
        return (
          <AdminLayout currentTab="staff">
            <AdminStaffSalary staffId={staffId} />
          </AdminLayout>
        );
      }
      if (cleanPath === '/admin/staff') {
        return (
          <AdminLayout currentTab="staff">
            <AdminStaff />
          </AdminLayout>
        );
      }
      if (cleanPath === '/admin/adsense') {
        return (
          <AdminLayout currentTab="adsense">
            <AdminAdSense />
          </AdminLayout>
        );
      }
      if (cleanPath === '/admin/comments') {
        return (
          <AdminLayout currentTab="comments">
            <AdminComments />
          </AdminLayout>
        );
      }
      if (cleanPath === '/admin/subscribers') {
        return (
          <AdminLayout currentTab="subscribers">
            <AdminSubscribers />
          </AdminLayout>
        );
      }
      if (cleanPath === '/admin/authors') {
        return (
          <AdminLayout currentTab="authors">
            <AdminAuthors />
          </AdminLayout>
        );
      }
      if (cleanPath === '/admin/settings') {
        return (
          <AdminLayout currentTab="settings">
            <AdminSettings />
          </AdminLayout>
        );
      }

      return (
        <AdminLayout currentTab="dashboard">
          <AdminDashboard />
        </AdminLayout>
      );
    }

    // 2. Public Editorial Website Routes
    let pageComponent = null;

    if (cleanPath === '/' || cleanPath === '') {
      pageComponent = <HomePage />;
    } else if (cleanPath.startsWith('/post/')) {
      const slug = cleanPath.replace('/post/', '').split('?')[0].split('#')[0];
      pageComponent = <PostDetailPage slug={slug} />;
    } else if (cleanPath.startsWith('/category/')) {
      const catSlug = cleanPath.replace('/category/', '').split('?')[0].split('#')[0];
      pageComponent = <CategoryPage slug={catSlug} />;
    } else if (cleanPath.startsWith('/tag/')) {
      const tag = cleanPath.replace('/tag/', '').split('?')[0].split('#')[0];
      pageComponent = <TagPage tag={tag} />;
    } else if (cleanPath === '/about') {
      pageComponent = <AboutPage />;
    } else if (cleanPath === '/contact') {
      pageComponent = <ContactPage />;
    } else if (cleanPath === '/privacy-policy') {
      pageComponent = <PrivacyPolicyPage />;
    } else if (cleanPath === '/terms') {
      pageComponent = <TermsPage />;
    } else if (cleanPath === '/disclaimer') {
      pageComponent = <DisclaimerPage />;
    } else {
      pageComponent = <HomePage />;
    }

    return (
      <div className="min-h-screen flex flex-col justify-between bg-[#faf9f6] dark:bg-[#0c1017]">
        <Header />
        <main className="flex-1">
          {pageComponent}
        </main>
        <Footer />
        <StickyBottomAd />
      </div>
    );
  };

  return (
    <React.Suspense fallback={<div className="flex h-screen items-center justify-center bg-[#0a0f18] text-neutral-400 font-mono text-sm">Loading CMS modules...</div>}>
      {renderRoute()}
      <SearchModal />
      <Toast />
      <CustomDialog />
    </React.Suspense>
  );
};

export default function App() {
  return (
    <BlogProvider>
      <AppContent />
    </BlogProvider>
  );
}
