import React, { useState, useEffect } from 'react';
import { useBlog } from '../../context/BlogContext';
import { Search, X, BookOpen, Clock, Tag, ArrowRight } from 'lucide-react';
import { Badge } from './Badge';

export const SearchModal = () => {
  const { searchOpen, setSearchOpen, posts, categories, navigate } = useBlog();
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen(prev => !prev);
      }
      if (e.key === 'Escape' && searchOpen) {
        setSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchOpen, setSearchOpen]);

  if (!searchOpen) return null;

  const filteredPosts = posts.filter(post => {
    if (post.status !== 'published') return false;
    const matchesCategory = selectedCategory === 'all' || post.categoryId === selectedCategory;
    const matchesQuery = 
      post.title.toLowerCase().includes(query.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(query.toLowerCase()) ||
      (post.tags && post.tags.some(t => t.toLowerCase().includes(query.toLowerCase())));
    return matchesCategory && matchesQuery;
  });

  const handleSelectPost = (slug) => {
    setSearchOpen(false);
    navigate(`/post/${slug}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-2xl bg-white dark:bg-[#111622] rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden flex flex-col max-h-[80vh]">
        {/* Search Header */}
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center gap-3">
          <Search className="w-5 h-5 text-neutral-400" />
          <input
            type="text"
            placeholder="Search investigative articles, finance blueprints, AI guides... (Press ESC to exit)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="flex-1 bg-transparent text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none text-base"
          />
          {query && (
            <button onClick={() => setQuery('')} className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded">
              <X className="w-4 h-4 text-neutral-400" />
            </button>
          )}
          <button 
            onClick={() => setSearchOpen(false)}
            className="p-1.5 text-xs font-mono bg-neutral-100 dark:bg-neutral-800 rounded text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
          >
            ESC
          </button>
        </div>

        {/* Category Filter Pills */}
        <div className="p-3 bg-neutral-50 dark:bg-neutral-900/50 border-b border-neutral-200 dark:border-neutral-800 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1 text-xs rounded-full whitespace-nowrap transition-colors ${selectedCategory === 'all' ? 'bg-blue-600 text-white font-semibold' : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-300'}`}
          >
            All Topics ({posts.filter(p => p.status === 'published').length})
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1 text-xs rounded-full whitespace-nowrap transition-colors ${selectedCategory === cat.id ? 'bg-blue-600 text-white font-semibold' : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-300'}`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 divide-y divide-neutral-100 dark:divide-neutral-800/60">
          {filteredPosts.length === 0 ? (
            <div className="text-center py-12 text-neutral-400">
              <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No editorial pieces matched "{query}"</p>
              <p className="text-xs text-neutral-500 mt-1">Try keywords like 'treasury', 'AI agents', 'sleep', 'indexing'</p>
            </div>
          ) : (
            filteredPosts.map(post => {
              const cat = categories.find(c => c.id === post.categoryId);
              return (
                <div
                  key={post.id}
                  onClick={() => handleSelectPost(post.slug)}
                  className="pt-3 first:pt-0 group cursor-pointer flex items-center justify-between gap-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/40 p-2 rounded-xl transition-all"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge label={cat?.name || 'Article'} color={cat?.color || 'blue'} size="xs" />
                      <span className="text-[11px] text-neutral-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {post.readTime}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {post.title}
                    </h4>
                    <p className="text-xs text-neutral-500 line-clamp-1">
                      {post.excerpt}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all flex-shrink-0" />
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
