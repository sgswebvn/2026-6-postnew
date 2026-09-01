const YT_ID = '([a-zA-Z0-9_-]{11})';
const YT_PATTERNS = [
  new RegExp(`(?:youtube\\.com/watch\\?(?:[^#]*[&?])?v=)${YT_ID}`, 'i'),
  new RegExp(`(?:youtube\\.com/embed/)${YT_ID}`, 'i'),
  new RegExp(`(?:youtube\\.com/shorts/)${YT_ID}`, 'i'),
  new RegExp(`(?:youtube\\.com/live/)${YT_ID}`, 'i'),
  new RegExp(`(?:youtu\\.be/)${YT_ID}`, 'i')
];

export function extractYouTubeVideoId(rawUrl) {
  const raw = String(rawUrl || '').trim();
  if (!raw) return '';
  if (/^[a-zA-Z0-9_-]{11}$/.test(raw)) return raw;
  for (const re of YT_PATTERNS) {
    const match = raw.match(re);
    if (match && match[1]) return match[1];
  }
  return '';
}

export function buildYouTubeEmbedHtml(videoId) {
  const id = String(videoId || '').trim();
  if (!/^[a-zA-Z0-9_-]{11}$/.test(id)) return '';
  return `
<div class="yt-embed-block my-8 rounded-3xl overflow-hidden shadow-xl border border-neutral-200 dark:border-neutral-800 bg-black" data-youtube-id="${id}" contenteditable="false">
  <div class="aspect-video relative">
    <iframe
      class="w-full h-full absolute inset-0"
      src="https://www.youtube.com/embed/${id}"
      title="YouTube video player"
      width="560"
      height="315"
      frameborder="0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowfullscreen
      referrerpolicy="strict-origin-when-cross-origin">
    </iframe>
  </div>
</div>
`;
}

