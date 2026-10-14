import React, { useEffect, useState } from 'react';
import { api } from '../../api/client';
import {
  ArrowLeft,
  Calendar,
  Eye,
  Share2,
  Tag,
  Loader2,
  Check
} from 'lucide-react';
import RichContentRenderer from '../common/RichContentRenderer';

export default function PostDetailPage({ slug, onBack, settings }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

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

  if (loading) {
    return (
      <div style={{ maxWidth: '840px', margin: '0 auto', padding: '5rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        <Loader2 className="animate-spin" size={32} style={{ margin: '0 auto 1rem' }} />
        <div>Loading article from database...</div>
      </div>
    );
  }

  if (error || !data?.post) {
    return (
      <div style={{ maxWidth: '840px', margin: '0 auto', padding: '4rem 1.5rem', textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.5rem', color: '#f87171', marginBottom: '1rem' }}>Article Not Found</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>The article you requested might have been moved or unpublished.</p>
        <button onClick={onBack} className="btn btn-primary">
          <ArrowLeft size={16} /> Return to Articles
        </button>
      </div>
    );
  }

  const { post, category } = data;
  const adsConfig = settings?.adsense;
  const isAdsAllowed = adsConfig?.enabled === true && post.enableAds !== false && !!adsConfig?.publisherId;

  return (
    <article style={{ maxWidth: '840px', margin: '0 auto', padding: '2rem 1.5rem 5rem' }}>
      {/* Back button & Category */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <button onClick={onBack} className="btn btn-secondary btn-sm">
          <ArrowLeft size={15} />
          <span>All Articles</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {category && (
            <span className="badge badge-published">
              {category.name}
            </span>
          )}
          <button
            onClick={handleCopyShare}
            className="btn btn-secondary btn-sm"
            title="Copy article link"
          >
            {copied ? <Check size={14} color="#10b981" /> : <Share2 size={14} />}
            <span>{copied ? 'Link Copied!' : 'Share'}</span>
          </button>
        </div>
      </div>

      {/* Header */}
      <h1 style={{
        fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
        fontWeight: 800,
        color: '#fff',
        lineHeight: 1.25,
        marginBottom: '1.25rem',
        letterSpacing: '-0.02em'
      }}>
        {post.title}
      </h1>

      {/* Metadata Bar (No author display - fully removed as requested) */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1.25rem',
        color: 'var(--text-muted)',
        fontSize: '0.85rem',
        paddingBottom: '1.25rem',
        borderBottom: '1px solid var(--border-subtle)',
        marginBottom: '2rem',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Calendar size={15} />
          <span>{new Date(post.publishedAt || post.createdAt).toLocaleDateString('vi-VN', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Eye size={15} />
          <span>{(post.views || 0).toLocaleString()} views</span>
        </div>
      </div>

      {/* Featured Cover Image */}
      {post.coverImage && (
        <div style={{
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          marginBottom: '2.5rem',
          maxHeight: '480px',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-md)'
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
        <div style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px dashed var(--border-strong)',
          borderRadius: 'var(--radius-md)',
          padding: '1.25rem',
          textAlign: 'center',
          color: 'var(--text-dim)',
          fontSize: '0.75rem',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          marginBottom: '2.5rem'
        }}>
          Google AdSense Header Slot • ID: {adsConfig.headerAd.slotId || 'Header'}
        </div>
      )}

      {/* Excerpt Lead */}
      {post.excerpt && (
        <div style={{
          fontSize: '1.2rem',
          color: '#e2e8f0',
          lineHeight: 1.6,
          fontStyle: 'italic',
          marginBottom: '2.5rem',
          paddingLeft: '1.5rem',
          borderLeft: '4px solid var(--primary)',
          background: 'rgba(59, 130, 246, 0.03)',
          padding: '1.25rem 1.5rem',
          borderRadius: '0 var(--radius-md) var(--radius-md) 0'
        }}>
          {post.excerpt}
        </div>
      )}

      {/* Main Content Body (Rich formatted with images & YouTube support) */}
      <div style={{ color: '#cbd5e1', marginBottom: '3rem' }}>
        <RichContentRenderer
          content={post.content}
          adsenseConfig={adsConfig}
          enableAds={isAdsAllowed}
        />
      </div>

      {/* Optional AdSense Footer Placement */}
      {isAdsAllowed && adsConfig?.footerAd?.enabled && (
        <div style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px dashed var(--border-strong)',
          borderRadius: 'var(--radius-md)',
          padding: '1.25rem',
          textAlign: 'center',
          color: 'var(--text-dim)',
          fontSize: '0.75rem',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          marginBottom: '2.5rem'
        }}>
          Google AdSense Footer Slot • ID: {adsConfig.footerAd.slotId || 'Footer'}
        </div>
      )}

      {/* Tags */}
      {post.tags && post.tags.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', paddingTop: '1.5rem', borderTop: '1px solid var(--border-subtle)' }}>
          <Tag size={15} color="var(--text-dim)" />
          {post.tags.map((tag, idx) => (
            <span key={idx} className="badge" style={{ background: 'rgba(255, 255, 255, 0.05)', color: '#94a3b8' }}>
              #{tag}
            </span>
          ))}
        </div>
      )}
    </article>
  );
}
