import React from 'react';
import { useBlog } from '../context/BlogContext';
import { FileQuestion, Home, Search, Compass, Clock, ArrowRight, Sparkles, ShieldCheck } from 'lucide-react';
import { Badge } from '../components/common/Badge';

export const NotFoundPage = ({ isAdmin = false }) => {
  const { navigate, categories, posts, setSearchOpen } = useBlog();

  const popularPosts = posts.filter(p => p.status === 'published').slice(0, 4);

  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center py-16 px-4 sm:px-6 text-center animate-fadeIn font-sans">
      <div className="max-w-3xl w-full mx-auto space-y-8">
        {/* 404 Visual Icon Badge */}
        <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 rounded-3xl shadow-sm mx-auto">
          <FileQuestion className="w-10 h-10" />
        </div>

        {/* 404 Headline & Subtitle */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 rounded-full text-xs font-mono font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
            <span>404 Error • Page Not Found</span>
          </div>

          <h1 className="font-serif text-3xl sm:text-5xl font-black text-neutral-900 dark:text-neutral-50 tracking-tight leading-tight">
            {isAdmin ? 'Editorial Resource Not Found' : 'The Article You Are Looking For Is Unavailable'}
          </h1>

          <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 max-w-xl mx-auto leading-relaxed">
            {isAdmin 
              ? 'The administrative route or CMS entry you requested does not exist or has been relocated.' 
              : 'The editorial dispatch, analysis, or resource you requested may have been archived, renamed, or temporarily moved.'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            onClick={() => navigate(isAdmin ? '/admin' : '/')}
            className="px-6 py-3 bg-neutral-950 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-950 rounded-2xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>{isAdmin ? 'Return to CMS Dashboard' : 'Back to Executive Homepage'}</span>
          </button>

          {!isAdmin && (
            <button
              onClick={() => setSearchOpen(true)}
              className="px-6 py-3 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-2xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all shadow-xs active:scale-95 cursor-pointer"
            >
              <Search className="w-4 h-4" />
              <span>Search Editorial Archive</span>
            </button>
          )}
        </div>

        {/* Suggested Categories */}
        {!isAdmin && categories.length > 0 && (
          <div className="pt-8 border-t border-neutral-200 dark:border-neutral-800">
            <p className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-3">
              Explore Featured Editorial Desks:
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {categories.slice(0, 6).map(cat => (
                <button
                  key={cat.id}
                  onClick={() => navigate(`/category/${cat.slug}`)}
                  className="px-3.5 py-1.5 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-semibold text-neutral-800 dark:text-neutral-200 transition-all hover:border-blue-400 dark:hover:border-blue-500 shadow-xs cursor-pointer"
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Suggested Trending Articles */}
        {!isAdmin && popularPosts.length > 0 && (
          <div className="text-left bg-white dark:bg-[#111622] rounded-3xl border border-neutral-200 dark:border-neutral-800 p-6 sm:p-8 shadow-sm">
            <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h3 className="font-serif font-bold text-sm sm:text-base text-neutral-900 dark:text-neutral-100">
                  Recommended Investigative Dispatches
                </h3>
              </div>
              <span className="text-[11px] font-mono text-neutral-400">Trending Now</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {popularPosts.map(post => {
                const cat = categories.find(c => c.id === post.categoryId);
                return (
                  <div
                    key={post.id}
                    onClick={() => navigate(`/post/${post.slug}`)}
                    className="p-3.5 bg-neutral-50 dark:bg-neutral-900/60 hover:bg-blue-50/50 dark:hover:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-800 hover:border-blue-300 dark:hover:border-blue-600 rounded-2xl cursor-pointer flex items-center space-x-3.5 transition-all group"
                  >
                    <img
                      src={post.coverImage}
                      alt={post.title}
                      className="w-16 h-16 rounded-xl object-cover flex-shrink-0 border border-neutral-200 dark:border-neutral-700"
                    />
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge label={cat?.name || 'Analysis'} color={cat?.color || 'blue'} size="xs" />
                        <span className="text-[10px] text-neutral-400 font-mono flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          {post.readTime || '5 min read'}
                        </span>
                      </div>
                      <h4 className="font-serif font-bold text-xs text-neutral-900 dark:text-neutral-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 line-clamp-2 leading-snug transition-colors">
                        {post.title}
                      </h4>
                    </div>
                    <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
