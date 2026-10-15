/**
 * Content Formatter & Markdown Engine for TheHorizon
 * Provides:
 * - Robust Markdown to HTML conversion
 * - YouTube Video URL parser & 16:9 / Shorts responsive embed generator
 * - Image URL validator & responsive figure/img embed generator
 * - Clipboard HTML cleaner (ChatGPT, Notion, Google Docs)
 * - Safe HTML sanitizer (XSS protection & strict iframe domain restriction)
 * - Automatic conversion of standalone media URLs (backward compatibility)
 */

/**
 * Extracts a valid 11-character YouTube video ID from any standard YouTube URL
 * Supported formats:
 * - https://www.youtube.com/watch?v=VIDEO_ID (with optional query parameters)
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/shorts/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://m.youtube.com/...
 */
export function extractYouTubeId(url) {
  if (!url || typeof url !== 'string') return null;
  const str = url.trim();

  // If already an 11-char ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(str)) {
    return str;
  }

  // Check if string contains YouTube host
  if (!/(?:youtube(?:-nocookie)?\.com|youtu\.be)/i.test(str)) {
    return null;
  }

  try {
    // 1. Shortened youtu.be/VIDEO_ID
    const shortMatch = str.match(/(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/i);
    if (shortMatch) return shortMatch[1];

    // 2. YouTube Shorts: youtube.com/shorts/VIDEO_ID
    const shortsMatch = str.match(/(?:youtube(?:-nocookie)?\.com\/shorts\/)([a-zA-Z0-9_-]{11})/i);
    if (shortsMatch) return shortsMatch[1];

    // 3. YouTube Embed: youtube.com/embed/VIDEO_ID
    const embedMatch = str.match(/(?:youtube(?:-nocookie)?\.com\/embed\/)([a-zA-Z0-9_-]{11})/i);
    if (embedMatch) return embedMatch[1];

    // 4. Standard watch: youtube.com/watch?v=VIDEO_ID (supports any query param order)
    const watchMatch = str.match(/(?:youtube(?:-nocookie)?\.com\/watch\?[^#\s]*\bv=)([a-zA-Z0-9_-]{11})/i);
    if (watchMatch) return watchMatch[1];

    // 5. Alternate watch paths: youtube.com/v/VIDEO_ID or youtube.com/live/VIDEO_ID
    const altMatch = str.match(/(?:youtube(?:-nocookie)?\.com\/(?:v|live)\/)([a-zA-Z0-9_-]{11})/i);
    if (altMatch) return altMatch[1];
  } catch (e) {
    return null;
  }

  return null;
}

/**
 * Checks if a YouTube URL is specifically a YouTube Shorts video
 */
export function isYouTubeShortsUrl(url) {
  if (!url || typeof url !== 'string') return false;
  return /youtube(?:-nocookie)?\.com\/shorts\//i.test(url);
}

/**
 * Creates independent responsive HTML embed code for a YouTube video
 * - Standard videos: 16:9 aspect ratio
 * - YouTube Shorts: vertical 9:16 layout, max-width 380px centered
 * Uses secure https://www.youtube-nocookie.com domain
 */
export function buildYouTubeMediaBlockHtml({ videoId, isShorts = false, isInteractive = false }) {
  if (!videoId) return '';

  const toolbarHtml = isInteractive ? `
  <header class="media-block-toolbar" contenteditable="false">
    <div class="media-toolbar-group">
      <span class="media-drag-handle" title="Drag to reorder" draggable="true">⠿ Drag</span>
      <button type="button" class="media-btn media-move-up" title="Move Up">▲</button>
      <button type="button" class="media-btn media-move-down" title="Move Down">▼</button>
    </div>
    <span class="media-toolbar-label" style="font-size:11px;color:#cbd5e1;padding:0 6px;">${isShorts ? 'YouTube Shorts' : 'YouTube Video'}</span>
    <button type="button" class="media-btn media-delete-btn" title="Remove video block">✕</button>
  </header>` : '';

  if (isShorts) {
    return `\n<div class="media-block media-block-youtube youtube-shorts-wrapper" data-media-type="youtube" data-yt-id="${videoId}" style="max-width:380px;margin:2rem auto;text-align:center;position:relative;" contenteditable="false">${toolbarHtml}
  <div class="video-container video-shorts" style="position:relative;padding-bottom:177.77%;height:0;overflow:hidden;border-radius:14px;box-shadow:0 8px 24px rgba(0,0,0,0.12);background:#000;">
    <iframe src="https://www.youtube-nocookie.com/embed/${videoId}" title="YouTube Shorts player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen loading="lazy" style="position:absolute;top:0;left:0;width:100%;height:100%;border:none;"></iframe>
  </div>
</div>\n`;
  }

  return `\n<div class="media-block media-block-youtube" data-media-type="youtube" data-yt-id="${videoId}" style="margin:2rem 0;position:relative;" contenteditable="false">${toolbarHtml}
  <div class="video-container" style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:12px;box-shadow:0 6px 18px rgba(0,0,0,0.08);background:#000;">
    <iframe src="https://www.youtube-nocookie.com/embed/${videoId}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen loading="lazy" style="position:absolute;top:0;left:0;width:100%;height:100%;border:none;"></iframe>
  </div>
</div>\n`;
}

export function createYouTubeEmbed(urlOrId, options = {}) {
  const videoId = extractYouTubeId(urlOrId);
  if (!videoId) return null;
  const isShorts = options.isShorts || isYouTubeShortsUrl(urlOrId);
  return buildYouTubeMediaBlockHtml({ videoId, isShorts, isInteractive: !!options.interactive });
}

/**
 * Validates whether a string is a valid direct image URL
 */
export function isValidImageUrl(url) {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();

  // Protocol check
  if (!/^https?:\/\//i.test(trimmed) && !trimmed.startsWith('/')) {
    return false;
  }

  // Extensions check (with optional query string)
  const hasImageExt = /\.(jpe?g|png|webp|gif|svg|avif)(\?.*)?$/i.test(trimmed);
  // Known verified cloud storage hosts (Supabase, Unsplash, Cloudinary, Imgur, etc.)
  const isImageHosting = /(?:supabase\.co\/storage|images\.unsplash\.com|res\.cloudinary\.com|i\.imgur\.com|media\.giphy\.com)/i.test(trimmed);

  return hasImageExt || isImageHosting;
}

/**
 * Creates responsive HTML embed code for an independent image media block
 * Includes drag/delete toolbar when interactive, mouse resize handles, loading="lazy",
 * proportional responsive styling, and caption support.
 */
export function buildImageMediaBlockHtml({ url, alt = 'Article illustration', caption = '', width = null, align = 'center', isInteractive = false }) {
  if (!url || typeof url !== 'string') return '';
  const cleanUrl = url.trim();
  const cleanAlt = (alt || 'Article illustration').replace(/"/g, '&quot;');
  const numWidth = width ? parseInt(width, 10) : null;
  const safeAlign = ['left', 'center', 'right'].includes(align) ? align : 'center';
  const widthStyle = numWidth ? `max-width:${numWidth}px;` : 'max-width:100%;';

  let marginStyle = 'margin:2rem auto;';
  if (safeAlign === 'left') marginStyle = 'margin:2rem auto 2rem 0;';
  if (safeAlign === 'right') marginStyle = 'margin:2rem 0 2rem auto;';

  const cleanCaption = caption
    ? `<figcaption class="media-caption" style="text-align:center;font-size:0.85rem;color:#64748b;margin-top:0.5rem;font-style:italic;">${caption.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</figcaption>`
    : '';

  const toolbarHtml = isInteractive ? `
  <header class="media-block-toolbar" contenteditable="false">
    <div class="media-toolbar-group">
      <span class="media-drag-handle" title="Drag to reorder" draggable="true">⠿ Drag</span>
      <button type="button" class="media-btn media-move-up" title="Move Up">▲</button>
      <button type="button" class="media-btn media-move-down" title="Move Down">▼</button>
    </div>
    <div class="media-toolbar-group">
      <button type="button" class="media-btn media-align-left ${safeAlign === 'left' ? 'active' : ''}" data-align-btn="left" title="Align Left">Left</button>
      <button type="button" class="media-btn media-align-center ${safeAlign === 'center' ? 'active' : ''}" data-align-btn="center" title="Align Center">Center</button>
      <button type="button" class="media-btn media-align-right ${safeAlign === 'right' ? 'active' : ''}" data-align-btn="right" title="Align Right">Right</button>
    </div>
    <button type="button" class="media-btn media-delete-btn" title="Remove image block">✕</button>
  </header>` : '';

  const resizeHandlesHtml = isInteractive ? `
    <span class="media-resize-handle media-resize-se" data-handle="se" title="Drag corner to resize width"></span>
    <span class="media-resize-handle media-resize-sw" data-handle="sw" title="Drag corner to resize width"></span>` : '';

  return `\n<figure class="media-block media-block-image" data-media-type="image" ${numWidth ? `data-width="${numWidth}"` : ''} data-align="${safeAlign}" style="${widthStyle}width:100%;${marginStyle}text-align:${safeAlign};position:relative;" contenteditable="false">${toolbarHtml}
  <div class="media-image-wrapper" style="position:relative;display:inline-block;width:100%;max-width:100%;">
    <img src="${cleanUrl}" alt="${cleanAlt}" loading="lazy" style="width:100%;height:auto;border-radius:10px;display:block;box-shadow:0 4px 12px rgba(0,0,0,0.06);" onerror="this.onerror=null;this.parentElement.innerHTML='<div style=\\'padding:1.25rem;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;color:#dc2626;font-size:0.875rem;\\'>⚠️ Image failed to load: ${cleanUrl}</div>';" />${resizeHandlesHtml}
  </div>${cleanCaption}
</figure>\n`;
}

export function createImageEmbed(url, alt = 'Article illustration', caption = '', options = {}) {
  const width = options.width || null;
  const align = options.align || 'center';
  const isInteractive = !!options.interactive;
  return buildImageMediaBlockHtml({ url, alt, caption, width, align, isInteractive });
}

/**
 * Strips editor-only interactive controls (toolbars, resize handles, temporary overlays)
 * so that clean semantic HTML with saved dimensions and alignment is stored in the database.
 */
export function cleanContentForStorage(html) {
  if (!html || typeof html !== 'string') return '';
  let clean = html;

  // 1. Remove editor toolbars (<header class="media-block-toolbar">...</header>)
  clean = clean.replace(/<header\b[^>]*\bclass="media-block-toolbar"[^>]*>[\s\S]*?<\/header>/gi, '');
  clean = clean.replace(/<div\b[^>]*\bclass="media-block-toolbar"[^>]*>[\s\S]*?<\/div>/gi, '');

  // 2. Remove resize handles
  clean = clean.replace(/<(?:span|div)\b[^>]*\bclass="[^"]*media-resize-handle[^"]*"[^>]*><\/(?:span|div)>/gi, '');

  // 3. Remove upload overlays and error states
  clean = clean.replace(/<div\b[^>]*\bclass="[^"]*media-upload-overlay[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '');
  clean = clean.replace(/<div\b[^>]*\bclass="[^"]*media-upload-error[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '');

  // 4. Remove temporary interactive state classes
  clean = clean.replace(/\b(is-selected|is-dragging|drop-indicator-top|drop-indicator-bottom|is-uploading)\b/g, '');

  // 5. Clean up redundant spaces in class attributes
  clean = clean.replace(/class="([^"]*)"/g, (m, cls) => `class="${cls.trim().replace(/\s+/g, ' ')}"`);

  return clean.trim();
}

/**
 * Prepares raw or database HTML for the Visual Editor:
 * Transforms all images, YouTube embeds, and legacy figures into interactive media blocks
 * with drag handles, move up/down, delete ✕ buttons, and corner resize handles.
 */
export function prepareContentForEditor(html) {
  if (!html || typeof html !== 'string') return '';
  let content = html;

  // 1. YouTube Shorts wrapper transformation
  content = content.replace(/<div\b[^>]*class="[^"]*(?:youtube-shorts-wrapper|video-shorts)[^"]*"[^>]*>[\s\S]*?<\/div>\s*<\/div>/gi, (match) => {
    const ytId = extractYouTubeId(match);
    if (!ytId) return match;
    return buildYouTubeMediaBlockHtml({ videoId: ytId, isShorts: true, isInteractive: true });
  });

  // 2. YouTube standard wrapper transformation
  content = content.replace(/<div\b[^>]*class="[^"]*video-container[^"]*"[^>]*>[\s\S]*?<\/div>/gi, (match) => {
    const ytId = extractYouTubeId(match);
    if (!ytId) return match;
    const isShorts = isYouTubeShortsUrl(match);
    return buildYouTubeMediaBlockHtml({ videoId: ytId, isShorts, isInteractive: true });
  });

  // 3. Media block / article image block transformation
  content = content.replace(/<figure\b[^>]*>([\s\S]*?)<\/figure>/gi, (match, inner) => {
    const imgMatch = inner.match(/<img\b([^>]*)>/i);
    if (!imgMatch) return match;
    const attrs = imgMatch[1];
    const srcMatch = attrs.match(/\bsrc=["']([^"']*)["']/i);
    const altMatch = attrs.match(/\balt=["']([^"']*)["']/i);
    const src = srcMatch ? srcMatch[1] : '';
    const alt = altMatch ? altMatch[1] : '';

    const capMatch = inner.match(/<figcaption\b[^>]*>([\s\S]*?)<\/figcaption>/i);
    const caption = capMatch ? capMatch[1] : '';

    const widthMatch = match.match(/data-width=["']?(\d+)["']?/i) || match.match(/max-width:\s*(\d+)px/i);
    const width = widthMatch ? parseInt(widthMatch[1], 10) : null;

    const alignMatch = match.match(/data-align=["']?(left|center|right)["']?/i) || match.match(/text-align:\s*(left|center|right)/i);
    const align = alignMatch ? alignMatch[1] : 'center';

    return buildImageMediaBlockHtml({ url: src, alt, caption, width, align, isInteractive: true });
  });

  return content;
}

/**
 * Safe HTML sanitizer to prevent malicious script injection while preserving rich editorial formatting.
 * Strictly enforces that iframes are ONLY from authorized YouTube domains (youtube-nocookie.com / youtube.com),
 * strips any leaked editor controls, and ensures safe image styles.
 */
export function sanitizeHtml(html) {
  if (!html || typeof html !== 'string') return '';
  let sanitized = html
    // Remove script tags and contents
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove style tags and contents that might hijack theme
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    // Strip editor-only control headers and resize spans from public rendering
    .replace(/<header\b[^>]*\bclass="media-block-toolbar"[^>]*>[\s\S]*?<\/header>/gi, '')
    .replace(/<div\b[^>]*\bclass="media-block-toolbar"[^>]*>[\s\S]*?<\/div>/gi, '')
    .replace(/<(?:span|div)\b[^>]*\bclass="[^"]*media-resize-handle[^"]*"[^>]*><\/(?:span|div)>/gi, '')
    .replace(/<div\b[^>]*\bclass="[^"]*media-upload-overlay[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '')
    .replace(/<div\b[^>]*\bclass="[^"]*media-upload-error[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '')
    // Strip dangerous on* attributes (onclick, onerror, onload, onmouseover, etc.)
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    // Neutralize javascript: links and image sources
    .replace(/(href|src)\s*=\s*["']\s*javascript:[^"']*["']/gi, '$1="#"')
    // Neutralize data: links except for safe image previews
    .replace(/href\s*=\s*["']\s*data:[^"']*["']/gi, 'href="#"');

  // Strict iframe domain filter: Match each iframe tag, extract src, keep ONLY if valid YouTube ID!
  sanitized = sanitized.replace(/<iframe\b([^>]*)>([\s\S]*?)<\/iframe>/gi, (match, attrs) => {
    const srcMatch = attrs.match(/\bsrc=["']([^"']*)["']/i);
    const src = srcMatch ? srcMatch[1] : '';
    const ytId = extractYouTubeId(src);
    if (ytId) {
      return `<iframe src="https://www.youtube-nocookie.com/embed/${ytId}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen loading="lazy" style="position:absolute;top:0;left:0;width:100%;height:100%;border:none;"></iframe>`;
    }
    return `<!-- Blocked unauthorized iframe: only YouTube embeds are permitted -->`;
  });

  return sanitized;
}

export const sanitizeContent = sanitizeHtml;

/**
 * Checks if a string contains Markdown formatting markers
 */
export function hasMarkdownSyntax(text) {
  if (!text || typeof text !== 'string') return false;
  const mdPatterns = [
    /^#{1,6}\s+\S+/m,            // Heading: # H1, ## H2, etc.
    /\*\*[^*]+?\*\*/,             // Bold: **text**
    /__[^_]+?__/,                 // Bold: __text__
    /(?:^|[^\w*])\*[^* \t\n][^*]*?\*(?:[^\w*]|$)/, // Italic: *text*
    /(?:^|[^\w_])_[^_ \t\n][^_]*?_(?:[^\w_]|$)/,   // Italic: _text_
    /~~[^~]+?~~/,                 // Strikethrough: ~~text~~
    /`[^`\n]+`/,                  // Inline code: `code`
    /```[\s\S]*?```/,             // Fenced code block
    /^\s*[-*+]\s+\S+/m,           // Unordered list item: - item, * item, + item
    /^\s*\d+\.\s+\S+/m,           // Ordered list item: 1. item
    /^\s*>\s+\S+/m,               // Blockquote: > quote
    /\[[^\]]+\]\((https?:\/\/[^\s)]+)\)/, // Link: [title](url)
    /!\[[^\]]*\]\((https?:\/\/[^\s)]+)\)/ // Image: ![alt](url)
  ];
  return mdPatterns.some(pattern => pattern.test(text));
}

/**
 * Converts standalone YouTube URLs and standalone Image URLs into rich responsive embeds
 * Provides backward compatibility for older articles that stored URLs as plain text
 */
export function convertStandaloneMediaUrls(content) {
  if (!content || typeof content !== 'string') return '';
  const lines = content.replace(/\r\n/g, '\n').split('\n');

  const processedLines = lines.map(line => {
    const trimmed = line.trim();

    // 1. Check if line is wrapped in <p>...</p> or <p><a href="...">...</a></p>
    const pLinkMatch = trimmed.match(/^<p>\s*(?:<a\s+[^>]*href=["']([^"']*)["'][^>]*>)?\s*(https?:\/\/[^\s<"']+)\s*(?:<\/a>)?\s*<\/p>$/i);
    if (pLinkMatch) {
      const targetUrl = pLinkMatch[1] || pLinkMatch[2];
      const ytId = extractYouTubeId(targetUrl);
      if (ytId) {
        return createYouTubeEmbed(targetUrl);
      }
      if (isValidImageUrl(targetUrl)) {
        return createImageEmbed(targetUrl, 'Article illustration');
      }
    }

    // 2. Check if line is a standalone URL (without <p>)
    if (/^https?:\/\/[^\s<"']+$/i.test(trimmed)) {
      const ytId = extractYouTubeId(trimmed);
      if (ytId) {
        return createYouTubeEmbed(trimmed);
      }
      if (isValidImageUrl(trimmed)) {
        return createImageEmbed(trimmed, 'Article illustration');
      }
    }

    return line;
  });

  return processedLines.join('\n');
}

/**
 * Converts Markdown string into clean, semantic HTML
 */
export function markdownToHtml(md) {
  if (!md || typeof md !== 'string') return '';

  // First convert standalone YouTube and Image URLs
  let processedMd = convertStandaloneMediaUrls(md);

  let lines = processedMd.replace(/\r\n/g, '\n').split('\n');
  let htmlBlocks = [];
  let inCodeBlock = false;
  let codeBlockLang = '';
  let codeBlockLines = [];
  let inList = null; // 'ul' | 'ol' | null
  let listItems = [];
  let currentParagraph = [];

  function flushList() {
    if (inList && listItems.length > 0) {
      const tag = inList;
      const listHtml = `<${tag}>\n` + listItems.map(item => `  <li>${formatInline(item)}</li>`).join('\n') + `\n</${tag}>`;
      htmlBlocks.push(listHtml);
      inList = null;
      listItems = [];
    }
  }

  function flushParagraph() {
    if (currentParagraph.length > 0) {
      const paraText = currentParagraph.join(' ').trim();
      if (paraText) {
        // If paragraph already consists solely of an HTML block element, don't wrap in <p>
        if (/^<(div|blockquote|table|figure|p|ul|ol|h[1-6]|iframe)[\s>]/i.test(paraText) && /<\/(div|blockquote|table|figure|p|ul|ol|h[1-6]|iframe)>$/i.test(paraText)) {
          htmlBlocks.push(paraText);
        } else {
          htmlBlocks.push(`<p>${formatInline(paraText)}</p>`);
        }
      }
      currentParagraph = [];
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // 1. Fenced Code Block start/end
    if (trimmed.startsWith('```')) {
      if (inCodeBlock) {
        const escapedCode = codeBlockLines.join('\n')
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
        htmlBlocks.push(`<pre><code class="language-${codeBlockLang || 'text'}">${escapedCode}</code></pre>`);
        inCodeBlock = false;
        codeBlockLines = [];
        codeBlockLang = '';
      } else {
        flushParagraph();
        flushList();
        inCodeBlock = true;
        codeBlockLang = trimmed.slice(3).trim();
        codeBlockLines = [];
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockLines.push(line);
      continue;
    }

    // 2. Empty line: separates paragraphs or lists
    if (!trimmed) {
      flushParagraph();
      flushList();
      continue;
    }

    // 3. Headings: # -> h2, ## -> h2, ### -> h3, #### -> h4
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      flushParagraph();
      flushList();
      const level = headingMatch[1].length;
      const tag = level <= 2 ? 'h2' : (level === 3 ? 'h3' : 'h4');
      htmlBlocks.push(`<${tag}>${formatInline(headingMatch[2].trim())}</${tag}>`);
      continue;
    }

    // 4. Blockquotes: > quote text
    const quoteMatch = line.match(/^>\s*(.+)$/);
    if (quoteMatch) {
      flushParagraph();
      flushList();
      htmlBlocks.push(`<blockquote>${formatInline(quoteMatch[1].trim())}</blockquote>`);
      continue;
    }

    // 5. Horizontal rule: --- or ***
    if (/^(\*{3,}|-{3,}|_{3,})$/.test(trimmed)) {
      flushParagraph();
      flushList();
      htmlBlocks.push('<hr />');
      continue;
    }

    // 6. Unordered List: - item, * item, + item
    const ulMatch = line.match(/^\s*[-*+]\s+(.+)$/);
    if (ulMatch) {
      flushParagraph();
      if (inList !== 'ul') {
        flushList();
        inList = 'ul';
      }
      listItems.push(ulMatch[1].trim());
      continue;
    }

    // 7. Ordered List: 1. item, 2. item
    const olMatch = line.match(/^\s*\d+\.\s+(.+)$/);
    if (olMatch) {
      flushParagraph();
      if (inList !== 'ol') {
        flushList();
        inList = 'ol';
      }
      listItems.push(olMatch[1].trim());
      continue;
    }

    // 8. Markdown Images alone on a line: ![alt](url)
    const imgOnlyMatch = trimmed.match(/^!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)$/);
    if (imgOnlyMatch) {
      flushParagraph();
      flushList();
      htmlBlocks.push(createImageEmbed(imgOnlyMatch[2], imgOnlyMatch[1] || 'Image'));
      continue;
    }

    // 9. Existing HTML block tag passed through as-is
    if (/^<(h[1-6]|div|p|ul|ol|blockquote|table|pre|iframe|figure)[\s>]/i.test(trimmed)) {
      flushParagraph();
      flushList();
      htmlBlocks.push(trimmed);
      continue;
    }

    // 10. Normal text line -> append to current paragraph
    currentParagraph.push(trimmed);
  }

  if (inCodeBlock) {
    const escapedCode = codeBlockLines.join('\n')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    htmlBlocks.push(`<pre><code>${escapedCode}</code></pre>`);
  }
  flushParagraph();
  flushList();

  return htmlBlocks.join('\n\n');
}

/**
 * Formats inline Markdown elements within text:
 * - Bold: **text** or __text__
 * - Italic: *text* or _text_
 * - Strikethrough: ~~text~~
 * - Inline code: `code`
 * - Links: [title](url)
 * - Inline images: ![alt](url)
 */
export function formatInline(text) {
  if (!text || typeof text !== 'string') return '';

  let out = text;

  // 1. Inline code: `code`
  out = out.replace(/`([^`\n]+)`/g, (m, code) => {
    const safe = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return `<code>${safe}</code>`;
  });

  // 2. Images: ![alt](url)
  out = out.replace(/!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/g, (m, alt, url) => {
    return `<img src="${url}" alt="${alt || 'Image'}" style="max-width:100%;height:auto;border-radius:10px;margin:1.75rem auto;display:block;" />`;
  });

  // 3. Links: [title](url)
  out = out.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, (m, title, url) => {
    return `<a href="${url}" target="_blank" rel="noopener noreferrer">${title}</a>`;
  });

  // 4. Bold: **text** or __text__
  out = out.replace(/\*\*([^*\n]+?)\*\*/g, '<strong>$1</strong>');
  out = out.replace(/__([^_\n]+?)__/g, '<strong>$1</strong>');

  // 5. Strikethrough: ~~text~~
  out = out.replace(/~~([^~\n]+?)~~/g, '<strong><del>$1</del></strong>');

  // 6. Italic: *text* or _text_
  out = out.replace(/(^|[^\w*])\*([^*\n\s][^*\n]*?)\*(?=[^\w*]|$)/g, '$1<em>$2</em>');
  out = out.replace(/(^|[^\w_])_([^_\n\s][^_\n]*?)_(?=[^\w_]|$)/g, '$1<em>$2</em>');

  return out;
}

/**
 * Cleans and converts rich HTML from Clipboard (e.g. ChatGPT, Word, Google Docs)
 * - Extracts fragment from ChatGPT clipboard
 * - Strips dark theme styles and hostile CSS
 * - Cleans and normalizes semantic tags, images and links
 */
export function cleanClipboardHtml(html) {
  if (!html || typeof html !== 'string') return '';

  let clean = html;

  // 1. Extract from <!--StartFragment--> ... <!--EndFragment--> if present
  const fragmentMatch = clean.match(/<!--StartFragment-->([\s\S]*?)<!--EndFragment-->/i);
  if (fragmentMatch && fragmentMatch[1]) {
    clean = fragmentMatch[1];
  } else {
    clean = clean
      .replace(/<!DOCTYPE[^>]*>/gi, '')
      .replace(/<html[^>]*>|<\/html>/gi, '')
      .replace(/<head[\s\S]*?<\/head>/gi, '')
      .replace(/<body[^>]*>|<\/body>/gi, '');
  }

  // 2. Remove script & style tags
  clean = sanitizeHtml(clean);

  // 3. Normalize image tags so they are responsive
  clean = clean.replace(/<img\b([^>]*)>/gi, (match, attrs) => {
    return `<img ${attrs} style="max-width:100%;height:auto;border-radius:10px;margin:1.75rem auto;display:block;" loading="lazy">`;
  });

  // 4. Remove inline styles that impose background colors, fixed dark text, or awkward fonts
  clean = clean.replace(/style="([^"]*)"/gi, (match, styleVal) => {
    if (/max-width|border-radius|display:\s*block/i.test(styleVal)) {
      return 'style="max-width:100%;height:auto;border-radius:10px;margin:1.75rem auto;display:block;"';
    }
    const stripped = styleVal
      .replace(/(background-color|background|color|font-family|font-size|line-height):\s*[^;]+;?/gi, '')
      .trim();
    return stripped ? `style="${stripped}"` : '';
  });

  // 5. Remove class attributes from ChatGPT (e.g. class="markdown prose ...")
  clean = clean.replace(/\sclass="[^"]*"/gi, '');

  // 6. Normalize generic spans/divs: replace empty spans with their inner content
  clean = clean.replace(/<span>(.*?)<\/span>/gi, '$1');

  // 7. Ensure links open safely in a new tab
  clean = clean.replace(/<a\s+(?:[^>]*?\s+)?href="([^"]*)"[^>]*>(.*?)<\/a>/gi, (m, href, text) => {
    if (!href || href === '#' || href.startsWith('javascript:')) {
      return text;
    }
    return `<a href="${href}" target="_blank" rel="noopener noreferrer">${text}</a>`;
  });

  return clean.trim();
}

/**
 * Universal Content Processor for Editor Paste Event:
 * Given raw clipboardData event:
 * - If user pasted YouTube link: converts to responsive embed
 * - If user pasted direct image URL: converts to responsive figure
 * - If user pasted rich HTML (e.g. ChatGPT, web browser, Google Docs): cleans and normalizes it
 * - If user pasted plain Markdown: converts to semantic HTML
 * - If user pasted plain text: preserves linebreaks into paragraphs
 * Returns clean semantic HTML ready for insertion
 */
export function processPastedContent(clipboardData) {
  if (!clipboardData) return '';

  const htmlData = clipboardData.getData('text/html');
  const textData = (clipboardData.getData('text/plain') || '').trim();

  // Case 1: Check if plain text is a standalone YouTube URL
  if (textData && (textData.startsWith('http://') || textData.startsWith('https://')) && !textData.includes('\n')) {
    const ytEmbed = createYouTubeEmbed(textData);
    if (ytEmbed) {
      return ytEmbed;
    }
    // Check if plain text is a standalone Image URL
    if (isValidImageUrl(textData)) {
      return createImageEmbed(textData, 'Article illustration');
    }
  }

  // Case 2: Rich HTML is available (ChatGPT, Google Docs, browser copy)
  if (htmlData && htmlData.trim()) {
    const cleaned = cleanClipboardHtml(htmlData);
    if (/<(p|h[1-6]|ul|ol|li|blockquote|strong|em|pre|code|table|img|a|figure|iframe)[\s>]/i.test(cleaned)) {
      return cleaned;
    }
  }

  // Case 3: Plain text with Markdown syntax
  if (textData && hasMarkdownSyntax(textData)) {
    return markdownToHtml(textData);
  }

  // Case 4: Plain text with multiple line breaks
  if (textData) {
    const paragraphs = textData.split(/\n\s*\n/).filter(p => p.trim());
    if (paragraphs.length > 1) {
      return paragraphs.map(p => {
        const yt = createYouTubeEmbed(p.trim());
        if (yt) return yt;
        if (isValidImageUrl(p.trim())) return createImageEmbed(p.trim());
        return `<p>${formatInline(p.trim().replace(/\n/g, '<br />'))}</p>`;
      }).join('\n\n');
    }
    // Single line or single paragraph with soft line breaks
    if (textData.includes('\n')) {
      return `<p>${formatInline(textData.replace(/\n/g, '<br />'))}</p>`;
    }
    return formatInline(textData);
  }

  return '';
}

/**
 * Render any content (HTML, Markdown, or Mixed) to fully formatted safe HTML.
 * Used identically by:
 * - AdminPostForm (Editor visual canvas, inline preview & modal preview)
 * - PostDetailPage (Public article page)
 */
export function renderContentToHtml(content) {
  if (!content || typeof content !== 'string') return '';

  let html = content.trim();

  // Step 1: Detect and transform standalone YouTube or Image URLs (backward compatibility)
  html = convertStandaloneMediaUrls(html);

  // Step 2: If content has NO HTML tags at all, convert from pure Markdown
  if (!/<[a-z][\s\S]*>/i.test(html)) {
    return sanitizeHtml(markdownToHtml(html));
  }

  // Step 3: If content has HTML tags, check if there are raw Markdown markers inside it
  if (hasMarkdownSyntax(html)) {
    // 1. Convert Markdown headings on separate lines: # H1, ## H2, ### H3
    html = html.replace(/^(#{1,6})\s+(.+)$/gm, (m, hashes, text) => {
      const level = hashes.length;
      const tag = level <= 2 ? 'h2' : (level === 3 ? 'h3' : 'h4');
      return `<${tag}>${formatInline(text.trim())}</${tag}>`;
    });

    // 2. Convert blockquotes on separate lines: > quote
    html = html.replace(/^>\s*(.+)$/gm, (m, text) => {
      return `<blockquote>${formatInline(text.trim())}</blockquote>`;
    });

    // 3. Convert markdown images alone on lines: ![alt](url)
    html = html.replace(/^!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)$/gm, (m, alt, url) => {
      return createImageEmbed(url, alt || 'Image');
    });

    // 4. Convert unordered lists in mixed content
    html = html.replace(/(?:^|\n)([-*+]\s+[^\n]+(?:\n[-*+]\s+[^\n]+)*)/g, (m, block) => {
      const items = block.trim().split('\n').map(l => `  <li>${formatInline(l.replace(/^[-*+]\s+/, '').trim())}</li>`).join('\n');
      return `\n<ul>\n${items}\n</ul>\n`;
    });

    // 5. Convert inline formatting (bold, italic, strikethrough, inline code, links)
    html = formatInline(html);
  }

  // Step 4: Strict sanitization (scripts, styles, event handlers, non-YouTube iframes)
  return sanitizeHtml(html);
}
