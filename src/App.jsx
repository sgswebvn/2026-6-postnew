import React from 'react';
import { BlogProvider, useBlog } from './context/BlogContext';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { Toast } from './components/common/Toast';
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

const AppContent = () => {
  const { currentRoute, isAdminAuthenticated } = useBlog();

  // Router parser
  const renderRoute = () => {
    // 1. Admin Portal Routes
    if (currentRoute.startsWith('#/admin')) {
      if (!isAdminAuthenticated) {
        return <AdminAuthModal />;
      }

      if (currentRoute === '#/admin' || currentRoute === '#/admin/') {
        return (
          <AdminLayout currentTab="dashboard">
            <AdminDashboard />
          </AdminLayout>
        );
      }
      if (currentRoute === '#/admin/posts') {
        return (
          <AdminLayout currentTab="posts">
            <AdminPostsList />
          </AdminLayout>
        );
      }
      if (currentRoute === '#/admin/posts/new') {
        return (
          <AdminLayout currentTab="new-post">
            <AdminPostEditor />
          </AdminLayout>
        );
      }
      if (currentRoute.startsWith('#/admin/posts/edit/')) {
        const postId = currentRoute.replace('#/admin/posts/edit/', '');
        return (
          <AdminLayout currentTab="posts">
            <AdminPostEditor postId={postId} />
          </AdminLayout>
        );
      }
      if (currentRoute === '#/admin/categories') {
        return (
          <AdminLayout currentTab="categories">
            <AdminCategories />
          </AdminLayout>
        );
      }
      if (currentRoute === '#/admin/adsense') {
        return (
          <AdminLayout currentTab="adsense">
            <AdminAdSense />
          </AdminLayout>
        );
      }
      if (currentRoute === '#/admin/comments') {
        return (
          <AdminLayout currentTab="comments">
            <AdminComments />
          </AdminLayout>
        );
      }
      if (currentRoute === '#/admin/subscribers') {
        return (
          <AdminLayout currentTab="subscribers">
            <AdminSubscribers />
          </AdminLayout>
        );
      }
      if (currentRoute === '#/admin/authors') {
        return (
          <AdminLayout currentTab="authors">
            <AdminAuthors />
          </AdminLayout>
        );
      }
      if (currentRoute === '#/admin/settings') {
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

    if (currentRoute === '#/' || currentRoute === '' || currentRoute === '#') {
      pageComponent = <HomePage />;
    } else if (currentRoute.startsWith('#/post/')) {
      const slug = currentRoute.replace('#/post/', '');
      pageComponent = <PostDetailPage slug={slug} />;
    } else if (currentRoute.startsWith('#/category/')) {
      const catSlug = currentRoute.replace('#/category/', '');
      pageComponent = <CategoryPage slug={catSlug} />;
    } else if (currentRoute.startsWith('#/tag/')) {
      const tag = currentRoute.replace('#/tag/', '');
      pageComponent = <TagPage tag={tag} />;
    } else if (currentRoute === '#/about') {
      pageComponent = <AboutPage />;
    } else if (currentRoute === '#/contact') {
      pageComponent = <ContactPage />;
    } else if (currentRoute === '#/privacy-policy') {
      pageComponent = <PrivacyPolicyPage />;
    } else if (currentRoute === '#/terms') {
      pageComponent = <TermsPage />;
    } else if (currentRoute === '#/disclaimer') {
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
