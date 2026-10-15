/**
 * Content Formatter & Markdown Engine for TheHorizon
 * Provides:
 * - Robust Markdown to HTML conversion
 * - Clipboard HTML cleaner (ChatGPT, Notion, Google Docs)
 * - Safe HTML sanitizer (XSS protection)
 * - Image & media embedding helpers
 */

// Safe HTML sanitizer
export function sanitizeHtml(html) {
  if (!html || typeof html !== 'string') return '';
  return html
    // Remove script tags and contents
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove style tags and contents that might hijack theme
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    // Strip dangerous on* attributes (onclick, onerror, onload, onmouseover, etc.)
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    // Neutralize javascript: links
    .replace(/href\s*=\s*["']\s*javascript:[^"']*["']/gi, 'href="#"')
    // Neutralize data: links except for safe image previews
    .replace(/href\s*=\s*["']\s*data:[^"']*["']/gi, 'href="#"');
}

export const sanitizeContent = sanitizeHtml;

/**
 * Checks if a string contains Markdown formatting markers
 */
export function hasMarkdownSyntax(text) {
  if (!text || typeof text !== 'string') return false;
  // Look for headings (# ), bold (** or __), italic (* or _), lists (- , * , 1. ), blockquotes (> ), links ([text](url)), code (` or ```)
  const mdPatterns = [
    /^#{1,6}\s+\S+/m,            // Heading: # H1, ## H2, etc.
    /\*\*[^*]+?\*\*/,             // Bold: **text**
    /__[^_]+?__/,                 // Bold: __text__
    /(?:^|[^\w*])\*[^* \t\n][^*]*?\*(?:[^\w*]|$)/, // Italic: *text* (not surrounded by word chars or empty)
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
 * Converts Markdown string into clean, semantic HTML
 */
export function markdownToHtml(md) {
  if (!md || typeof md !== 'string') return '';

  let lines = md.replace(/\r\n/g, '\n').split('\n');
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
        // If paragraph already consists solely of an HTML block element (like <div class="video-container"> or <img> or <blockquote>), don't wrap in <p>
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
        // Closing code block
        const escapedCode = codeBlockLines.join('\n')
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
        htmlBlocks.push(`<pre><code class="language-${codeBlockLang || 'text'}">${escapedCode}</code></pre>`);
        inCodeBlock = false;
        codeBlockLines = [];
        codeBlockLang = '';
      } else {
        // Opening code block
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

    // 3. Headings: # -> h2 (for article hierarchy), ## -> h2, ### -> h3, #### -> h4
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      flushParagraph();
      flushList();
      const level = headingMatch[1].length;
      // Map # to h2 (since h1 is page title), ## to h2, ### to h3, etc.
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
      htmlBlocks.push(`<p><img src="${imgOnlyMatch[2]}" alt="${imgOnlyMatch[1] || 'Image'}" style="max-width:100%;height:auto;border-radius:10px;margin:1.75rem auto;display:block;" /></p>`);
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

  // Flush remaining buffers
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

  // Protect already existing HTML tags by temporarily masking them or handling them safely
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

  // 4. Bold: **text** or __text__ (non-greedy, at least 1 character)
  out = out.replace(/\*\*([^*\n]+?)\*\*/g, '<strong>$1</strong>');
  out = out.replace(/__([^_\n]+?)__/g, '<strong>$1</strong>');

  // 5. Strikethrough: ~~text~~
  out = out.replace(/~~([^~\n]+?)~~/g, '<strong><del>$1</del></strong>');

  // 6. Italic: *text* or _text_
  // Note: Only match when preceded and followed by non-word or space, to avoid messing up math (e.g. 2 * 3) or snake_case_variables
  out = out.replace(/(^|[^\w*])\*([^*\n\s][^*\n]*?)\*(?=[^\w*]|$)/g, '$1<em>$2</em>');
  out = out.replace(/(^|[^\w_])_([^_\n\s][^_\n]*?)_(?=[^\w_]|$)/g, '$1<em>$2</em>');

  return out;
}

/**
 * Cleans and converts rich HTML from Clipboard (e.g. ChatGPT, Word, Google Docs)
 * - Extracts fragment from ChatGPT clipboard
 * - Strips dark theme styles and hostile CSS
 * - Cleans and normalizes semantic tags
 */
export function cleanClipboardHtml(html) {
  if (!html || typeof html !== 'string') return '';

  let clean = html;

  // 1. Extract from <!--StartFragment--> ... <!--EndFragment--> if present
  const fragmentMatch = clean.match(/<!--StartFragment-->([\s\S]*?)<!--EndFragment-->/i);
  if (fragmentMatch && fragmentMatch[1]) {
    clean = fragmentMatch[1];
  } else {
    // Strip <html>, <head>, <body> tags
    clean = clean
      .replace(/<!DOCTYPE[^>]*>/gi, '')
      .replace(/<html[^>]*>|<\/html>/gi, '')
      .replace(/<head[\s\S]*?<\/head>/gi, '')
      .replace(/<body[^>]*>|<\/body>/gi, '');
  }

  // 2. Remove script & style tags
  clean = sanitizeHtml(clean);

  // 3. Remove inline styles that impose background colors, fixed dark text, or awkward fonts
  // Keep useful styling like max-width on images
  clean = clean.replace(/style="([^"]*)"/gi, (match, styleVal) => {
    // If it's an image style, keep it or normalize
    if (/max-width|border-radius|display:\s*block/i.test(styleVal)) {
      return 'style="max-width:100%;height:auto;border-radius:10px;margin:1.75rem auto;display:block;"';
    }
    // Remove inline colors, backgrounds, font-families that ruin site theme
    const stripped = styleVal
      .replace(/(background-color|background|color|font-family|font-size|line-height):\s*[^;]+;?/gi, '')
      .trim();
    return stripped ? `style="${stripped}"` : '';
  });

  // 4. Remove class attributes from ChatGPT (e.g. class="markdown prose ...")
  clean = clean.replace(/\sclass="[^"]*"/gi, '');

  // 5. Normalize generic spans/divs: replace empty divs/spans with their inner content
  clean = clean.replace(/<span>(.*?)<\/span>/gi, '$1');

  // 6. Ensure links open safely in a new tab
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
 * - If user pasted rich HTML (e.g. ChatGPT, web browser, Google Docs): cleans and normalizes it
 * - If user pasted plain Markdown: converts to semantic HTML
 * - If user pasted plain text: preserves linebreaks into paragraphs
 * Returns clean semantic HTML ready for insertion
 */
