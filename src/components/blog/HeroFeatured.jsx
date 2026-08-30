import React from 'react';
import { useBlog } from '../../context/BlogContext';
import { Badge } from '../common/Badge';
import { Clock, TrendingUp, ArrowRight } from 'lucide-react';
import { getOptimizedImageUrl } from '../../utils/imageOptimizer';

export const HeroFeatured = () => {
  const { posts, categories, authors, navigate } = useBlog();

  const published = posts.filter(p => p.status === 'published');
  const leadPost = published.find(p => p.featured) || published[0];
  const trendingPosts = published.filter(p => p.id !== leadPost?.id).slice(0, 3);

  if (!leadPost) return null;

  const leadCategory = categories.find(c => c.id === leadPost.categoryId);
  const leadAuthor = authors.find(a => a.id === leadPost.authorId);

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date(leadPost.publishedAt));

  return (
    <section className="mb-10">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Main Lead Story (Left 7 Cols) */}
        <div 
          onClick={() => navigate(`/post/${leadPost.slug}`)}
          className="lg:col-span-7 group cursor-pointer flex flex-col justify-between bg-white dark:bg-[#111622] rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden hover:border-neutral-400 dark:hover:border-neutral-700 transition-all"
        >
          <div className="relative aspect-[16/9] sm:aspect-[21/11] overflow-hidden bg-neutral-900">
            <img 
              src={getOptimizedImageUrl(leadPost.coverImage, 960)} 
              alt={leadPost.title}
              decoding="async"
              className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
            
            <div className="absolute top-4 left-4 flex items-center gap-2">
              <Badge label={leadCategory?.name || 'Lead Story'} size="sm" />
            </div>

            <div className="absolute bottom-4 left-4 right-4 text-white">
              <div className="flex items-center space-x-2 text-xs text-neutral-300 font-mono mb-1">
                <span>{formattedDate}</span>
                <span>•</span>
                <span>{leadPost.readTime}</span>
              </div>
              <h2 className="font-serif text-lg sm:text-2xl font-bold leading-snug group-hover:text-neutral-200 transition-colors">
                {leadPost.title}
              </h2>
            </div>
          </div>

          <div className="p-5 flex flex-col justify-between flex-1 space-y-4">
            <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed line-clamp-2">
              {leadPost.excerpt}
            </p>

            <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <img 
                  src={leadAuthor?.avatar} 
                  alt={leadAuthor?.name}
                  className="w-8 h-8 rounded-full object-cover border border-neutral-200 dark:border-neutral-700" 
                />
                <div>
                  <span className="font-semibold text-xs text-neutral-900 dark:text-neutral-100 block">
                    {leadAuthor?.name}
                  </span>
                  <span className="text-[11px] text-neutral-500">
                    {leadAuthor?.role}
                  </span>
                </div>
              </div>

              <span className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-900 dark:text-neutral-100 group-hover:underline">
                <span>Read Story</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        </div>

        {/* Trending Stories Grid (Right 5 Cols) */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-neutral-100">
              <TrendingUp className="w-3.5 h-3.5 text-neutral-500" />
              <span>Trending Dispatches</span>
            </div>
          </div>

          <div className="space-y-3 flex-1 flex flex-col justify-between">
            {trendingPosts.map((post, idx) => {
              const cat = categories.find(c => c.id === post.categoryId);
              return (
                <div
                  key={post.id}
                  onClick={() => navigate(`/post/${post.slug}`)}
                  className="group cursor-pointer p-3.5 rounded-xl bg-white dark:bg-[#111622] border border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-700 transition-all flex items-start gap-3.5"
                >
                  <span className="font-serif font-black text-lg text-neutral-400 dark:text-neutral-600 flex-shrink-0 w-5">
                    0{idx + 1}
                  </span>
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[10px] font-mono text-neutral-500 uppercase">{cat?.name}</span>
                      <span className="text-neutral-300 dark:text-neutral-700">•</span>
                      <span className="text-[10px] text-neutral-400 font-mono">{post.readTime}</span>
                    </div>
                    <h3 className="font-serif text-xs font-bold text-neutral-900 dark:text-neutral-100 group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors line-clamp-2 leading-snug">
                      {post.title}
                    </h3>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
