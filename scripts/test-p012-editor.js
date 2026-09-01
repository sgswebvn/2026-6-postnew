import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  extractYouTubeVideoId,
  extractStandaloneYouTubeId,
  buildYouTubeEmbedHtml,
  isEmptyVisualHtml,
  resolveContentToSave,
  sanitizePastedHtml,
  shouldOmitEmptyContent,
  replaceYouTubeUrlsWithEmbeds,
  stripYouTubeEditorChrome,
  finalizeEditorHtml
} from '../src/utils/postEditor.js';
import { pickPostFields, stripEmptyContentOverwrite, slugifyPost } from '../server/staffRules.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

let passed = 0;
let failed = 0;
const errors = [];

function assert(condition, message, category = 'P012') {
  if (condition) {
    passed++;
  } else {
    failed++;
    errors.push(`[${category}] ${message}`);
  }
}

const YT_ID = 'dQw4w9WgXcQ';
const urls = [
  ['https://www.youtube.com/watch?v=dQw4w9WgXcQ', true],
  ['https://youtu.be/dQw4w9WgXcQ', true],
  ['https://youtu.be/dQw4w9WgXcQ?si=abc123', true],
  ['https://www.youtube.com/embed/dQw4w9WgXcQ', true],
  ['https://m.youtube.com/watch?v=dQw4w9WgXcQ', true],
  ['https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=30s', true],
  ['https://www.youtube.com/watch?si=xxx&v=dQw4w9WgXcQ', true],
  ['https://www.youtube.com/shorts/dQw4w9WgXcQ', true],
  ['https://www.youtube.com/live/dQw4w9WgXcQ', true],
  ['https://youtube.com/watch?feature=share&v=dQw4w9WgXcQ', true],
  ['https://www.youtube.com/watch?v=dQw4w9WgXcQ&feature=share', true],
  ['dQw4w9WgXcQ', true],
  ['https://music.youtube.com/watch?v=dQw4w9WgXcQ', true],
  ['  https://youtu.be/dQw4w9WgXcQ  ', true],
  ['https://www.youtube.com/watch?v=SHORTID', false],
  ['https://youtube.com/clip/UgkxSomething', false],
  ['https://example.com/watch?v=dQw4w9WgXcQ', false]
];

for (const [url, ok] of urls) {
  const id = extractYouTubeVideoId(url);
  if (ok) {
    assert(id === YT_ID, `extractYouTubeVideoId keeps ID for ${url} (got ${id || 'EMPTY'})`, 'YouTube');
  } else {
    assert(!id, `extractYouTubeVideoId rejects ${url} (got ${id})`, 'YouTube');
  }
}

const embed = buildYouTubeEmbedHtml(YT_ID);
assert(embed.includes(`https://www.youtube.com/embed/${YT_ID}`), 'embed uses youtube.com/embed', 'YouTube');
assert(embed.includes('aspect-video'), 'embed wrapper is 16:9', 'YouTube');
assert(embed.includes('width="560"'), 'embed has width fallback', 'YouTube');
assert(buildYouTubeEmbedHtml('bad') === '', 'invalid video id does not emit iframe', 'YouTube');
assert(buildYouTubeEmbedHtml('<script>') === '', 'non-id video id is rejected', 'YouTube');

assert(isEmptyVisualHtml(''), 'empty string is empty visual html', 'Save');
assert(isEmptyVisualHtml('<br>'), '<br> is empty visual html', 'Save');
assert(isEmptyVisualHtml('<p><br></p>'), '<p><br></p> is empty visual html', 'Save');
assert(isEmptyVisualHtml('<div><br></div>'), '<div><br></div> is empty visual html', 'Save');
assert(isEmptyVisualHtml('<div>&nbsp;</div>'), 'nbsp-only is empty visual html', 'Save');
assert(!isEmptyVisualHtml('<p>Bai viet goc</p>'), 'real paragraph is not empty', 'Save');
assert(!isEmptyVisualHtml(buildYouTubeEmbedHtml(YT_ID)), 'YouTube-only embed is not empty visual html', 'Save');
assert(extractStandaloneYouTubeId('https://youtu.be/dQw4w9WgXcQ') === YT_ID, 'standalone paste URL extracts ID', 'YouTube');
assert(extractStandaloneYouTubeId('xem https://youtu.be/dQw4w9WgXcQ di') === '', 'mixed sentence is not a standalone URL', 'YouTube');

const convertedBare = replaceYouTubeUrlsWithEmbeds('Xem clip https://youtu.be/dQw4w9WgXcQ ngay');
assert(convertedBare.includes('youtube.com/embed/dQw4w9WgXcQ'), 'bare URL in text becomes embed', 'YouTube');
assert(!convertedBare.includes('https://youtu.be/dQw4w9WgXcQ'), 'original bare URL is replaced', 'YouTube');

