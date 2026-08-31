import React, { useState, useEffect } from 'react';
import { useBlog } from '../context/BlogContext';
import { HeroFeatured } from '../components/blog/HeroFeatured';
import { ArticleCard } from '../components/blog/ArticleCard';
import { NewsletterBox } from '../components/blog/NewsletterBox';
import { AdSenseUnit } from '../components/ads/AdSenseUnit';
import { Badge } from '../components/common/Badge';
import { ReturningReaderBanner } from '../components/blog/ReturningReaderBanner';
import { telemetryService } from '../services/telemetryService';
import { 
  TrendingUp, 
  Flame, 
  Layers, 
  ArrowRight, 
  Sparkles, 
  Bookmark, 
  ChevronLeft, 
  ChevronRight 
} from 'lucide-react';

export const HomePage = () => {
  const { posts, categories, navigate, bookmarks } = useBlog();
  const [filterTab, setFilterTab] = useState('latest'); // 'latest' | 'trending' | 'bookmarks'
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 6;

  useEffect(() => {
    telemetryService.trackEvent('home_page_view');
    const handleBookmarkFilter = () => {
      setFilterTab('bookmarks');
      setCurrentPage(1);
      const el = document.getElementById('articles-feed-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    };
    window.addEventListener('filter-bookmarks', handleBookmarkFilter);
    return () => window.removeEventListener('filter-bookmarks', handleBookmarkFilter);
  }, []);

  const published = posts.filter(p => p.status === 'published');

  let rawDisplayPosts = [];
  if (filterTab === 'trending') {
    rawDisplayPosts = [...published].sort((a, b) => (b.views || 0) - (a.views || 0));
  } else if (filterTab === 'bookmarks') {
    rawDisplayPosts = published.filter(p => bookmarks.includes(p.slug));
  } else {
    // latest (skip lead story to avoid duplication with hero)
    rawDisplayPosts = published.slice(1);
  }

  // Pagination calculation
  const totalPosts = rawDisplayPosts.length;
  const totalPages = Math.ceil(totalPosts / postsPerPage) || 1;
  const validPage = Math.min(currentPage, totalPages);
  const startIndex = (validPage - 1) * postsPerPage;
  const currentFeedPosts = rawDisplayPosts.slice(startIndex, startIndex + postsPerPage);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      const el = document.getElementById('articles-feed-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn">
      {/* Top Header Leaderboard Ad (728x90 / Responsive) */}
      <AdSenseUnit slotType="headerLeaderboard" customLabel="Sponsored Executive Leaderboard" />

      {/* Returning Reader Smart Greeting */}
      <ReturningReaderBanner />

      {/* Magazine Hero Section */}
      <HeroFeatured />

      {/* Main Grid: Articles Stream + Sticky Sidebar */}
      <div id="articles-feed-section" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left 8 Cols: Latest Dispatches Stream */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-200 dark:border-neutral-800">
            <h2 className="font-serif text-xl font-bold text-neutral-950 dark:text-neutral-50">
              {filterTab === 'bookmarks' ? 'Saved Reading List' : 'Latest Dispatches'}
            </h2>

            {/* Clean Minimal Filter Tabs */}
            <div className="flex items-center space-x-1 bg-neutral-100 dark:bg-neutral-800/80 p-1 rounded-lg">
              <button
                onClick={() => { setFilterTab('latest'); setCurrentPage(1); }}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${filterTab === 'latest' ? 'bg-white dark:bg-neutral-900 text-neutral-950 dark:text-neutral-50 shadow-xs font-bold' : 'text-neutral-500 hover:text-neutral-900'}`}
              >
                Latest
              </button>
              <button
                onClick={() => { setFilterTab('trending'); setCurrentPage(1); }}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${filterTab === 'trending' ? 'bg-white dark:bg-neutral-900 text-neutral-950 dark:text-neutral-50 shadow-xs font-bold' : 'text-neutral-500 hover:text-neutral-900'}`}
              >
                Trending
              </button>
              <button
                onClick={() => { setFilterTab('bookmarks'); setCurrentPage(1); }}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${filterTab === 'bookmarks' ? 'bg-white dark:bg-neutral-900 text-neutral-950 dark:text-neutral-50 shadow-xs font-bold' : 'text-neutral-500 hover:text-neutral-900'}`}
              >
                Saved ({bookmarks.length})
              </button>
            </div>
          </div>

          {currentFeedPosts.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-[#111622] rounded-3xl border border-neutral-200 dark:border-neutral-800 space-y-3">
              <Bookmark className="w-10 h-10 text-neutral-400 mx-auto opacity-40" />
              <h3 className="font-serif text-lg font-bold">
                {filterTab === 'bookmarks' ? 'No Saved Articles Found' : 'No Articles Found'}
              </h3>
              <p className="text-xs text-neutral-500">
                {filterTab === 'bookmarks'
                  ? 'Click the Bookmark icon on any article card to save insightful analyses for later reading.'
                  : 'Published articles will appear in this feed when they are available.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {currentFeedPosts.map((post, idx) => (
                <React.Fragment key={post.id}>
                  <ArticleCard post={post} />
                  {/* Insert In-Feed Ad after 2nd post on Page 1 */}
                  {idx === 1 && validPage === 1 && (
                    <div className="sm:col-span-2 my-2">
                      <AdSenseUnit slotType="inArticleTop" customLabel="Sponsored Financial Recommendation" />
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          )}

          {/* Public Pagination Bar */}
          {totalPages > 1 && (
            <div className="p-4 bg-white dark:bg-[#111622] rounded-2xl border border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs shadow-sm">
              <span className="text-neutral-500 font-mono">
                Showing Page <span className="font-bold text-neutral-900 dark:text-neutral-100">{validPage}</span> of <span className="font-bold text-neutral-900 dark:text-neutral-100">{totalPages}</span> ({totalPosts} total stories)
              </span>

              <div className="flex items-center space-x-1.5">
                {/* Prev Button */}
                <button
                  onClick={() => handlePageChange(validPage - 1)}
                  disabled={validPage <= 1}
                  className="px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-all font-semibold flex items-center gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>

                {/* Page Number Buttons */}
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`w-8 h-8 rounded-xl text-xs font-mono font-bold transition-all ${
                      page === validPage
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                    }`}
                  >
                    {page}
                  </button>
                ))}

                {/* Next Button */}
                <button
                  onClick={() => handlePageChange(validPage + 1)}
                  disabled={validPage >= totalPages}
                  className="px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-all font-semibold flex items-center gap-1"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* High Impact Full-Width Newsletter Callout */}
          <NewsletterBox />
        </div>

        {/* Right 4 Cols: Sticky Sidebar */}
        <div className="lg:col-span-4 space-y-8 sticky top-24">
          {/* Sticky High-RPM Sidebar Ad (300x600 Half-page) */}
          <div className="bg-white dark:bg-[#111622] p-4 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
            <AdSenseUnit slotType="sidebarSticky" customLabel="Strategic Sponsor (300x600)" />
          </div>

          {/* Compact Newsletter Widget */}
          <NewsletterBox compact={true} />

          {/* Category Hubs Card */}
          <div className="p-6 bg-white dark:bg-[#111622] rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
            <h3 className="font-serif text-lg font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-500" />
              <span>Specialized Editorial Desks</span>
            </h3>
            <div className="space-y-2.5">
              {categories.map(cat => (
                <div
                  key={cat.id}
                  onClick={() => navigate(`/category/${cat.slug}`)}
                  className="group cursor-pointer p-2.5 rounded-2xl hover:bg-neutral-50 dark:hover:bg-neutral-800/60 transition-all flex items-center justify-between"
                >
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 group-hover:text-blue-500 transition-colors">
                      {cat.name}
                    </span>
                    <p className="text-[11px] text-neutral-400 line-clamp-1">
                      {cat.description}
                    </p>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-neutral-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all flex-shrink-0 ml-2" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
