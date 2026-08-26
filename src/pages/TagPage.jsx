import React from 'react';
import { useBlog } from '../context/BlogContext';
import { ArticleCard } from '../components/blog/ArticleCard';
import { AdSenseUnit } from '../components/ads/AdSenseUnit';
import { Tag, ChevronRight } from 'lucide-react';

export const TagPage = ({ tag }) => {
  const { posts, navigate } = useBlog();
  const decodedTag = decodeURIComponent(tag || '');

  const taggedPosts = posts.filter(p => 
    p.status === 'published' && 
    p.tags && 
    p.tags.some(t => t.toLowerCase() === decodedTag.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn">
      <div className="flex items-center space-x-2 text-xs text-neutral-500 font-mono mb-6">
        <button onClick={() => navigate('#/')} className="hover:text-blue-600">Home</button>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-neutral-400">Tags</span>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-neutral-900 dark:text-white font-bold">#{decodedTag}</span>
      </div>

      <div className="p-8 rounded-3xl bg-white dark:bg-[#111622] border border-neutral-200 dark:border-neutral-800 shadow-sm mb-8 space-y-2">
        <div className="flex items-center gap-2 text-xs font-mono text-blue-500 font-bold uppercase">
          <Tag className="w-4 h-4" />
          <span>Topic Archive</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-neutral-950 dark:text-neutral-50">
          Articles tagged with "#{decodedTag}"
        </h1>
        <p className="text-sm text-neutral-500">
          Curated analyses and reports matching this specific investment or technology theme.
        </p>
      </div>

      <AdSenseUnit slotType="headerLeaderboard" customLabel={`Sponsored #${decodedTag} Partners`} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 my-8">
        {taggedPosts.map(post => (
          <ArticleCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
};