const alreadyEmbedded = buildYouTubeEmbedHtml(YT_ID);
const convertedTwice = replaceYouTubeUrlsWithEmbeds(alreadyEmbedded);
const embedCount = (convertedTwice.match(/youtube\.com\/embed\/dQw4w9WgXcQ/g) || []).length;
assert(embedCount === 1, 'existing embed is not duplicated', 'YouTube');

const withAnchor = replaceYouTubeUrlsWithEmbeds('<p><a href="https://www.youtube.com/watch?v=dQw4w9WgXcQ">Video</a></p>');
assert(withAnchor.includes('yt-embed-block'), 'YouTube anchor becomes embed block', 'YouTube');

const chrome = `<div class="yt-embed-block" data-youtube-id="${YT_ID}"><div class="yt-embed-toolbar"><button data-yt-delete>Xoa</button></div><iframe src="https://www.youtube.com/embed/${YT_ID}"></iframe></div>`;
const strippedChrome = stripYouTubeEditorChrome(chrome);
assert(!strippedChrome.includes('yt-embed-toolbar'), 'save strips editor toolbar', 'YouTube');
assert(strippedChrome.includes('youtube.com/embed/dQw4w9WgXcQ'), 'save keeps iframe after stripping chrome', 'YouTube');
assert(finalizeEditorHtml('https://www.youtube.com/shorts/dQw4w9WgXcQ').includes('yt-embed-block'), 'finalize converts shorts URL', 'YouTube');

const article = '<p>Bai viet goc</p>';
const ytBlock = buildYouTubeEmbedHtml(YT_ID);
const formWithYt = article + ytBlock;

let saved = resolveContentToSave({
  activeTab: 'write',
  formContent: formWithYt,
  visualHtml: article
});
assert(saved.includes('youtube.com/embed/'), 'write tab keeps YouTube when visual is missing iframe', 'Save');
assert(saved.includes('Bai viet goc'), 'write tab still keeps article body', 'Save');

saved = resolveContentToSave({
  activeTab: 'write',
  formContent: formWithYt,
  visualHtml: article + ' them chu'
});
assert(saved.includes('youtube.com/embed/'), 'typing after insert still keeps YouTube from form', 'Save');

saved = resolveContentToSave({
  activeTab: 'write',
  formContent: formWithYt,
  visualHtml: '<div><br></div>'
});
assert(saved.includes('youtube.com/embed/') && saved.includes('Bai viet goc'), 'empty visual does not wipe form content', 'Save');

saved = resolveContentToSave({
  activeTab: 'preview',
  formContent: formWithYt,
  visualHtml: article
});
assert(saved.includes('youtube.com/embed/'), 'preview tab saves form content with YouTube', 'Save');

saved = resolveContentToSave({
  activeTab: 'code',
  formContent: article,
  visualHtml: article,
  textareaValue: formWithYt
});
assert(saved.includes('youtube.com/embed/'), 'code tab saves textarea value', 'Save');

saved = resolveContentToSave({
  activeTab: 'write',
  formContent: article,
  visualHtml: article + ytBlock
});
assert(saved.includes('youtube.com/embed/'), 'write tab keeps visual YouTube when present', 'Save');

assert(shouldOmitEmptyContent('', '<p>existing</p>'), 'empty incoming content must not overwrite existing', 'WipeGuard');
assert(!shouldOmitEmptyContent('<p>new</p>', '<p>existing</p>'), 'non-empty incoming content is allowed', 'WipeGuard');
assert(!shouldOmitEmptyContent('', ''), 'empty-to-empty is not an overwrite skip', 'WipeGuard');

const stripped = stripEmptyContentOverwrite({ title: 'Hi', content: '', status: 'draft' }, '<p>Keep me</p>');
assert(!Object.prototype.hasOwnProperty.call(stripped, 'content'), 'stripEmptyContentOverwrite drops empty content', 'WipeGuard');
assert(stripped.status === 'draft' && stripped.title === 'Hi', 'stripEmptyContentOverwrite keeps other fields', 'WipeGuard');

const kept = stripEmptyContentOverwrite({ content: '<p>New body</p>' }, '<p>Old</p>');
assert(kept.content === '<p>New body</p>', 'stripEmptyContentOverwrite allows real content updates', 'WipeGuard');

