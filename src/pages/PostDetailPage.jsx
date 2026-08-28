import React, { useEffect, useState } from 'react';
import { useBlog } from '../context/BlogContext';
import { storageService } from '../services/storageService';
import { telemetryService } from '../services/telemetryService';
import { Badge } from '../components/common/Badge';
import { AdSenseUnit } from '../components/ads/AdSenseUnit';
import { TableOfContents } from '../components/blog/TableOfContents';
import { AuthorBioCard } from '../components/blog/AuthorBioCard';
import { SocialShareBar } from '../components/blog/SocialShareBar';
import { CommentsSection } from '../components/blog/CommentsSection';
import { ArticleCard } from '../components/blog/ArticleCard';
import { NewsletterBox } from '../components/blog/NewsletterBox';
import { ReadingProgressBar } from '../components/layout/ReadingProgressBar';
import { AffiliateShowcaseBox } from '../components/blog/AffiliateShowcaseBox';
import { 
  Clock, 
  Eye, 
  Calendar, 
  ShieldCheck, 
  ChevronRight, 
  Bookmark, 
  Sparkles,
  Volume2,
  VolumeX,
  Type,
  ThumbsUp,
  Lightbulb,
  TrendingUp,
  Brain,
  FileText
} from 'lucide-react';

export const PostDetailPage = ({ slug }) => {
  const { posts, categories, authors, settings, navigate, toggleBookmark, bookmarks, incrementPostView, showToast } = useBlog();
  const [fontSize, setFontSize] = useState('base'); // 'sm' | 'base' | 'lg'
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [userReaction, setUserReaction] = useState(null);
  const [reactionCounts, setReactionCounts] = useState({
    helpful: 24,
    insightful: 38,
    bullish: 19,
    deepdive: 42
  });

  const post = posts.find(p => p.slug === slug);
  const isSaved = bookmarks.includes(slug);
  const recordedSlugRef = React.useRef('');

  // 1. Record single view increment & telemetry once per slug
  useEffect(() => {
    if (!slug) return;

    if (recordedSlugRef.current !== slug) {
      recordedSlugRef.current = slug;
      if (incrementPostView) {
        incrementPostView(slug);
      }
    }

    window.scrollTo({ top: 0, behavior: 'instant' });
    const cleanupTelemetry = telemetryService.initArticleTelemetry(slug, post?.title || slug);

    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (cleanupTelemetry) {
        cleanupTelemetry();
      }
    };
  }, [slug]);

  // 2. Sync Document Title
  useEffect(() => {
    if (post?.title) {
      document.title = `${post.title} | ${settings?.siteName || 'THE HORI CLICK'}`;
    }
  }, [post?.title, settings?.siteName]);

  if (!post) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4 font-sans">
        <h2 className="font-serif text-3xl font-bold">Article Not Found</h2>
        <p className="text-neutral-500">The editorial piece you are seeking may have been renamed or archived.</p>
        <button
          onClick={() => navigate('/')}
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

  // Compute Word Count & Reading Time
  const textContent = post.content.replace(/<[^>]*>/g, ' ');
  const wordCount = textContent.trim().split(/\s+/).filter(Boolean).length;

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date(post.publishedAt || Date.now()));

  // Google JSON-LD NewsArticle Structured Data
  const jsonLdSchema = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    'headline': post.title,
    'description': post.excerpt,
    'image': [post.coverImage],
    'datePublished': post.publishedAt || new Date().toISOString(),
    'dateModified': post.publishedAt || new Date().toISOString(),
    'author': [{
      '@type': 'Person',
      'name': author?.name || 'The Horizon Post Staff',
      'jobTitle': author?.role || 'Senior Analyst'
    }],
    'publisher': {
      '@type': 'Organization',
      'name': settings?.siteName || 'THE HORI CLICK',
      'url': 'https://www.thehori.click',
      'logo': {
        '@type': 'ImageObject',
        'url': 'https://www.thehori.click/favicon.svg'
      }
    },
    'mainEntityOfPage': {
      '@type': 'WebPage',
      '@id': `https://www.thehori.click/post/${post.slug}`
    }
  };

  const handleToggleSpeech = () => {
    if (!('speechSynthesis' in window)) {
      showToast('Trình duyệt của bạn chưa hỗ trợ tính năng đọc bài báo bằng giọng nói', 'warning');
      return;
    }
    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      telemetryService.trackEvent('audio_playback_stopped', { slug: post?.slug });
    } else {
      const plainText = `${post.title}. By ${author?.name || 'our correspondent'}. ${post.excerpt}. ${post.content.replace(/<[^>]*>/g, ' ')}`;
      const utterance = new SpeechSynthesisUtterance(plainText);
      utterance.lang = 'en-US';
      utterance.rate = 1.0;
      utterance.onend = () => {
        setIsPlayingAudio(false);
        telemetryService.trackEvent('audio_playback_finished', { slug: post?.slug });
      };
      utterance.onerror = () => setIsPlayingAudio(false);
      window.speechSynthesis.speak(utterance);
      setIsPlayingAudio(true);
      telemetryService.trackEvent('audio_playback_started', { slug: post?.slug, title: post?.title });
    }
  };

  const handleReaction = (type) => {
    if (userReaction === type) return;
    setUserReaction(type);
    setReactionCounts(prev => ({
      ...prev,
      [type]: (prev[type] || 0) + 1
    }));
    telemetryService.trackEvent('reader_reaction_submitted', { slug: post?.slug, reactionType: type });
  };

  const fontSizeClasses = {
    sm: 'text-base leading-relaxed',
    base: 'text-lg leading-relaxed',
    lg: 'text-xl leading-loose',
  };

  return (
    <>
      {/* Dynamic JSON-LD Structured Data Schema for Google Search Engine */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdSchema) }}
      />

      <ReadingProgressBar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn font-sans">
        {/* Top Breadcrumbs */}
        <div className="flex items-center space-x-2 text-xs text-neutral-500 font-mono mb-6 overflow-x-auto no-scrollbar">
          <button onClick={() => navigate('/')} className="hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors">Home</button>
          <ChevronRight className="w-3.5 h-3.5" />
          <button onClick={() => navigate(`/category/${category?.slug}`)} className="hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors">
            {category?.name || 'Category'}
          </button>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-neutral-400 truncate max-w-[200px] sm:max-w-md">{post.title}</span>
        </div>

        {/* Top Header Leaderboard Ad (Desktop only to protect mobile dwell time) */}
        {post.enableAds && (
          <AdSenseUnit slotType="headerLeaderboard" customClass="hidden md:flex" customLabel="Sponsored Executive Leaderboard" />
        )}

        {/* Article Header */}
        <header className="max-w-4xl mx-auto space-y-4 text-left mb-8">
          <div className="flex flex-wrap items-center gap-2">
            <Badge label={category?.name || 'Article'} size="sm" />
            <span className="text-xs text-neutral-500 font-mono">
              {formattedDate} • {post.readTime}
            </span>
          </div>

          <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-extrabold text-neutral-950 dark:text-neutral-50 leading-[1.2] tracking-tight">
            {post.title}
          </h1>

          <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-300 leading-relaxed font-sans">
            {post.excerpt}
          </p>

          {/* Reading Toolbar */}
          <div className="p-2.5 bg-neutral-100/60 dark:bg-neutral-900/40 rounded-xl border border-neutral-200 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-2.5 text-xs">
            {/* Audio Reader */}
            <button
              onClick={handleToggleSpeech}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium transition-all ${
                isPlayingAudio 
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs' 
                  : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200'
              }`}
            >
              {isPlayingAudio ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-neutral-600 dark:text-neutral-400" />}
              <span>{isPlayingAudio ? 'Stop Audio' : 'Listen to Article'}</span>
            </button>

            {/* Font Size Adjuster */}
            <div className="flex items-center space-x-1 bg-white dark:bg-neutral-800 p-0.5 rounded-lg border border-neutral-200 dark:border-neutral-700">
              <span className="text-[11px] font-mono px-1.5 text-neutral-400">Text:</span>
              <button
                onClick={() => setFontSize('sm')}
                className={`px-1.5 py-0.5 rounded text-xs ${fontSize === 'sm' ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-bold' : 'text-neutral-600 dark:text-neutral-400'}`}
              >
                A-
              </button>
              <button
                onClick={() => setFontSize('base')}
                className={`px-1.5 py-0.5 rounded text-xs ${fontSize === 'base' ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-bold' : 'text-neutral-600 dark:text-neutral-400'}`}
              >
                A
              </button>
              <button
                onClick={() => setFontSize('lg')}
                className={`px-1.5 py-0.5 rounded text-xs ${fontSize === 'lg' ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-bold' : 'text-neutral-600 dark:text-neutral-400'}`}
              >
                A+
              </button>
            </div>

            {/* Bookmark Action */}
            <button
              onClick={() => toggleBookmark(post.slug)}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg font-medium transition-all ${
                isSaved
                  ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-xs'
                  : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200'
              }`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
              <span>{isSaved ? 'Saved' : 'Save'}</span>
            </button>
          </div>

          {/* Author Byline and Meta */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center space-x-3">
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

        {/* Feature Cover Image */}
        <div className="max-w-4xl mx-auto mb-10 rounded-3xl overflow-hidden shadow-2xl border border-neutral-200 dark:border-neutral-800 aspect-[16/9] bg-neutral-100 dark:bg-neutral-800">
          <img 
            src={post.coverImage} 
            alt={post.title}
            className="w-full h-full object-cover" 
          />
        </div>

        {/* Main Grid: Content (8 cols) + Sticky Sidebar (4 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start max-w-7xl mx-auto">
          {/* Article Main Body (Left 8 cols) */}
          <article className="lg:col-span-8 space-y-8">
            {/* Table of Contents */}
            <TableOfContents contentHtml={post.content} />

            {/* In-Article Top High-Impact Ad */}
            {post.enableAds && (
              <AdSenseUnit slotType="inArticleTop" customLabel="Sponsored Executive Intelligence" />
            )}

            {/* Main Editorial HTML Content Body */}
            <div 
              className={`editorial-prose font-sans ${fontSizeClasses[fontSize]}`}
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            {/* In-Article Mid Ad Unit */}
            {post.enableAds && (
              <AdSenseUnit slotType="inArticleMid" customLabel="Strategic Market Insights" />
            )}

            {/* Strategic High-Converting Affiliate Recommendation Box */}
            <AffiliateShowcaseBox categorySlug={category?.slug || 'personal-finance'} />

            {/* Interactive Reader Reaction Section */}
            <div className="p-6 bg-white dark:bg-[#111622] rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-serif text-base font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                  <Brain className="w-4 h-4 text-blue-500" />
                  <span>How did you evaluate this investigative dispatch?</span>
                </span>
                <span className="text-[11px] font-mono text-neutral-400">Executive Consensus</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <button
                  onClick={() => handleReaction('helpful')}
                  className={`p-3 rounded-2xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                    userReaction === 'helpful'
                      ? 'bg-blue-50 border-blue-500 text-blue-600 dark:bg-blue-950 dark:border-blue-400 dark:text-blue-300'
                      : 'bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:border-blue-400'
                  }`}
                >
                  <ThumbsUp className="w-4 h-4 text-blue-500" />
                  <span>Helpful ({reactionCounts.helpful})</span>
                </button>

                <button
                  onClick={() => handleReaction('insightful')}
                  className={`p-3 rounded-2xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                    userReaction === 'insightful'
                      ? 'bg-amber-50 border-amber-500 text-amber-600 dark:bg-amber-950 dark:border-amber-400 dark:text-amber-300'
                      : 'bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:border-amber-400'
                  }`}
                >
                  <Lightbulb className="w-4 h-4 text-amber-500" />
                  <span>Insightful ({reactionCounts.insightful})</span>
                </button>

                <button
                  onClick={() => handleReaction('bullish')}
                  className={`p-3 rounded-2xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                    userReaction === 'bullish'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-600 dark:bg-emerald-950 dark:border-emerald-400 dark:text-emerald-300'
                      : 'bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:border-emerald-400'
                  }`}
                >
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  <span>Bullish ({reactionCounts.bullish})</span>
                </button>

                <button
                  onClick={() => handleReaction('deepdive')}
                  className={`p-3 rounded-2xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                    userReaction === 'deepdive'
                      ? 'bg-rose-50 border-rose-500 text-rose-600 dark:bg-rose-950 dark:border-rose-400 dark:text-rose-300'
                      : 'bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:border-rose-400'
                  }`}
                >
                  <Brain className="w-4 h-4 text-rose-500" />
                  <span>Masterpiece ({reactionCounts.deepdive})</span>
                </button>
              </div>
            </div>

            {/* Tags Pills */}
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-neutral-200 dark:border-neutral-800">
                <span className="text-xs font-mono text-neutral-400 uppercase font-semibold">Indexed Desks:</span>
                {post.tags.map((tag, idx) => (
                  <button
                    key={idx}
                    onClick={() => navigate(`/tag/${encodeURIComponent(tag)}`)}
                    className="px-3 py-1 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 text-neutral-700 dark:text-neutral-300 rounded-lg text-xs font-mono transition-colors"
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            )}

            {/* Social Share Bar Bottom */}
            <div className="p-4 bg-neutral-50 dark:bg-neutral-900/40 rounded-2xl border border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-3">
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
                onClick={() => navigate('/about')}
                className="text-xs font-bold text-neutral-900 dark:text-neutral-100 hover:underline"
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