const YT_URL_RE = /https?:\/\/(?:www\.|m\.|music\.)?(?:youtube\.com\/(?:watch\?[^\s<"']+|embed\/[^\s<"']+|shorts\/[^\s<"']+|live\/[^\s<"']+)|youtu\.be\/[^\s<"']+)/gi;

export function extractStandaloneYouTubeId(text) {
  const trimmed = String(text || '').trim();
  if (!trimmed || /\s/.test(trimmed)) return '';
  return extractYouTubeVideoId(trimmed.replace(/[).,;!?]+$/g, ''));
}

export function replaceYouTubeUrlsWithEmbeds(html) {
  let src = String(html || '');
  if (!src) return src;

  const saved = [];
  src = src.replace(/<iframe\b[^>]*src=["'][^"']*youtube\.com\/embed\/[^"']*["'][^>]*>[\s\S]*?<\/iframe>/gi, (block) => {
    saved.push(block);
    return `\u0000YTIFRAME${saved.length - 1}\u0000`;
  });

  src = src.replace(/<a\b[^>]*href=["']([^"']+)["'][^>]*>[\s\S]*?<\/a>/gi, (full, href) => {
    const id = extractYouTubeVideoId(href);
    return id ? buildYouTubeEmbedHtml(id).trim() : full;
  });

  src = src.replace(YT_URL_RE, (url) => {
    const clean = url.replace(/[).,;!?]+$/g, '');
    const id = extractYouTubeVideoId(clean);
    if (!id) return url;
    return buildYouTubeEmbedHtml(id).trim() + url.slice(clean.length);
  });

  return src.replace(/\u0000YTIFRAME(\d+)\u0000/g, (_, i) => saved[Number(i)]);
}

export function stripYouTubeEditorChrome(html) {
  return String(html || '')
    .replace(/<div[^>]*class="[^"]*yt-embed-toolbar[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '')
    .replace(/\syt-embed-selected/g, '')
    .replace(/\sis-dragging/g, '')
    .replace(/\sdraggable="true"/gi, '')
    .replace(/\sdata-yt-dragging="[^"]*"/gi, '');
}

export function finalizeEditorHtml(html) {
  return stripYouTubeEditorChrome(replaceYouTubeUrlsWithEmbeds(html || '')).trim();
}

export function isEmptyVisualHtml(html) {
  const raw = String(html || '').trim();
  if (!raw) return true;
  if (/youtube\.com\/embed\/|yt-embed-block|<iframe\b|<img\b|<video\b|<figure\b/i.test(raw)) {
    return false;
  }
  const text = raw
    .replace(/&nbsp;/gi, ' ')
    .replace(/<br\s*\/?>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, '')
    .trim();
  return text.length === 0;
}

function collectYouTubeEmbeds(html) {
  const source = String(html || '');
  const found = [];
  const blockRe = /<div[^>]*yt-embed-block[^>]*>[\s\S]*?youtube\.com\/embed\/[\s\S]*?<\/iframe>[\s\S]*?<\/div>[\s\S]*?<\/div>/gi;
  let match;
  while ((match = blockRe.exec(source))) {
    found.push(match[0]);
  }
  if (found.length === 0) {
    const re = /<div[^>]*aspect-video[^>]*>[\s\S]*?youtube\.com\/embed\/[\s\S]*?<\/div>/gi;
    while ((match = re.exec(source))) {
      found.push(match[0]);
    }
  }
  if (found.length === 0) {
    const iframeRe = /<iframe[^>]+src=["']https?:\/\/www\.youtube\.com\/embed\/[a-zA-Z0-9_-]{11}[^"']*["'][^>]*>[\s\S]*?<\/iframe>/gi;
    while ((match = iframeRe.exec(source))) {
      found.push(match[0]);
    }
  }
  return found;
}

export function resolveContentToSave({ activeTab, formContent, visualHtml, textareaValue } = {}) {
  const form = finalizeEditorHtml(formContent);
  const visual = String(visualHtml || '').trim();
  const textarea = finalizeEditorHtml(textareaValue ?? formContent);

  if (activeTab === 'code') {
    return textarea;
  }

  if (activeTab === 'write') {
    if (isEmptyVisualHtml(visual)) return form;
    const visualClean = finalizeEditorHtml(visual);
    const formHasYt = /youtube\.com\/embed\//i.test(form);
    const visualHasYt = /youtube\.com\/embed\//i.test(visualClean);
    if (formHasYt && !visualHasYt) {
      const embeds = collectYouTubeEmbeds(form);
      if (embeds.length === 0) return form;
      return finalizeEditorHtml(`${visualClean}\n${embeds.join('\n')}`);
    }
    return visualClean;
  }

  return form;
}

export function sanitizePastedHtml(html) {
  let s = String(html || '');
  if (!s) return '';

  s = s.replace(/<!--[\s\S]*?-->/g, '');
  s = s.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
  s = s.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '');
  s = s.replace(/<\/?(html|body|meta|head|link)[^>]*>/gi, '');
  s = s.replace(/class="mso[^"]*"/gi, '');
  s = s.replace(/style="mso-[^"]*"/gi, '');
  s = s.replace(/<o:p>[\s\S]*?<\/o:p>/gi, '');

  s = s.replace(/<section\b[^>]*data-testid=["']conversation-turn["'][^>]*>/gi, '');
  s = s.replace(/<\/section>/gi, '');

  s = s.replace(/\s(?:data-turn-id|data-turn-id-container|data-is-intersecting|data-testid|data-turn|data-message-author-role|data-message-id|data-message-model-slug|data-conversation-screenshot-content|data-start|data-end|data-section-id|data-writing-block|data-turn-start-message)="[^"]*"/gi, '');

  s = s.replace(/\sclass="[^"]*(?:text-token-|PDq2pG_|R6Vx5W_|markdown-new-styling|prose dark:prose-invert|thread-content|agent-turn)[^"]*"/gi, '');
  s = s.replace(/<span[^>]*aria-hidden="true"[^>]*>\s*<\/span>/gi, '');
  s = s.replace(/\sclass=""/g, '');
  s = s.replace(/\s{2,}/g, ' ');

  return s.trim();
}

export function shouldOmitEmptyContent(incomingContent, existingContent) {
  const incoming = String(incomingContent || '').trim();
  const existing = String(existingContent || '').trim();
  return !incoming && Boolean(existing);
}

const YT_TOOLBAR_HTML = `
  <button type="button" data-yt-move="top" title="Đưa lên đầu bài viết">⤒ Đầu</button>
  <button type="button" data-yt-move="up" title="Đưa lên trên một khối">↑ Lên</button>
  <button type="button" data-yt-move="down" title="Đưa xuống dưới một khối">↓ Xuống</button>
  <button type="button" data-yt-move="bottom" title="Đưa xuống cuối bài viết">⤓ Cuối</button>
  <button type="button" data-yt-delete title="Xóa video">✕ Xóa</button>
`;

function liftYouTubeBlock(block, root) {
  let parent = block.parentElement;
  while (parent && parent !== root && parent !== document.body) {
    const tag = parent.tagName;
    const onlyThisBlock = parent.children.length === 1 && parent.firstElementChild === block;
    if (tag === 'P' || tag === 'SPAN' || tag === 'STRONG' || tag === 'EM' || tag === 'A' || (tag === 'DIV' && onlyThisBlock && parent !== root)) {
      const host = parent;
      host.parentNode.insertBefore(block, host);
      if (!host.textContent.trim() && !host.querySelector('img,iframe,table,figure,.yt-embed-block')) {
        host.remove();
      } else if (onlyThisBlock) {
        host.remove();
      }
      parent = block.parentElement;
    } else {
      break;
    }
  }
}

export function decorateYouTubeBlocks(root) {
  if (!root || typeof document === 'undefined') return;

  root.querySelectorAll('iframe[src*="youtube.com/embed"]').forEach((iframe) => {
    if (iframe.closest('.yt-embed-block')) return;
    const id = extractYouTubeVideoId(iframe.getAttribute('src') || '');
    const shell = iframe.closest('.aspect-video') || iframe;
    const block = document.createElement('div');
    block.className = 'yt-embed-block my-8 rounded-3xl overflow-hidden shadow-xl border border-neutral-200 dark:border-neutral-800 bg-black';
    if (id) block.setAttribute('data-youtube-id', id);
    const parent = shell.parentNode;
    if (!parent) return;
    parent.insertBefore(block, shell);
    if (shell === iframe) {
      const frame = document.createElement('div');
      frame.className = 'aspect-video relative';
      frame.appendChild(iframe);
      block.appendChild(frame);
    } else {
      block.appendChild(shell);
    }
  });

  root.querySelectorAll('.yt-embed-block').forEach((block) => {
    liftYouTubeBlock(block, root);
    block.setAttribute('contenteditable', 'false');
    block.setAttribute('draggable', 'true');
    const iframe = block.querySelector('iframe');
    if (iframe) iframe.style.pointerEvents = 'none';
    if (!block.querySelector('.yt-embed-toolbar')) {
      const bar = document.createElement('div');
      bar.className = 'yt-embed-toolbar';
      bar.setAttribute('contenteditable', 'false');
      bar.innerHTML = YT_TOOLBAR_HTML;
      block.insertBefore(bar, block.firstChild);
    }
  });
}

export function convertTypedYouTubeUrls(root) {
  if (!root || typeof document === 'undefined') return false;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  let changed = false;
  for (const node of nodes) {
    if (!node.parentElement || node.parentElement.closest('iframe, .yt-embed-block, a, code, pre')) continue;
    const raw = String(node.textContent || '');
    YT_URL_RE.lastIndex = 0;
    const match = YT_URL_RE.exec(raw);
    if (!match) continue;
    const id = extractYouTubeVideoId(match[0]);
    if (!id) continue;
    const wrap = document.createElement('div');
    wrap.innerHTML = buildYouTubeEmbedHtml(id).trim();
    const block = wrap.firstElementChild;
    if (!block) continue;
    const idx = match.index;
    const before = raw.slice(0, idx);
    const after = raw.slice(idx + match[0].length);
    const parent = node.parentNode;
    if (before) parent.insertBefore(document.createTextNode(before), node);
    parent.insertBefore(block, node);
    if (after) parent.insertBefore(document.createTextNode(after), node);
    node.remove();
    changed = true;
  }
  return changed;
}

export function moveYouTubeBlock(block, where) {
  const parent = block && block.parentNode;
  if (!parent) return;
  if (where === 'up' && block.previousElementSibling) {
    parent.insertBefore(block, block.previousElementSibling);
  } else if (where === 'down' && block.nextElementSibling) {
    parent.insertBefore(block.nextElementSibling, block);
  } else if (where === 'top') {
    parent.insertBefore(block, parent.firstChild);
  } else if (where === 'bottom') {
    parent.appendChild(block);
  }
}

export function placeYouTubeBlockAtPoint(root, block, clientY) {
  if (!root || !block) return;
  const children = [...root.children].filter((el) => el !== block);
  for (const child of children) {
    const rect = child.getBoundingClientRect();
    if (clientY < rect.top + rect.height / 2) {
      root.insertBefore(block, child);
      return;
    }
  }
  root.appendChild(block);
}
