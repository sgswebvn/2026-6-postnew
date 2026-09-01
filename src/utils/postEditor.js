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
<div class="my-8 rounded-3xl overflow-hidden aspect-video shadow-xl border border-neutral-200 dark:border-neutral-800 bg-black relative">
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
`;
}

export function isEmptyVisualHtml(html) {
  const raw = String(html || '').trim();
  if (!raw) return true;
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
  const re = /<div[^>]*aspect-video[^>]*>[\s\S]*?youtube\.com\/embed\/[\s\S]*?<\/div>/gi;
  let match;
  while ((match = re.exec(source))) {
    found.push(match[0]);
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
  const form = String(formContent || '').trim();
  const visual = String(visualHtml || '').trim();
  const textarea = String(textareaValue ?? form).trim();

  if (activeTab === 'code') {
    return textarea;
  }

  if (activeTab === 'write') {
    if (isEmptyVisualHtml(visual)) return form;
    const formHasYt = /youtube\.com\/embed\//i.test(form);
    const visualHasYt = /youtube\.com\/embed\//i.test(visual);
    if (formHasYt && !visualHasYt) {
      const embeds = collectYouTubeEmbeds(form);
      if (embeds.length === 0) return form;
      return `${visual}\n${embeds.join('\n')}`;
    }
    return visual;
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