const patch = pickPostFields({ id: 'post-1', status: 'draft', bogus: 1 });
assert(patch.status === 'draft', 'status-only patch is picked', 'WipeGuard');
assert(!Object.prototype.hasOwnProperty.call(patch, 'content'), 'status-only patch does not include content', 'WipeGuard');
assert(!Object.prototype.hasOwnProperty.call(patch, 'id'), 'id is not a writable post field', 'WipeGuard');

assert(slugifyPost('AA. Tim Conway & Guests') === 'aa-tim-conway-guests', 'slugifyPost strips punctuation', 'Slug');
assert(slugifyPost('https://youtu.be/dQw4w9WgXcQ') === '', 'slugifyPost strips a lone YouTube URL', 'Slug');
assert(slugifyPost('Chiến lược đầu tư') === 'chien-luoc-dau-tu', 'slugifyPost handles Vietnamese', 'Slug');

const chatgpt = `
<section data-testid="conversation-turn" data-turn-id="abc" class="text-token-text-primary">
  <h1 data-start="0" data-end="20">Hello</h1>
  <p data-start="21">Body text</p>
  <span aria-hidden="true" class="PDq2pG_selectionAnchor"></span>
</section>
<script>alert(1)</script>
`;
const cleaned = sanitizePastedHtml(chatgpt);
assert(cleaned.includes('<h1') && cleaned.includes('Hello'), 'paste sanitizer keeps heading', 'Paste');
assert(cleaned.includes('Body text'), 'paste sanitizer keeps body', 'Paste');
assert(!cleaned.includes('conversation-turn'), 'paste sanitizer strips ChatGPT turn chrome', 'Paste');
assert(!cleaned.includes('text-token-text-primary'), 'paste sanitizer strips ChatGPT token class', 'Paste');
assert(!cleaned.includes('<script'), 'paste sanitizer strips script tags', 'Paste');
assert(!cleaned.includes('data-start'), 'paste sanitizer strips data-start', 'Paste');

const editorSrc = fs.readFileSync(path.join(root, 'src/pages/admin/AdminPostEditor.jsx'), 'utf8');
assert(editorSrc.includes('extractYouTubeVideoId'), 'editor uses shared YouTube parser', 'Source');
assert(editorSrc.includes('insertHtmlIntoEditor'), 'editor inserts HTML into visual DOM', 'Source');
assert(editorSrc.includes('resolveContentToSave'), 'editor save uses resolveContentToSave', 'Source');
assert(editorSrc.includes('decorateYouTubeBlocks'), 'editor decorates YouTube as movable blocks', 'Source');
assert(editorSrc.includes('placeYouTubeBlockAtPoint'), 'editor supports dragging YouTube blocks', 'Source');
assert(editorSrc.includes('extractStandaloneYouTubeId'), 'editor auto-embeds pasted YouTube URLs', 'Source');
assert(editorSrc.includes('sanitizePastedHtml'), 'editor sanitizes pasted HTML', 'Source');
assert(editorSrc.includes('api.getPostBySlug'), 'editor fetches full post when editing', 'Source');
assert(/Lock/.test(editorSrc) && editorSrc.includes('Lock'), 'Lock icon is imported and used', 'Source');
assert(!/content: prev\.content \+ embedHtml/.test(editorSrc), 'YouTube no longer only appends to formData', 'Source');

const listSrc = fs.readFileSync(path.join(root, 'src/pages/admin/AdminPostsList.jsx'), 'utf8');
assert(listSrc.includes('savePost({ id: post.id, status: newStatus })'), 'posts list toggle does not send empty content', 'Source');
assert(listSrc.includes('savePost({ id: post.id, enableAds: !post.enableAds })'), 'ads toggle does not send empty content', 'Source');

const dashSrc = fs.readFileSync(path.join(root, 'src/pages/admin/AdminDashboard.jsx'), 'utf8');
assert(dashSrc.includes('savePost({ id: post.id, status: newStatus })'), 'dashboard toggle does not send empty content', 'Source');

const apiSrc = fs.readFileSync(path.join(root, 'server/routes/api.js'), 'utf8');
assert(apiSrc.includes('allocateUniquePostSlug'), 'POST/PUT posts allocate unique slugs', 'Source');
assert(apiSrc.includes('stripEmptyContentOverwrite'), 'PUT posts refuse empty content overwrite', 'Source');

const cssSrc = fs.readFileSync(path.join(root, 'src/index.css'), 'utf8');
assert(cssSrc.includes('.editorial-prose .aspect-video iframe'), 'CSS sizes YouTube iframe inside aspect-video', 'Source');
assert(cssSrc.includes('height: 100% !important'), 'CSS forces iframe height 100%', 'Source');

console.log(`P012 tests: ${passed} passed, ${failed} failed`);
if (errors.length) {
  for (const err of errors) console.error(err);
  process.exit(1);
}