export function processPastedContent(clipboardData) {
  if (!clipboardData) return '';

  const htmlData = clipboardData.getData('text/html');
  const textData = clipboardData.getData('text/plain') || '';

  // Case 1: Rich HTML is available
  if (htmlData && htmlData.trim()) {
    const cleaned = cleanClipboardHtml(htmlData);
    // If the cleaned HTML actually contains tags, use it!
    if (/<(p|h[1-6]|ul|ol|li|blockquote|strong|em|pre|code|table|img|a)[\s>]/i.test(cleaned)) {
      return cleaned;
    }
  }

  // Case 2: Plain text with Markdown syntax
  if (textData && hasMarkdownSyntax(textData)) {
    return markdownToHtml(textData);
  }

  // Case 3: Plain text with line breaks
  if (textData) {
    // If it contains multiple paragraphs separated by empty lines
    const paragraphs = textData.split(/\n\s*\n/).filter(p => p.trim());
    if (paragraphs.length > 1) {
      return paragraphs.map(p => `<p>${formatInline(p.trim().replace(/\n/g, '<br />'))}</p>`).join('\n\n');
    }
    // Single line or single paragraph with soft line breaks
    if (textData.includes('\n')) {
      return `<p>${formatInline(textData.trim().replace(/\n/g, '<br />'))}</p>`;
    }
    return formatInline(textData);
  }

  return '';
}

/**
 * Render any content (HTML, Markdown, or Mixed) to fully formatted safe HTML.
 * Used identically by:
 * - AdminPostForm (Editor inline preview & modal preview)
 * - PostDetailPage (Public article page)
 */
export function renderContentToHtml(content) {
  if (!content || typeof content !== 'string') return '';

  let html = content.trim();

  // If content has NO HTML tags at all, convert from pure Markdown
  if (!/<[a-z][\s\S]*>/i.test(html)) {
    return sanitizeHtml(markdownToHtml(html));
  }

  // If content has HTML tags, check if there are raw Markdown markers inside it
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
      return `<p><img src="${url}" alt="${alt || 'Image'}" style="max-width:100%;height:auto;border-radius:10px;margin:1.75rem auto;display:block;" /></p>`;
    });

    // 4. Convert inline formatting (bold, italic, strikethrough, inline code, links)
    html = formatInline(html);
  }

  return sanitizeHtml(html);
}
