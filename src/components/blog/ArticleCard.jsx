import React from 'react';
import { useBlog } from '../../context/BlogContext';
import { Clock, Eye, Bookmark, ArrowRight } from 'lucide-react';
import { Badge } from '../common/Badge';

export const ArticleCard = ({ post, variant = 'standard' }) => {
  const { categories, authors, navigate, toggleBookmark, bookmarks } = useBlog();
  const category = categories.find(c => c.id === post.categoryId);
  const author = authors.find(a => a.id === post.authorId);
  const isSaved = bookmarks.includes(post.slug);

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date(post.publishedAt || Date.now()));

  const handleClick = () => {
    navigate(`#/post/${post.slug}`);
  };

  const handleBookmark = (e) => {
    e.stopPropagation();
    toggleBookmark(post.slug);
  };

  if (variant === 'compact') {
    return (
      <div 
        onClick={handleClick}
        className="group cursor-pointer flex items-start gap-4 p-3 rounded-2xl hover:bg-neutral-100 dark:hover:bg-neutral-800/50 transition-all font-sans"
      >
        <img 
          src={post.coverImage} 
          alt={post.title}
          className="w-20 h-20 object-cover rounded-xl flex-shrink-0 group-hover:scale-105 transition-transform duration-300 shadow-sm border border-neutral-200 dark:border-neutral-700" 
        />
        <div className="space-y-1 flex-1">
          <Badge label={category?.name || 'Analysis'} color={category?.color || 'blue'} size="xs" />
          <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 leading-snug">
            {post.title}
          </h4>
          <span className="text-[11px] text-neutral-500 flex items-center gap-1 font-mono">
            <Clock className="w-3 h-3" /> {post.readTime}
          </span>
        </div>
      </div>
    );
  }

  return (
    <article 
      onClick={handleClick}
      className="group cursor-pointer flex flex-col bg-white dark:bg-[#111622] rounded-3xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 transform hover:-translate-y-1 relative font-sans"
    >
      {/* Cover Image Container */}
      <div className="relative aspect-[16/10] overflow-hidden bg-neutral-100 dark:bg-neutral-800">
        <img 
          src={post.coverImage} 
          alt={post.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          loading="lazy"
        />
        <div className="absolute top-3 left-3">
          <Badge label={category?.name || 'Analysis'} color={category?.color || 'blue'} size="sm" />
        </div>

        {/* Bookmark Quick Action */}
        <button
          onClick={handleBookmark}
          className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-all ${
            isSaved 
              ? 'bg-blue-600 text-white shadow-md' 
              : 'bg-black/40 text-white/80 hover:bg-black/60 hover:text-white'
          }`}
          title={isSaved ? 'Saved in reading list' : 'Save article'}
        >
          <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* Card Content */}
      <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2.5">
          <div className="flex items-center space-x-3 text-xs text-neutral-500 dark:text-neutral-400 font-mono">
            <span>{formattedDate}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> {post.readTime}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" /> {(post.views || 0).toLocaleString()} views
            </span>
          </div>

          <h3 className="font-serif text-lg sm:text-xl font-bold text-neutral-950 dark:text-neutral-50 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-snug line-clamp-2">
            {post.title}
          </h3>

          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 line-clamp-3 leading-relaxed">
            {post.excerpt}
          </p>
        </div>

        {/* Card Footer: Author & Read More */}
        <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <img 
              src={author?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150'} 
              alt={author?.name}
              className="w-7 h-7 rounded-full object-cover ring-1 ring-neutral-200 dark:ring-neutral-700" 
            />
            <div className="text-xs">
              <span className="font-semibold text-neutral-800 dark:text-neutral-200 block line-clamp-1">
                {author?.name}
              </span>
            </div>
          </div>

          <span className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            <span>Read Article</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </article>
  );
};
