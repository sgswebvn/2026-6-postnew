import React from 'react';
import { useBlog } from '../../context/BlogContext';
import { Clock, Bookmark, ArrowRight } from 'lucide-react';
import { Badge } from '../common/Badge';
import { getOptimizedImageUrl } from '../../utils/imageOptimizer';

export const ArticleCard = ({ post, variant = 'standard' }) => {
  const { categories, authors, navigate, toggleBookmark, bookmarks } = useBlog();
  const category = categories.find(c => c.id === post.categoryId);
  const author = authors.find(a => a.id === post.authorId);
  const isSaved = bookmarks.includes(post.slug);

  const cardDate = new Date(post.publishedAt || Date.now());
  const formattedDate = Number.isNaN(cardDate.getTime())
    ? ''
    : new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(cardDate);

  const handleClick = () => {
    navigate(`/post/${post.slug}`);
  };

  const handleBookmark = (e) => {
    e.stopPropagation();
    toggleBookmark(post.slug);
  };

  if (variant === 'compact') {
    return (
      <div 
        onClick={handleClick}
        className="group cursor-pointer flex items-start gap-3.5 p-2.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800/50 transition-all font-sans"
      >
        <img 
          src={getOptimizedImageUrl(post.coverImage, 160)} 
          alt={post.title}
          loading="lazy"
          decoding="async"
          className="w-16 h-16 object-cover rounded-lg flex-shrink-0 border border-neutral-200 dark:border-neutral-700" 
        />
        <div className="space-y-1 flex-1">
          <Badge label={category?.name || 'Article'} size="xs" />
          <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors line-clamp-2 leading-snug">
            {post.title}
          </h4>
          <span className="text-[10px] text-neutral-400 font-mono">
            {post.readTime}
          </span>
        </div>
      </div>
    );
  }

  return (
    <article 
      onClick={handleClick}
      className="group cursor-pointer flex flex-col bg-white dark:bg-[#111622] rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden hover:border-neutral-400 dark:hover:border-neutral-700 transition-all font-sans"
    >
      {/* Cover Image Container */}
      <div className="relative aspect-[16/10] overflow-hidden bg-neutral-100 dark:bg-neutral-800">
        <img 
          src={getOptimizedImageUrl(post.coverImage, 640)} 
          alt={post.title}
          className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
          loading="lazy"
          decoding="async"
        />
        <div className="absolute top-3 left-3">
          <Badge label={category?.name || 'Article'} size="sm" />
        </div>

        {/* Bookmark Quick Action */}
        <button
          onClick={handleBookmark}
          className={`absolute top-3 right-3 p-1.5 rounded-full backdrop-blur-md transition-all ${
            isSaved 
              ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-sm' 
              : 'bg-black/40 text-white/80 hover:bg-black/60 hover:text-white'
          }`}
          title={isSaved ? 'Saved in reading list' : 'Save article'}
        >
          <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* Card Content */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-[11px] text-neutral-400 font-mono">
            <span>{formattedDate}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" /> {post.readTime}
            </span>
          </div>

          <h3 className="font-serif text-base sm:text-lg font-bold text-neutral-950 dark:text-neutral-50 group-hover:text-neutral-700 dark:group-hover:text-neutral-300 transition-colors leading-snug line-clamp-2">
            {post.title}
          </h3>

          <p className="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-2 leading-relaxed">
            {post.excerpt}
          </p>
        </div>

        {/* Card Footer: Author Info */}
        <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <img 
              src={author?.avatar} 
              alt={author?.name}
              className="w-6 h-6 rounded-full object-cover border border-neutral-200 dark:border-neutral-700" 
            />
            <span className="text-xs text-neutral-700 dark:text-neutral-300 font-medium">
              {author?.name}
            </span>
          </div>

          <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 group-hover:underline flex items-center gap-1">
            <span>Read</span>
            <ArrowRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </article>
  );
};
