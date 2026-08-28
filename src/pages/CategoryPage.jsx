import React, { useState } from 'react';
import { useBlog } from '../context/BlogContext';
import { ArticleCard } from '../components/blog/ArticleCard';
import { AdSenseUnit } from '../components/ads/AdSenseUnit';
import { Badge } from '../components/common/Badge';
import { NewsletterBox } from '../components/blog/NewsletterBox';
import { Layers, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react';

export const CategoryPage = ({ slug }) => {
  const { posts, categories, navigate } = useBlog();
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 6;

  const category = categories.find(c => c.slug === slug);
  const categoryPosts = posts.filter(p => p.categoryId === category?.id && p.status === 'published');

  if (!category) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4 font-sans">
        <h2 className="font-serif text-3xl font-bold">Desk / Category Not Found</h2>
        <button onClick={() => navigate('/')} className="px-6 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold uppercase">
          Back to Front Page
        </button>
      </div>
    );
  }

  // Pagination calculation
  const totalPosts = categoryPosts.length;
  const totalPages = Math.ceil(totalPosts / postsPerPage) || 1;
  const validPage = Math.min(currentPage, totalPages);
  const startIndex = (validPage - 1) * postsPerPage;
  const paginatedCategoryPosts = categoryPosts.slice(startIndex, startIndex + postsPerPage);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn font-sans">
      {/* Top Breadcrumb */}
      <div className="flex items-center space-x-2 text-xs text-neutral-500 font-mono mb-6">
        <button onClick={() => navigate('/')} className="hover:text-blue-600">Home</button>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-neutral-400">Editorial Desks</span>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-neutral-900 dark:text-white font-bold">{category.name}</span>
      </div>

      {/* Category Masthead Header */}
      <div className="p-8 sm:p-12 rounded-3xl bg-white dark:bg-[#111622] border border-neutral-200 dark:border-neutral-800 shadow-sm mb-8 space-y-4">
        <div className="flex items-center gap-3">
          <Badge label="Editorial Desk" color={category.color} size="sm" />
          <span className="text-xs font-mono text-neutral-400 font-bold">{categoryPosts.length} Published Reports</span>
        </div>

        <h1 className="font-serif text-3xl sm:text-5xl font-extrabold text-neutral-950 dark:text-neutral-50">
          {category.name}
        </h1>

        <p className="text-base text-neutral-600 dark:text-neutral-300 max-w-3xl leading-relaxed">
          {category.description}
        </p>
      </div>

      {/* Top Header Leaderboard Ad */}
      <AdSenseUnit slotType="headerLeaderboard" customLabel={`Sponsored ${category.name} Partners`} />

      {/* Articles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 my-8">
        {paginatedCategoryPosts.map((post) => (
          <React.Fragment key={post.id}>
            <ArticleCard post={post} />
          </React.Fragment>
        ))}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="p-4 bg-white dark:bg-[#111622] rounded-2xl border border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs shadow-sm mb-8">
          <span className="text-neutral-500 font-mono">
            Showing Page <span className="font-bold text-neutral-900 dark:text-neutral-100">{validPage}</span> of <span className="font-bold text-neutral-900 dark:text-neutral-100">{totalPages}</span> ({totalPosts} articles in {category.name})
          </span>

          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => handlePageChange(validPage - 1)}
              disabled={validPage <= 1}
              className="px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-all font-semibold flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>

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

      {categoryPosts.length === 0 && (
        <div className="text-center py-16 text-neutral-400 bg-white dark:bg-[#111622] rounded-2xl border border-neutral-200 dark:border-neutral-800 my-8">
          <Layers className="w-12 h-12 mx-auto mb-2 opacity-40" />
          <p className="text-base font-semibold">No articles currently published in this desk.</p>
          <p className="text-xs text-neutral-500 mt-1">Our editorial correspondents are researching upcoming briefs.</p>
        </div>
      )}

      <NewsletterBox />
    </div>
  );
};
