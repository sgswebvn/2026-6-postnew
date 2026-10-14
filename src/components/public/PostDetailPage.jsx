import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../../api/client';
import {
  ArrowLeft,
  Calendar,
  Eye,
  Share2,
  Tag,
  Loader2,
  Check,
  Clock,
  List,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Bookmark
} from 'lucide-react';
import RichContentRenderer from '../common/RichContentRenderer';

export default function PostDetailPage({ slug, onNavigate, onSelectPost, settings }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [tocOpen, setTocOpen] = useState(true);

  useEffect(() => {
    loadPost();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [slug]);

  async function loadPost() {
    setLoading(true);
    setError('');
    try {
      const res = await api.getPublicPostBySlug(slug);
      setData(res);
    } catch (err) {
      setError(err.message || 'Article could not be found.');
    } finally {
      setLoading(false);
    }
  }

  function handleCopyShare() {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleTwitterShare(title) {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(window.location.href)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  function handleLinkedInShare() {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  // Extract Table of Contents from HTML content
  const tocItems = useMemo(() => {
    if (!data?.post?.content) return [];
    const content = data.post.content;
    const regex = /<(h[23])[^>]*>(.*?)<\/\1>/gi;
    const items = [];
    let match;

    while ((match = regex.exec(content)) !== null) {
      const tag = match[1].toLowerCase();
      // Strip any nested tags inside heading
      const text = match[2].replace(/<[^>]*>?/gm, '').trim();
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      if (text) {
        items.push({ tag, text, id });
      }
    }
    return items;
  }, [data?.post?.content]);

  // Calculate estimated reading time
  const readingTimeMinutes = useMemo(() => {
    if (!data?.post?.content) return 3;
    const text = data.post.content.replace(/<[^>]*>?/gm, '');
    const words = text.trim().split(/\s+/).length;
    return Math.max(1, Math.ceil(words / 220));
  }, [data?.post?.content]);

  if (loading) {
    return (
      <div style={{ maxWidth: '820px', margin: '0 auto', padding: '6rem 1.5rem', textAlign: 'center', color: '#64748b' }}>
        <Loader2 className="animate-spin" size={32} style={{ margin: '0 auto 1rem' }} />
        <div>Loading article dispatch...</div>
      </div>
    );
  }

  if (error || !data?.post) {
    return (
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '5rem 1.5rem', textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ef4444', marginBottom: '0.75rem' }}>
          Article Not Found
        </h2>
        <p style={{ color: '#64748b', fontSize: '1rem', marginBottom: '1.5rem' }}>
          The article you requested may have been moved, updated, or unpublished.
        </p>
        <button type="button" onClick={() => onNavigate('/')} className="btn btn-primary">
          <ArrowLeft size={16} />
          <span>Return to Homepage</span>
        </button>
      </div>
    );
  }

  const { post, category, relatedPosts = [], prevPost, nextPost } = data;
  const adsConfig = settings?.adsense;
  const isAdsAllowed = adsConfig?.enabled === true && post.enableAds !== false && !!adsConfig?.publisherId;

  return (
    <article style={{ maxWidth: '840px', margin: '0 auto', padding: '2.5rem 1.5rem 5rem' }}>
      {/* Breadcrumb Navigation */}
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <button
          type="button"
          onClick={() => onNavigate('/')}
          style={{ background: 'none', border: 'none', padding: 0, color: '#64748b', cursor: 'pointer' }}
        >
          Home
        </button>
        <span>/</span>
        {category && (
          <>
            <button
              type="button"
              onClick={() => onNavigate(`/category/${category.slug || category.id}`)}
              style={{ background: 'none', border: 'none', padding: 0, color: '#64748b', cursor: 'pointer' }}
            >
              {category.name}
            </button>
            <span>/</span>
          </>
        )}
        <span className="current" style={{ maxWidth: '320px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {post.title}
        </span>
      </nav>

      {/* Category Pill Badge */}
      {category && (
        <div style={{ marginBottom: '1rem' }}>
          <button
            type="button"
            onClick={() => onNavigate(`/category/${category.slug || category.id}`)}
            className="badge"
            style={{
              cursor: 'pointer',
              background: '#eff6ff',
              color: '#2563eb',
              border: '1px solid #bfdbfe',
              padding: '0.35rem 0.85rem',
              fontWeight: 700,
              fontSize: '0.8rem',
              borderRadius: '9999px'
            }}
          >
            {category.name}
          </button>
        </div>
      )}

      {/* Primary H1 Heading */}
      <h1 style={{
        fontSize: 'clamp(2rem, 4.5vw, 2.85rem)',
        fontWeight: 850,
        color: '#0f172a',
        lineHeight: 1.25,
        marginBottom: '1.25rem',
        letterSpacing: '-0.025em'
      }}>
        {post.title}
      </h1>

      {/* Metadata & Social Share Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        paddingBottom: '1.5rem',
        borderBottom: '1px solid #e2e8f0',
        marginBottom: '2rem',
        color: '#64748b',
        fontSize: '0.875rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Calendar size={15} color="#2563eb" />
            <span>{new Date(post.publishedAt || post.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Clock size={15} />
            <span>{readingTimeMinutes} min read</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Eye size={15} />
            <span>{(post.views || 0).toLocaleString()} views</span>
          </div>
        </div>

        {/* Share Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={handleCopyShare}
            className="btn btn-secondary btn-sm"
            title="Copy article link"
            style={{ borderRadius: '9999px', padding: '0.35rem 0.75rem', fontSize: '0.8rem', backgroundColor: '#ffffff' }}
          >
            {copied ? <Check size={14} color="#10b981" /> : <Share2 size={14} />}
            <span>{copied ? 'Copied!' : 'Share'}</span>
          </button>

          <button
            type="button"
            onClick={() => handleTwitterShare(post.title)}
            className="btn btn-secondary btn-sm"
            title="Share on X / Twitter"
            style={{ borderRadius: '9999px', padding: '0.35rem 0.65rem', fontSize: '0.8rem', backgroundColor: '#ffffff' }}
          >
            X
          </button>

          <button
            type="button"
            onClick={handleLinkedInShare}
            className="btn btn-secondary btn-sm"
            title="Share on LinkedIn"
            style={{ borderRadius: '9999px', padding: '0.35rem 0.65rem', fontSize: '0.8rem', backgroundColor: '#ffffff' }}
          >
            in
          </button>
        </div>
      </div>

      {/* Featured Cover Image */}
      {post.coverImage && (
        <div style={{
          borderRadius: '16px',
          overflow: 'hidden',
          marginBottom: '2.5rem',
          maxHeight: '480px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)'
        }}>
          <img
            src={post.coverImage}
            alt={post.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
      )}

      {/* Optional AdSense Header Banner Placement */}
      {isAdsAllowed && adsConfig?.headerAd?.enabled && (
        <div className="ad-slot-container" style={{ marginBottom: '2.5rem' }}>
          <div className="ad-slot-label">Advertisement</div>
          <div style={{ color: '#64748b', fontSize: '0.8rem' }}>
            Google AdSense Slot: {adsConfig.headerAd.slotId || 'Header Leaderboard'}
          </div>
        </div>
      )}

      {/* Excerpt Lead Paragraph */}
      {post.excerpt && (
        <div style={{
          fontSize: '1.2rem',
          color: '#334155',
          lineHeight: 1.65,
          fontStyle: 'italic',
          marginBottom: '2.25rem',
          paddingLeft: '1.5rem',
          borderLeft: '4px solid #2563eb',
          backgroundColor: '#f8fafc',
          padding: '1.25rem 1.5rem',
          borderRadius: '0 12px 12px 0'
        }}>
          {post.excerpt}
        </div>
      )}

      {/* Automatic Table of Contents (TOC) if article has 2+ headings */}
      {tocItems.length >= 2 && (
        <div className="toc-box">
          <div className="toc-title" onClick={() => setTocOpen(!tocOpen)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <List size={16} color="#2563eb" />
              <span>Table of Contents</span>
            </div>
            {tocOpen ? <ChevronUp size={16} color="#64748b" /> : <ChevronDown size={16} color="#64748b" />}
          </div>

          {tocOpen && (
            <ul className="toc-list">
              {tocItems.map((item, idx) => (
                <li key={idx} className={item.tag === 'h3' ? 'toc-h3' : 'toc-h2'}>
                  <a href={`#${item.id}`}>
                    {item.text}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Main Content Body (Rich formatted with embedded images & YouTube) */}
      <div style={{ marginBottom: '3.5rem' }}>
        <RichContentRenderer
          content={post.content}
          adsenseConfig={adsConfig}
          enableAds={isAdsAllowed}
        />
      </div>

      {/* Optional AdSense Footer Placement */}
      {isAdsAllowed && adsConfig?.footerAd?.enabled && (
        <div className="ad-slot-container" style={{ marginBottom: '3rem' }}>
          <div className="ad-slot-label">Advertisement</div>
          <div style={{ color: '#64748b', fontSize: '0.8rem' }}>
            Google AdSense Slot: {adsConfig.footerAd.slotId || 'Footer Matched Content'}
          </div>
        </div>
      )}

      {/* Tags */}
      {post.tags && post.tags.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', paddingBottom: '2rem', borderBottom: '1px solid #e2e8f0', marginBottom: '2.5rem' }}>
          <Tag size={15} color="#94a3b8" />
          {post.tags.map((tag, idx) => (
            <span key={idx} className="badge" style={{ backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', padding: '0.3rem 0.75rem' }}>
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Previous & Next Article Navigation */}
      {(prevPost || nextPost) && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.25rem',
          marginBottom: '3.5rem'
        }}>
          {prevPost ? (
            <div
              onClick={() => onSelectPost(prevPost.slug)}
              style={{
                padding: '1.25rem',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'border-color 0.15s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#2563eb'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; }}
            >
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 700, marginBottom: '0.35rem' }}>
                ← Previous Article
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', lineHeight: 1.4 }}>
                {prevPost.title}
              </div>
            </div>
          ) : <div />}

          {nextPost ? (
            <div
              onClick={() => onSelectPost(nextPost.slug)}
              style={{
                padding: '1.25rem',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                cursor: 'pointer',
                textAlign: 'right',
                transition: 'border-color 0.15s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#2563eb'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; }}
            >
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 700, marginBottom: '0.35rem' }}>
                Next Article →
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', lineHeight: 1.4 }}>
                {nextPost.title}
              </div>
            </div>
          ) : <div />}
        </div>
      )}

      {/* Related Articles Section (Internal Linking & Audience Engagement) */}
      {relatedPosts.length > 0 && (
        <section style={{ marginTop: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <Bookmark size={18} color="#2563eb" />
            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Related Dispatches
            </h3>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '1.5rem'
          }}>
            {relatedPosts.map((rel) => (
              <div
                key={rel.id || rel._id}
                onClick={() => onSelectPost(rel.slug)}
                className="card-item"
                style={{
                  cursor: 'pointer',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <div style={{ height: '140px', backgroundColor: '#f1f5f9', overflow: 'hidden' }}>
                  {rel.coverImage ? (
                    <img
                      src={rel.coverImage}
                      alt={rel.title}
                      loading="lazy"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                      <Calendar size={24} />
                    </div>
                  )}
                </div>

                <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: 750, color: '#0f172a', lineHeight: 1.35, marginBottom: '0.5rem' }}>
                    {rel.title}
                  </h4>
                  <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8', paddingTop: '0.5rem' }}>
                    <span>{new Date(rel.publishedAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    <span>{(rel.views || 0).toLocaleString()} views</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
