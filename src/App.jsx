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

// Admin CMS Pages (100% Tiếng Việt)
import { AdminAuthModal } from './pages/admin/AdminAuthModal';
import { AdminLayout } from './pages/admin/AdminLayout';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminPostsList } from './pages/admin/AdminPostsList';
import { AdminPostEditor } from './pages/admin/AdminPostEditor';
import { AdminCategories } from './pages/admin/AdminCategories';
import { AdminAdSense } from './pages/admin/AdminAdSense';
import { AdminComments } from './pages/admin/AdminComments';
import { AdminSubscribers } from './pages/admin/AdminSubscribers';
import { AdminAuthors } from './pages/admin/AdminAuthors';
import { AdminSettings } from './pages/admin/AdminSettings';
import { AdminStaff } from './pages/admin/AdminStaff';
import { AdminProfile } from './pages/admin/AdminProfile';
import { AdminStaffNew } from './pages/admin/AdminStaffNew';
import { AdminStaffEdit } from './pages/admin/AdminStaffEdit';
import { AdminStaffSalary } from './pages/admin/AdminStaffSalary';

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
      const slug = cleanPath.replace('/post/', '');
      pageComponent = <PostDetailPage slug={slug} />;
    } else if (cleanPath.startsWith('/category/')) {
      const catSlug = cleanPath.replace('/category/', '');
      pageComponent = <CategoryPage slug={catSlug} />;
    } else if (cleanPath.startsWith('/tag/')) {
      const tag = cleanPath.replace('/tag/', '');
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
    <>
      {renderRoute()}
      <SearchModal />
      <Toast />
      <CustomDialog />
    </>
  );
};

export default function App() {
  return (
    <BlogProvider>
      <AppContent />
    </BlogProvider>
  );
}
