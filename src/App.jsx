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
import { NotFoundPage } from './pages/NotFoundPage';

// Admin CMS Pages (100% Tiếng Việt) - Lazy Loaded for Code Splitting
const AdminAuthModal = React.lazy(() => import('./pages/admin/AdminAuthModal').then(module => ({ default: module.AdminAuthModal })));
const AdminLayout = React.lazy(() => import('./pages/admin/AdminLayout').then(module => ({ default: module.AdminLayout })));
const AdminDashboard = React.lazy(() => import('./pages/admin/AdminDashboard').then(module => ({ default: module.AdminDashboard })));
const AdminPostsList = React.lazy(() => import('./pages/admin/AdminPostsList').then(module => ({ default: module.AdminPostsList })));
const AdminPostEditor = React.lazy(() => import('./pages/admin/AdminPostEditor').then(module => ({ default: module.AdminPostEditor })));
const AdminCategories = React.lazy(() => import('./pages/admin/AdminCategories').then(module => ({ default: module.AdminCategories })));
const AdminAdSense = React.lazy(() => import('./pages/admin/AdminAdSense').then(module => ({ default: module.AdminAdSense })));
const AdminSubscribers = React.lazy(() => import('./pages/admin/AdminSubscribers').then(module => ({ default: module.AdminSubscribers })));
const AdminAuthors = React.lazy(() => import('./pages/admin/AdminAuthors').then(module => ({ default: module.AdminAuthors })));
const AdminSettings = React.lazy(() => import('./pages/admin/AdminSettings').then(module => ({ default: module.AdminSettings })));
const AdminStaff = React.lazy(() => import('./pages/admin/AdminStaff').then(module => ({ default: module.AdminStaff })));
const AdminProfile = React.lazy(() => import('./pages/admin/AdminProfile').then(module => ({ default: module.AdminProfile })));
const AdminStaffNew = React.lazy(() => import('./pages/admin/AdminStaffNew').then(module => ({ default: module.AdminStaffNew })));
const AdminStaffEdit = React.lazy(() => import('./pages/admin/AdminStaffEdit').then(module => ({ default: module.AdminStaffEdit })));
const AdminStaffSalary = React.lazy(() => import('./pages/admin/AdminStaffSalary').then(module => ({ default: module.AdminStaffSalary })));
const AdminAccessDenied = React.lazy(() => import('./pages/admin/AdminAccessDenied').then(module => ({ default: module.AdminAccessDenied })));

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
          if (hasPermission('canManagePosts')) {
            return (
              <AdminLayout currentTab="posts">
                <AdminPostsList />
              </AdminLayout>
            );
          }
          return (
            <AdminLayout currentTab="profile">
              <AdminProfile />
            </AdminLayout>
          );
        }
        return (
          <AdminLayout currentTab="dashboard">
            <AdminDashboard />
          </AdminLayout>
        );
      }

      // Profile is open to any authenticated staff
      if (cleanPath === '/admin/profile') {
        return (
          <AdminLayout currentTab="profile">
            <AdminProfile />
          </AdminLayout>
        );
      }

      // Post Management (canManagePosts)
      if (cleanPath === '/admin/posts') {
        if (userRole !== 'admin' && !hasPermission('canManagePosts')) {
          return (
            <AdminLayout currentTab="profile">
              <AdminAccessDenied requiredPermission="canManagePosts" featureName="Quản Lý Bài Viết" />
            </AdminLayout>
          );
        }
        return (
          <AdminLayout currentTab="posts">
            <AdminPostsList />
          </AdminLayout>
        );
      }

      if (cleanPath === '/admin/posts/new') {
        if (userRole !== 'admin' && !hasPermission('canManagePosts')) {
          return (
            <AdminLayout currentTab="profile">
              <AdminAccessDenied requiredPermission="canManagePosts" featureName="Soạn Thảo Bài Viết Mới" />
            </AdminLayout>
          );
        }
        return (
          <AdminLayout currentTab="new-post">
            <AdminPostEditor />
          </AdminLayout>
        );
      }

      if (cleanPath.startsWith('/admin/posts/edit/')) {
        if (userRole !== 'admin' && !hasPermission('canManagePosts')) {
          return (
            <AdminLayout currentTab="profile">
              <AdminAccessDenied requiredPermission="canManagePosts" featureName="Chỉnh Sửa Bài Viết" />
            </AdminLayout>
          );
        }
        const postId = cleanPath.replace('/admin/posts/edit/', '');
        return (
          <AdminLayout currentTab="posts">
            <AdminPostEditor postId={postId} />
          </AdminLayout>
        );
      }

      // Categories (canManageCategories)
      if (cleanPath === '/admin/categories') {
        if (userRole !== 'admin' && !hasPermission('canManageCategories')) {
          return (
            <AdminLayout currentTab="profile">
              <AdminAccessDenied requiredPermission="canManageCategories" featureName="Chuyên Mục & Desks" />
            </AdminLayout>
          );
        }
        return (
          <AdminLayout currentTab="categories">
            <AdminCategories />
          </AdminLayout>
        );
      }

      // Staff Management (canManageStaff) - Strict Guarding
      if (
        cleanPath === '/admin/staff' || 
        cleanPath === '/admin/staff/new' || 
        cleanPath.startsWith('/admin/staff/edit/') || 
        cleanPath.startsWith('/admin/staff/salary/')
      ) {
        if (userRole !== 'admin' && !hasPermission('canManageStaff')) {
          return (
            <AdminLayout currentTab="profile">
              <AdminAccessDenied requiredPermission="canManageStaff" featureName="Nhân Sự & Bảng Lương" />
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
        return (
          <AdminLayout currentTab="staff">
            <AdminStaff />
          </AdminLayout>
        );
      }

      // Google AdSense (canViewRevenue)
      if (cleanPath === '/admin/adsense') {
        if (userRole !== 'admin' && !hasPermission('canViewRevenue')) {
          return (
            <AdminLayout currentTab="profile">
              <AdminAccessDenied requiredPermission="canViewRevenue" featureName="Google AdSense Ads" />
            </AdminLayout>
          );
        }
        return (
          <AdminLayout currentTab="adsense">
            <AdminAdSense />
          </AdminLayout>
        );
      }

      // Subscribers (canManageSettings)
      if (cleanPath === '/admin/subscribers') {
        if (userRole !== 'admin' && !hasPermission('canManageSettings')) {
          return (
            <AdminLayout currentTab="profile">
              <AdminAccessDenied requiredPermission="canManageSettings" featureName="Email Đăng Ký Tin" />
            </AdminLayout>
          );
        }
        return (
          <AdminLayout currentTab="subscribers">
            <AdminSubscribers />
          </AdminLayout>
        );
      }

      // Authors E-E-A-T (canManageSettings)
      if (cleanPath === '/admin/authors') {
        if (userRole !== 'admin' && !hasPermission('canManageSettings')) {
          return (
            <AdminLayout currentTab="profile">
              <AdminAccessDenied requiredPermission="canManageSettings" featureName="Ban Biên Tập (E-E-A-T)" />
            </AdminLayout>
          );
        }
        return (
          <AdminLayout currentTab="authors">
            <AdminAuthors />
          </AdminLayout>
        );
      }

      // Settings (canManageSettings)
      if (cleanPath === '/admin/settings') {
        if (userRole !== 'admin' && !hasPermission('canManageSettings')) {
          return (
            <AdminLayout currentTab="profile">
              <AdminAccessDenied requiredPermission="canManageSettings" featureName="Cài Đặt & Cấu Hình SEO" />
            </AdminLayout>
          );
        }
        return (
          <AdminLayout currentTab="settings">
            <AdminSettings />
          </AdminLayout>
        );
      }

      // Unknown Admin Route -> 404 in Admin
      return (
        <AdminLayout currentTab="profile">
          <NotFoundPage isAdmin={true} />
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
      pageComponent = <NotFoundPage />;
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
