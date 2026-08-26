import React, { useEffect, useState } from 'react';
import { useBlog } from '../context/BlogContext';
import { storageService } from '../services/storageService';
import { Badge } from '../components/common/Badge';
import { AdSenseUnit } from '../components/ads/AdSenseUnit';
import { TableOfContents } from '../components/blog/TableOfContents';
import { AuthorBioCard } from '../components/blog/AuthorBioCard';
import { SocialShareBar } from '../components/blog/SocialShareBar';
import { CommentsSection } from '../components/blog/CommentsSection';
import { ArticleCard } from '../components/blog/ArticleCard';
import { NewsletterBox } from '../components/blog/NewsletterBox';
import { ReadingProgressBar } from '../components/layout/ReadingProgressBar';
import { 
  Clock, 
  Eye, 
  Calendar, 
  ShieldCheck, 
  ChevronRight, 
  Bookmark, 
  Share2, 
  ArrowLeft, 
  Sparkles,
  Tag,
  Volume2,
  VolumeX,
  Type
} from 'lucide-react';

export const PostDetailPage = ({ slug }) => {
  const { posts, categories, authors, navigate, toggleBookmark, bookmarks } = useBlog();
  const [fontSize, setFontSize] = useState('base'); // 'sm' | 'base' | 'lg'
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const post = posts.find(p => p.slug === slug);
  const isSaved = bookmarks.includes(slug);

  useEffect(() => {
    if (slug) {
      storageService.incrementView(slug);
    }
    // Cleanup speech synthesis on unmount
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [slug]);

  if (!post) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="font-serif text-3xl font-bold">Article Not Found</h2>
        <p className="text-neutral-500">The editorial piece you are seeking may have been renamed or archived.</p>
        <button
          onClick={() => navigate('#/')}
          className="px-6 py-2.5 bg-blue-600 text-white text-xs font-bold uppercase rounded-xl"
        >
          Return to Front Page
        </button>
      </div>
    );
  }

  const category = categories.find(c => c.id === post.categoryId);
  const author = authors.find(a => a.id === post.authorId);
  const factChecker = authors.find(a => a.id === post.factCheckerId) || authors.find(a => a.id === 'author-4');

  const relatedPosts = posts
    .filter(p => p.id !== post.id && p.status === 'published' && p.categoryId === post.categoryId)
    .slice(0, 2);

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date(post.publishedAt));

  const handleToggleSpeech = () => {
    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis audio is not supported in this browser.');
      return;
    }

    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
    } else {
      const cleanText = `${post.title}. ${post.excerpt}. ` + post.content.replace(/<[^>]*>/g, ' ');
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = 'en-US';
      utterance.rate = 1.0;
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);
      window.speechSynthesis.speak(utterance);
      setIsPlayingAudio(true);
    }
  };

  const fontSizeClasses = {
    sm: 'text-base leading-relaxed',
    base: 'text-lg leading-relaxed',
    lg: 'text-xl leading-loose',
  };

  return (
    <>
      <ReadingProgressBar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn font-sans">
        {/* Top Breadcrumbs */}
        <div className="flex items-center space-x-2 text-xs text-neutral-500 font-mono mb-6 overflow-x-auto no-scrollbar">
          <button onClick={() => navigate('#/')} className="hover:text-blue-600 transition-colors">Home</button>
          <ChevronRight className="w-3.5 h-3.5" />
          <button onClick={() => navigate(`#/category/${category?.slug}`)} className="hover:text-blue-600 transition-colors">
            {category?.name || 'Category'}
          </button>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-neutral-400 truncate max-w-[200px] sm:max-w-md">{post.title}</span>
        </div>

        {/* Top Header Leaderboard Ad */}
        {post.enableAds && (
          <AdSenseUnit slotType="headerLeaderboard" customLabel="Sponsored Executive Leaderboard" />
        )}

        {/* Article Header */}
        <header className="max-w-4xl mx-auto space-y-5 text-center sm:text-left mb-8">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <Badge label={category?.name || 'Analysis'} color={category?.color || 'blue'} size="md" />
            <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-md text-xs font-mono font-bold uppercase flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> E-E-A-T Verified
            </span>
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-extrabold text-neutral-950 dark:text-neutral-50 leading-[1.18] tracking-tight">
            {post.title}
          </h1>

          <p className="text-base sm:text-lg text-neutral-600 dark:text-neutral-300 leading-relaxed font-sans">
            {post.excerpt}
          </p>

          {/* Reading Toolbar: Audio, Font size, Bookmark */}
          <div className="p-3 bg-neutral-100/70 dark:bg-neutral-900/60 rounded-2xl border border-neutral-200 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Audio Reader */}
            <button
              onClick={handleToggleSpeech}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-semibold transition-all ${
                isPlayingAudio 
                  ? 'bg-blue-600 text-white shadow' 
                  : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200'
              }`}
            >
              {isPlayingAudio ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-blue-500" />}
              <span>{isPlayingAudio ? 'Stop Audio' : '🎧 Listen to Article (Audio)'}</span>
            </button>

            {/* Font Size Adjuster */}
            <div className="flex items-center space-x-1 bg-white dark:bg-neutral-800 p-1 rounded-xl border border-neutral-200 dark:border-neutral-700">
              <span className="text-[11px] font-mono px-2 text-neutral-400 flex items-center gap-1">
                <Type className="w-3.5 h-3.5" /> Font Size:
              </span>
              <button
                onClick={() => setFontSize('sm')}
                className={`px-2 py-0.5 rounded text-xs ${fontSize === 'sm' ? 'bg-blue-600 text-white font-bold' : 'text-neutral-600 dark:text-neutral-400'}`}
              >
                A-
              </button>
              <button
                onClick={() => setFontSize('base')}
                className={`px-2 py-0.5 rounded text-xs ${fontSize === 'base' ? 'bg-blue-600 text-white font-bold' : 'text-neutral-600 dark:text-neutral-400'}`}
              >
                A
              </button>
              <button
                onClick={() => setFontSize('lg')}
                className={`px-2 py-0.5 rounded text-xs ${fontSize === 'lg' ? 'bg-blue-600 text-white font-bold' : 'text-neutral-600 dark:text-neutral-400'}`}
              >
                A+
              </button>
            </div>

            {/* Bookmark Toggle */}
            <button
              onClick={() => toggleBookmark(post.slug)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold transition-all ${
                isSaved 
                  ? 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-300 border border-blue-200 dark:border-blue-800' 
                  : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200'
              }`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current text-blue-600' : ''}`} />
              <span>{isSaved ? 'Saved in Reading List' : 'Save for Later'}</span>
            </button>
          </div>

          {/* Author Byline & Meta */}
          <div className="pt-4 border-t border-b border-neutral-200 dark:border-neutral-800 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3.5">
              <img 
                src={author?.avatar} 
                alt={author?.name}
                className="w-12 h-12 rounded-full object-cover ring-2 ring-blue-500/30" 
              />
              <div className="text-left">
                <span className="font-bold text-sm text-neutral-900 dark:text-neutral-100 block">
                  {author?.name}
                </span>
                <span className="text-xs text-neutral-500 block">
                  {author?.role} • <span className="font-mono text-neutral-400">{formattedDate}</span>
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3 text-xs text-neutral-400 font-mono">
                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {post.readTime}</span>
                <span>•</span>
                <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {(post.views || 0).toLocaleString()} views</span>
              </div>
              <SocialShareBar title={post.title} />
            </div>
          </div>
        </header>

        {/* Featured Cover Image */}
        <div className="max-w-4xl mx-auto mb-10">
          <div className="aspect-[16/9] rounded-3xl overflow-hidden shadow-2xl border border-neutral-200 dark:border-neutral-800">
            <img 
              src={post.coverImage} 
              alt={post.title}
              className="w-full h-full object-cover" 
            />
          </div>
          <p className="text-center text-xs text-neutral-500 font-mono mt-2 italic">
            Editorial Photo Archive: {post.title} • Verified for The Horizon Post.
          </p>
        </div>

        {/* Main Grid: Article Body + Sticky Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start max-w-6xl mx-auto">
          {/* Main Article Body (8 Cols) */}
          <article className="lg:col-span-8 space-y-6">
            {/* Table of Contents */}
            <TableOfContents contentHtml={post.content} />

            {/* High-CTR In-Article Ad Slot 1 (After Intro Paragraph 2) */}
            {post.enableAds && (
              <AdSenseUnit slotType="inArticleTop" customLabel="Sponsored Financial Recommendation" />
            )}

            {/* Rich Editorial Body with Dynamic Font Size */}
            <div 
              className={`editorial-prose ${fontSizeClasses[fontSize]}`}
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            {/* High-CTR In-Article Ad Slot 2 (Mid-Article Paragraph 5) */}
            {post.enableAds && (
              <AdSenseUnit slotType="inArticleMid" customLabel="Sponsored Enterprise Computing Partner" />
            )}

            {/* Tags Strip */}
            {post.tags && post.tags.length > 0 && (
              <div className="pt-6 border-t border-neutral-200 dark:border-neutral-800 flex flex-wrap items-center gap-2">
                <span className="text-xs font-mono font-bold text-neutral-400 flex items-center gap-1 mr-1">
                  <Tag className="w-3.5 h-3.5" /> Indexed Tags:
                </span>
                {post.tags.map((tag, idx) => (
                  <button
                    key={idx}
                    onClick={() => navigate(`#/tag/${encodeURIComponent(tag)}`)}
                    className="px-3 py-1 bg-neutral-100 dark:bg-neutral-800 hover:bg-blue-50 dark:hover:bg-blue-950 text-neutral-700 dark:text-neutral-300 hover:text-blue-500 rounded-lg text-xs font-mono transition-colors"
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            )}

            {/* Social Share Bar Bottom */}
            <div className="p-4 bg-neutral-50 dark:bg-neutral-900/40 rounded-2xl border border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                Found this analysis valuable? Share with your executive network:
              </span>
              <SocialShareBar title={post.title} />
            </div>

            {/* Author Bio Card (E-E-A-T Guarantee) */}
            <AuthorBioCard author={author} factChecker={factChecker} />

            {/* Multiplex / Matched Content Ad Unit */}
            {post.enableAds && (
              <AdSenseUnit slotType="multiplexBottom" customLabel="Recommended Partner Intelligence (Multiplex)" />
            )}

            {/* Related Articles Section */}
            {relatedPosts.length > 0 && (
              <div className="my-10 space-y-4">
                <h3 className="font-serif text-2xl font-bold text-neutral-950 dark:text-neutral-50 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-blue-500" />
                  <span>Related Editorial Analyses</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {relatedPosts.map(rel => (
                    <ArticleCard key={rel.id} post={rel} />
                  ))}
                </div>
              </div>
            )}

            {/* Comments & Discussion */}
            <CommentsSection postId={post.id} />
          </article>

          {/* Right 4 Cols: Sticky Sidebar with High RPM Ad Unit */}
          <aside className="lg:col-span-4 space-y-8 sticky top-24">
            {/* Sticky High-RPM Half-Page Ad (300x600) */}
            {post.enableAds && (
              <div className="bg-white dark:bg-[#111622] p-4 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
                <AdSenseUnit slotType="sidebarSticky" customLabel="AdSense Sticky Unit (300x600)" />
              </div>
            )}

            {/* Compact Newsletter Widget */}
            <NewsletterBox compact={true} />

            {/* Fact Checking Policy Sidebar Card */}
            <div className="p-5 bg-white dark:bg-[#111622] rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
                <span>Editorial Safeguards</span>
              </div>
              <p className="text-xs text-neutral-500 leading-relaxed">
                All data points, APY metrics, and technical benchmarks are corroborated with SEC filings, Federal Reserve releases, and peer-reviewed journals before publication.
              </p>
              <button 
                onClick={() => navigate('#/about')}
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
              >
                Read our Editorial Guidelines →
              </button>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
};
