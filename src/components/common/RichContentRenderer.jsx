import React from 'react';
import { renderContentToHtml, sanitizeHtml } from '../../utils/contentFormatter';

/**
 * Safe HTML sanitizer to prevent malicious script injection while preserving rich editorial formatting
 */
export function sanitizeContent(html) {
  if (!html || typeof html !== 'string') return '';
  return sanitizeHtml(
    html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
      .replace(/href\s*=\s*["']\s*javascript:[^"']*["']/gi, 'href="#"')
  );
}

/**
 * Parses and safely renders article content with unified support for:
 * - Markdown headings (#, ##, ###) and HTML headings (h2, h3, h4)
 * - Markdown formatting (**bold**, *italic*, ~~strikethrough~~, `code`, links, lists, blockquotes)
 * - Clean semantic HTML from ChatGPT and other rich sources
 * - Responsive images with captions/alt (loaded stably, non-distorting)
 * - Responsive YouTube embeds (16:9 aspect ratio standard, vertical for Shorts)
 * - Standalone media URLs auto-converted for backward compatibility
 * - Strict iframe security (only verified YouTube embeds allowed)
 * - In-article AdSense slot insertion if enabled
 */
export default function RichContentRenderer({ content, adsenseConfig, enableAds }) {
  if (!content) {
    return <p style={{ color: '#64748b', fontStyle: 'italic' }}>No article content available.</p>;
  }

  // Convert Markdown, YouTube embeds, images, and sanitize
  let htmlToRender = sanitizeContent(renderContentToHtml(content));

  // In-article AdSense slot insertion after second paragraph if enabled
  if (enableAds && adsenseConfig?.enabled && adsenseConfig?.inArticleAd?.enabled) {
    const adHtml = `
      <div class="in-article-ad-slot" style="margin:2.25rem 0;padding:1.25rem;background:#f8fafc;border:1px dashed #cbd5e1;border-radius:10px;text-align:center;color:#64748b;font-size:0.85rem;">
        <span style="display:block;font-weight:700;margin-bottom:0.25rem;text-transform:uppercase;letter-spacing:0.05em;font-size:0.75rem;color:#94a3b8;">Advertisement</span>
        <span>Google AdSense Slot: ${adsenseConfig.inArticleAd.slotId || 'In-Article'}</span>
      </div>
    `;
    let pCount = 0;
    htmlToRender = htmlToRender.replace(/<\/p>/gi, (match) => {
      pCount++;
      if (pCount === 2) {
        return match + '\n' + adHtml;
      }
      return match;
    });
  }

  return (
    <div
      className="article-rich-body"
      dangerouslySetInnerHTML={{ __html: htmlToRender }}
    />
  );
}
