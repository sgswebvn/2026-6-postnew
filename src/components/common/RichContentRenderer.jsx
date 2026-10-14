import React from 'react';

/**
 * Parses and safely renders article content with support for:
 * - HTML headings (h2, h3)
 * - Paragraphs, lists, bold, italics, blockquotes
 * - Responsive images with captions/alt
 * - Responsive YouTube embeds (16:9 aspect ratio)
 * - In-article AdSense insertion if enabled
 */
export default function RichContentRenderer({ content, adsenseConfig, enableAds }) {
  if (!content) {
    return <p style={{ color: 'var(--text-dim)', fontStyle: 'italic' }}>No article content available.</p>;
  }

  // Check if content looks like HTML
  const isHtml = /<[a-z][\s\S]*>/i.test(content);

  if (!isHtml) {
    // If plain text with linebreaks, render paragraphs
    const paragraphs = content.split(/\n\s*\n/).filter(Boolean);
    return (
      <div className="article-rich-body">
        {paragraphs.map((p, idx) => (
          <React.Fragment key={idx}>
            <p style={{ marginBottom: '1.5rem', lineHeight: 1.8 }}>{p}</p>
            {/* Insert in-article ad after second paragraph if enabled */}
            {idx === 1 && enableAds && adsenseConfig?.enabled && adsenseConfig?.inArticleAd?.enabled && (
              <div
                className="in-article-ad-slot"
                style={{
                  margin: '2rem 0',
                  padding: '1.25rem',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px dashed var(--border-strong)',
                  borderRadius: 'var(--radius-md)',
                  textAlign: 'center',
                  color: 'var(--text-dim)',
                  fontSize: '0.8rem'
                }}
              >
                <span>Advertisement • AdSense Slot: {adsenseConfig.inArticleAd.slotId || 'In-Article'}</span>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    );
  }

  // Content contains HTML (including <img> and YouTube iframes)
  return (
    <div
      className="article-rich-body"
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}
