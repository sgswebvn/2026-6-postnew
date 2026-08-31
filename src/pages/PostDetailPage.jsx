import React, { useEffect, useState } from 'react';
import { useBlog } from '../context/BlogContext';
import { storageService } from '../services/storageService';
import { telemetryService } from '../services/telemetryService';
import { Badge } from '../components/common/Badge';
import { AdSenseUnit } from '../components/ads/AdSenseUnit';
import { AuthorBioCard } from '../components/blog/AuthorBioCard';
import { SocialShareBar } from '../components/blog/SocialShareBar';
import { ArticleCard } from '../components/blog/ArticleCard';
import { NewsletterBox } from '../components/blog/NewsletterBox';
import { ReadingProgressBar } from '../components/layout/ReadingProgressBar';
import { AffiliateShowcaseBox } from '../components/blog/AffiliateShowcaseBox';
import { TableOfContents } from '../components/blog/TableOfContents';
import { getOptimizedImageUrl } from '../utils/imageOptimizer';
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
import { NotFoundPage } from './NotFoundPage';

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

  const cleanSlug = (slug || '').trim().replace(/-+$/, '');
  const localPost = posts.find(p => 
    p.slug === slug || 
    p.id === slug || 
    p.slug === cleanSlug || 
    (p.slug && p.slug.toLowerCase() === (slug || '').toLowerCase())
  );

  const [fetchedPost, setFetchedPost] = useState(null);
  const [isLoading, setIsLoading] = useState(!localPost || !localPost.content || localPost.content.length <= 500);

  useEffect(() => {
    if (slug) {
      // Check if localPost is missing or its content was compressed/truncated for local cache
      const needsFullLoad = !localPost || !localPost.content || localPost.content.length <= 500;
      if (needsFullLoad) {
        setIsLoading(true);
        fetch(`/api/posts/${encodeURIComponent(cleanSlug || slug)}`)
          .then(res => {
            if (res.ok) return res.json();
            // Direct Supabase CDN fetch fallback
            return fetch(`https://mmltqgekvpdnezqdavvc.supabase.co/storage/v1/object/public/postnew/posts/${encodeURIComponent(cleanSlug || slug)}.json?t=${Date.now()}`)
              .then(sb => sb.ok ? sb.json() : null);
          })
          .then(data => {
            if (data && data.content) setFetchedPost(data);
          })
          .catch(() => {})
          .finally(() => setIsLoading(false));
      } else {
        setIsLoading(false);
      }
    }
  }, [slug, localPost, cleanSlug]);

  const post = fetchedPost || localPost;
  const isSaved = post ? bookmarks.includes(post.slug || slug) : false;
  const recordedSlugRef = React.useRef('');

  // 1. Record single view increment & telemetry once per slug
  useEffect(() => {
    if (!post || !slug) return;

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
  }, [slug, post]);

  // 2. Sync Document Title, Canonical URL, Open Graph & Twitter Social Share Cards
  useEffect(() => {
    if (post) {
      const siteName = settings?.siteName || 'THE HORI CLICK';
      const pageTitle = `${post.title} | ${siteName}`;
      const pageDesc = post.excerpt || post.metaDescription || post.title;
      const pageImage = post.coverImage || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=1200';
      const pageUrl = window.location.origin + `/post/${post.slug}`;

      document.title = pageTitle;

      const setMetaTag = (attrName, attrValue, content) => {
        let el = document.querySelector(`meta[${attrName}="${attrValue}"]`);
        if (!el) {
          el = document.createElement('meta');
          el.setAttribute(attrName, attrValue);
          document.head.appendChild(el);
        }
        el.setAttribute('content', content);
      };

      // Standard Meta
      setMetaTag('name', 'description', pageDesc);

      // Open Graph / Facebook / Zalo / Messenger / Telegram / LinkedIn
      setMetaTag('property', 'og:type', 'article');
      setMetaTag('property', 'og:title', pageTitle);
      setMetaTag('property', 'og:description', pageDesc);
      setMetaTag('property', 'og:image', pageImage);
      setMetaTag('property', 'og:image:secure_url', pageImage);
      setMetaTag('property', 'og:url', pageUrl);
      setMetaTag('property', 'og:site_name', siteName);

      // Twitter Cards
      setMetaTag('name', 'twitter:card', 'summary_large_image');
      setMetaTag('name', 'twitter:title', pageTitle);
      setMetaTag('name', 'twitter:description', pageDesc);
      setMetaTag('name', 'twitter:image', pageImage);

      // Canonical URL
      let canonical = document.querySelector('link[rel="canonical"]');
      if (!canonical) {
        canonical = document.createElement('link');
        canonical.rel = 'canonical';
        document.head.appendChild(canonical);
      }
      canonical.href = pageUrl;
    }
  }, [post, settings?.siteName, slug]);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 animate-pulse space-y-6">
        <div className="h-4 bg-neutral-200 rounded w-1/4"></div>
        <div className="h-10 bg-neutral-200 rounded w-3/4"></div>
        <div className="h-4 bg-neutral-200 rounded w-1/2"></div>
        <div className="h-80 bg-neutral-200 rounded-3xl"></div>
        <div className="space-y-3">
          <div className="h-4 bg-neutral-200 rounded"></div>
          <div className="h-4 bg-neutral-200 rounded w-5/6"></div>
          <div className="h-4 bg-neutral-200 rounded w-4/6"></div>
        </div>
      </div>
    );
  }

  if (!post) {
    return <NotFoundPage />;
  }

  const category = categories.find(c => c.id === post.categoryId);
  const author = authors.find(a => a.id === post.authorId);
  const factChecker = authors.find(a => a.id === post.factCheckerId) || authors.find(a => a.id === 'author-4');

  const relatedPosts = posts
    .filter(p => p.id !== post.id && p.status === 'published' && p.categoryId === post.categoryId)
    .slice(0, 2);

  // Compute Word Count & Reading Time
  const textContent = (post.content || '').replace(/<[^>]*>/g, ' ');
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
      showToast('Text-to-speech audio narration is not supported in your browser.', 'warning');
      return;
    }
    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      telemetryService.trackEvent('audio_playback_stopped', { slug: post?.slug });
    } else {
      const plainText = `${post.title}. By ${author?.name || 'our correspondent'}. ${post.excerpt || ''}. ${(post.content || '').replace(/<[^>]*>/g, ' ')}`;
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
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 animate-fadeIn font-sans overflow-x-hidden">
        {/* Top Breadcrumbs */}
        <div className="flex items-center space-x-2 text-xs text-neutral-500 font-mono mb-4 sm:mb-6 overflow-x-auto no-scrollbar whitespace-nowrap">
          <button onClick={() => navigate('/')} className="hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors">Home</button>
          <ChevronRight className="w-3.5 h-3.5 shrink-0" />
          <button onClick={() => navigate(`/category/${category?.slug}`)} className="hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors">
            {category?.name || 'Category'}
          </button>
          <ChevronRight className="w-3.5 h-3.5 shrink-0" />
          <span className="text-neutral-400 truncate max-w-[160px] sm:max-w-md">{post.title}</span>
        </div>

        {/* Top Header Leaderboard Ad (Desktop only to protect mobile dwell time) */}
        {post.enableAds && (
          <AdSenseUnit slotType="headerLeaderboard" customClass="hidden md:flex" customLabel="Sponsored Executive Leaderboard" />
        )}

        {/* Article Header */}
        <header className="max-w-4xl mx-auto space-y-3 sm:space-y-4 text-left mb-6 sm:mb-8">
          <div className="flex flex-wrap items-center gap-2">
            <Badge label={category?.name || 'Article'} size="sm" />
            <span className="text-xs text-neutral-500 font-mono">
              {formattedDate} • {post.readTime}
            </span>
          </div>

          <h1 className="font-serif text-xl sm:text-3xl lg:text-4xl font-extrabold text-neutral-950 dark:text-neutral-50 leading-snug sm:leading-[1.2] tracking-tight break-words">
            {post.title}
          </h1>

          <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-300 leading-relaxed font-sans">
            {post.excerpt}
          </p>

          {/* Reading Toolbar */}
          <div className="p-2 sm:p-2.5 bg-neutral-100/60 dark:bg-neutral-900/40 rounded-xl border border-neutral-200 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-2 text-xs">
            {/* Audio Reader */}
            <button
              onClick={handleToggleSpeech}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                isPlayingAudio 
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs' 
                  : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200'
              }`}
            >
              {isPlayingAudio ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-neutral-600 dark:text-neutral-400" />}
              <span>{isPlayingAudio ? 'Stop' : 'Listen'}</span>
            </button>

            {/* Font Size Adjuster */}
            <div className="flex items-center space-x-1 bg-white dark:bg-neutral-800 p-0.5 rounded-lg border border-neutral-200 dark:border-neutral-700">
              <span className="text-[10px] sm:text-[11px] font-mono px-1 text-neutral-400">Text:</span>
              <button
                onClick={() => setFontSize('sm')}
                className={`px-1.5 py-0.5 rounded text-xs cursor-pointer ${fontSize === 'sm' ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-bold' : 'text-neutral-600 dark:text-neutral-400'}`}
              >
                A-
              </button>
              <button
                onClick={() => setFontSize('base')}
                className={`px-1.5 py-0.5 rounded text-xs cursor-pointer ${fontSize === 'base' ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-bold' : 'text-neutral-600 dark:text-neutral-400'}`}
              >
                A
              </button>
              <button
                onClick={() => setFontSize('lg')}
                className={`px-1.5 py-0.5 rounded text-xs cursor-pointer ${fontSize === 'lg' ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-bold' : 'text-neutral-600 dark:text-neutral-400'}`}
              >
                A+
              </button>
            </div>

            {/* Bookmark Action */}
            <button
              onClick={() => toggleBookmark(post.slug)}
              className={`flex items-center gap-1 px-2.5 sm:px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 sm:pt-4 border-t border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center space-x-3">
              <img 
                src={author?.avatar} 
                alt={author?.name}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover ring-2 ring-blue-500/30 shrink-0" 
              />
              <div className="text-left">
                <span className="font-bold text-xs sm:text-sm text-neutral-900 dark:text-neutral-100 block">
                  {author?.name}
                </span>
                <span className="text-[11px] sm:text-xs text-neutral-500 block">
                  {author?.role} • <span className="font-mono text-neutral-400">{formattedDate}</span>
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between sm:justify-end gap-3">
              <div className="flex items-center space-x-2 text-xs text-neutral-400 font-mono">
                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {post.readTime}</span>
              </div>
              <SocialShareBar title={post.title} />
            </div>
          </div>
        </header>

        {/* Feature Cover Image */}
        <div className="max-w-4xl mx-auto mb-6 sm:mb-10 rounded-2xl sm:rounded-3xl overflow-hidden shadow-lg sm:shadow-2xl border border-neutral-200 dark:border-neutral-800 aspect-[16/9] bg-neutral-100 dark:bg-neutral-800">
          <img 
            src={getOptimizedImageUrl(post.coverImage, 1200)} 
            alt={post.title}
            decoding="async"
            className="w-full h-full object-cover" 
          />
        </div>

        {/* Main Grid: Content (8 cols) + Sticky Sidebar (4 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-start max-w-7xl mx-auto">
          {/* Article Main Body (Left 8 cols) */}
          <article className="lg:col-span-8 space-y-6 sm:space-y-8 w-full max-w-full overflow-hidden">
            {/* Table of Contents */}
            <TableOfContents contentHtml={post.content} />

            {/* In-Article Top High-Impact Ad */}
            {post.enableAds && (
              <AdSenseUnit slotType="inArticleTop" customLabel="Sponsored Executive Intelligence" />
            )}

            {/* Main Editorial HTML Content Body */}
            <div 
              className={`editorial-prose font-sans w-full max-w-full break-words overflow-hidden ${fontSizeClasses[fontSize]}`}
              dangerouslySetInnerHTML={{ 
                __html: (post.content && /<(p|div|h[1-6]|ul|ol|table|blockquote|figure)\b[^>]*>/i.test(post.content))
                  ? post.content 
                  : (post.content || post.excerpt || post.title || '')
                      .split(/\n\s*\n/)
                      .map(p => p.trim())
                      .filter(Boolean)
                      .map(p => `<p>${p.replace(/\n/g, '<br />')}</p>`)
                      .join('\n')
              }}
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
