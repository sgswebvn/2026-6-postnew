import React from 'react';
import { useBlog } from '../../context/BlogContext';
import { Badge } from '../common/Badge';
import { Clock, TrendingUp, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';

export const HeroFeatured = () => {
  const { posts, categories, authors, navigate } = useBlog();

  const published = posts.filter(p => p.status === 'published');
  const leadPost = published.find(p => p.featured) || published[0];
  const trendingPosts = published.filter(p => p.id !== leadPost?.id).slice(0, 3);

  if (!leadPost) return null;

  const leadCategory = categories.find(c => c.id === leadPost.categoryId);
  const leadAuthor = authors.find(a => a.id === leadPost.authorId);

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date(leadPost.publishedAt));

  return (
    <section className="mb-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Main Lead Story (Left 7 Cols) */}
        <div 
          onClick={() => navigate(`#/post/${leadPost.slug}`)}
          className="lg:col-span-7 group cursor-pointer flex flex-col justify-between bg-white dark:bg-[#111622] rounded-3xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300"
        >
          <div className="relative aspect-[16/9] sm:aspect-[21/11] overflow-hidden bg-neutral-900">
            <img 
              src={leadPost.coverImage} 
              alt={leadPost.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
            
            <div className="absolute top-4 left-4 flex items-center gap-2">
              <span className="px-3 py-1 bg-rose-600 text-white text-xs font-extrabold uppercase tracking-wider rounded-full shadow flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Featured Lead
              </span>
              <Badge label={leadCategory?.name || 'Feature'} color={leadCategory?.color || 'blue'} size="sm" />
            </div>

            <div className="absolute bottom-4 left-4 right-4 text-white">
              <div className="flex items-center space-x-3 text-xs text-neutral-300 font-mono mb-1">
                <span>{formattedDate}</span>
                <span>•</span>
                <span>{leadPost.readTime}</span>
              </div>
              <h2 className="font-serif text-xl sm:text-2xl lg:text-3xl font-bold leading-tight drop-shadow-md group-hover:text-blue-300 transition-colors">
                {leadPost.title}
              </h2>
            </div>
          </div>

          <div className="p-6 flex flex-col justify-between flex-1 space-y-4">
            <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-300 leading-relaxed line-clamp-3">
              {leadPost.excerpt}
            </p>

            <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <img 
                  src={leadAuthor?.avatar} 
                  alt={leadAuthor?.name}
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-blue-500/30" 
                />
                <div>
                  <span className="font-semibold text-sm text-neutral-900 dark:text-neutral-100 block">
                    {leadAuthor?.name}
                  </span>
                  <span className="text-xs text-neutral-500 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-blue-500" /> {leadAuthor?.role}
                  </span>
                </div>
              </div>

              <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300 text-xs font-bold uppercase tracking-wider group-hover:bg-blue-600 group-hover:text-white transition-all">
                <span>Read Full Story</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </span>
            </div>
          </div>
        </div>

        {/* Trending Stories Grid (Right 5 Cols) */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-neutral-100">
              <TrendingUp className="w-4 h-4 text-rose-500" />
              <span>Trending & Highly Read</span>
            </div>
            <span className="text-[11px] font-mono text-neutral-400">Top 3 Today</span>
          </div>

          <div className="space-y-4 flex-1 flex flex-col justify-between">
            {trendingPosts.map((post, idx) => {
              const cat = categories.find(c => c.id === post.categoryId);
              return (
                <div
                  key={post.id}
                  onClick={() => navigate(`#/post/${post.slug}`)}
                  className="group cursor-pointer p-4 bg-white dark:bg-[#111622] rounded-2xl border border-neutral-200 dark:border-neutral-800 hover:border-blue-500/50 shadow-sm hover:shadow-md transition-all flex items-start gap-4"
                >
                  <span className="font-serif text-3xl font-black text-neutral-300 dark:text-neutral-700 group-hover:text-blue-500 transition-colors flex-shrink-0">
                    0{idx + 1}
                  </span>

                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Badge label={cat?.name || 'Topic'} color={cat?.color || 'blue'} size="xs" />
                      <span className="text-[11px] text-neutral-400 font-mono">{post.readTime}</span>
                    </div>
                    <h3 className="font-serif text-sm sm:text-base font-bold text-neutral-900 dark:text-neutral-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 leading-snug">
                      {post.title}
                    </h3>
                    <p className="text-xs text-neutral-500 line-clamp-1">
                      {post.excerpt}
                    </p>
                  </div>

                  <img 
                    src={post.coverImage} 
                    alt={post.title}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover flex-shrink-0 group-hover:scale-105 transition-transform" 
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
