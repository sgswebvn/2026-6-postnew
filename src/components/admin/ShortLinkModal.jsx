import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useBlog } from '../../context/BlogContext';
import {
  Link2,
  Copy,
  Check,
  ExternalLink,
  Trash2,
  X,
  Zap,
  ClipboardCopy,
  UserCheck
} from 'lucide-react';
import { api } from '../../services/api';
import {
  prepareShortLinkFromPaste,
  extractPostSlugFromInput,
  resolveLoggedInStaffCode,
  findPostBySlug,
  shortLinkErrorMessage,
  CANONICAL_ORIGIN
} from '../../utils/shortLink';

export const ShortLinkModal = ({ isOpen, onClose, defaultPost = null }) => {
  const { posts, staffList, currentUser, showToast } = useBlog();
  const [pastedUrl, setPastedUrl] = useState('');
  const [customAlias, setCustomAlias] = useState('');
  const [shortLinks, setShortLinks] = useState([]);
  const [createdLink, setCreatedLink] = useState(null);
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [pasteHint, setPasteHint] = useState('');
  const inputRef = useRef(null);

  const staffCode = resolveLoggedInStaffCode(currentUser, staffList);
  const staffName = currentUser?.name || 'Cộng tác viên';

  const parsedPaste = useMemo(() => extractPostSlugFromInput(pastedUrl), [pastedUrl]);
  const matchedPost = useMemo(() => {
    if (parsedPaste.ok) return findPostBySlug(posts, parsedPaste.slug);
    if (defaultPost?.slug && !pastedUrl.trim()) return defaultPost;
    return null;
  }, [parsedPaste, posts, defaultPost, pastedUrl]);

  const loadLinks = async () => {
    try {
      const data = await api.getShortLinks();
      const list = Array.isArray(data) ? data : [];
      const isAdmin = currentUser?.role === 'admin';
      const mine = isAdmin || !staffCode
        ? list
        : list.filter((l) => String(l.staffCode || '').toUpperCase() === staffCode);
      setShortLinks(mine);
    } catch {
      setShortLinks([]);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    loadLinks();
    setCreatedLink(null);
    setCopied(false);
    setCustomAlias('');
    setPasteHint('');
    if (defaultPost?.slug) {
      const origin = typeof window !== 'undefined' ? window.location.origin : CANONICAL_ORIGIN;
      setPastedUrl(`${origin}/post/${defaultPost.slug}`);
    } else {
      setPastedUrl('');
    }
    const t = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, defaultPost?.slug, defaultPost?.id]);

  if (!isOpen) return null;

  const copyText = async (url) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        return true;
      }
    } catch {
      // fall through to execCommand
    }
    try {
      const ta = document.createElement('textarea');
      ta.value = url;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text || !String(text).trim()) {
        showToast('Clipboard trống. Hãy copy link bài viết rồi dán vào.', 'error');
        return;
      }
      setPastedUrl(String(text).trim());
      setCreatedLink(null);
    } catch {
      showToast('Không đọc được clipboard. Hãy dán (Ctrl+V) vào ô bên dưới.', 'error');
      inputRef.current?.focus();
    }
  };

  const handleGenerate = async (e) => {
    e?.preventDefault?.();
    if (isGenerating) return;

    const prepared = prepareShortLinkFromPaste({
      pastedUrl,
      currentUser,
      staffList,
      posts,
      customCode: customAlias
    });

    if (!prepared.ok) {
      const msg = shortLinkErrorMessage(prepared.error);
      setPasteHint(msg);
      showToast(msg, 'error');
      return;
    }

    setIsGenerating(true);
    setPasteHint('');
    try {
      const payload = {
        originalUrl: pastedUrl,
        postSlug: prepared.slug,
        postTitle: prepared.post?.title || '',
        coverImage: prepared.post?.coverImage || '',
        customCode: prepared.customCode
      };

      const saved = await api.createShortLink(payload);
      const origin = typeof window !== 'undefined' ? window.location.origin : CANONICAL_ORIGIN;
      const shortUrl = `${origin}/s/${saved.code}`;
      setCreatedLink(shortUrl);
      showToast('Đã tạo link rút gọn và gắn mã seeding của bạn!', 'success');
      loadLinks();
    } catch (err) {
      showToast('Lỗi khi tạo link rút gọn: ' + (err.message || 'không xác định'), 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async (url) => {
    const ok = await copyText(url);
    if (!ok) {
      showToast('Không sao chép được. Hãy bôi đen link và copy thủ công.', 'error');
      return;
    }
    setCopied(true);
    showToast(`Đã sao chép link rút gọn: ${url}`);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDelete = async (id) => {
    try {
      await api.deleteShortLink(id);
      showToast('Đã xóa link rút gọn', 'info');
      loadLinks();
    } catch (e) {
      showToast(e.message || 'Lỗi khi xóa link', 'error');
    }
  };

  const previewPost = matchedPost;
  const showParseError = pastedUrl.trim() && !parsedPaste.ok;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 font-admin animate-fadeIn">
      <div className="bg-white rounded-3xl border border-neutral-200 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-6 text-neutral-900">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-200">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-bold text-neutral-900">
                Công Cụ Rút Gọn Link Seeding
              </h2>
              <p className="text-xs text-neutral-500">
                Copy link bài viết hiện tại, dán vào đây — hệ thống tự gắn mã nhân viên theo tài khoản đăng nhập.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-neutral-100 text-neutral-400 hover:text-neutral-900 transition-colors"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-2 px-3 py-2.5 rounded-2xl bg-purple-50 border border-purple-200">
          <UserCheck className="w-4 h-4 text-purple-600 flex-shrink-0" />
          <p className="text-xs text-purple-900">
            {staffCode ? (
              <>
                Tự động gắn theo tài khoản <strong>{staffName}</strong>
                {' '}
                <span className="font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-purple-200">
                  ?ref={staffCode}
                </span>
              </>
            ) : (
              <span className="text-rose-700 font-semibold">
                Tài khoản chưa có mã seeding. Cập nhật mã ref trong hồ sơ trước khi tạo link.
              </span>
            )}
          </p>
        </div>

        <form onSubmit={handleGenerate} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1">
              1. Dán link bài viết hiện tại *
            </label>
            <div className="flex items-stretch gap-2">
              <input
                ref={inputRef}
                type="text"
                inputMode="url"
                autoComplete="off"
                spellCheck={false}
                placeholder="Dán URL bài viết, vd: https://www.thehori.click/post/ten-bai-viet"
                value={pastedUrl}
                onChange={(e) => {
                  setPastedUrl(e.target.value);
                  setCreatedLink(null);
                  setPasteHint('');
                }}
                onPaste={(e) => {
                  const text = e.clipboardData?.getData('text');
                  if (text) {
                    e.preventDefault();
                    setPastedUrl(String(text).trim());
                    setCreatedLink(null);
                    setPasteHint('');
                  }
                }}
                className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-xs font-mono text-neutral-900 focus:outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={handlePasteFromClipboard}
                className="px-3 py-2.5 bg-white hover:bg-neutral-50 text-neutral-700 rounded-xl text-xs font-bold border border-neutral-300 flex items-center gap-1.5 flex-shrink-0"
                title="Dán từ clipboard"
              >
                <ClipboardCopy className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Dán</span>
              </button>
            </div>
            {showParseError && (
              <p className="mt-1.5 text-[11px] text-rose-600 font-semibold">
                {shortLinkErrorMessage(parsedPaste.error)}
              </p>
            )}
            {parsedPaste.ok && (
              <p className="mt-1.5 text-[11px] text-emerald-700 font-semibold">
                Đã nhận bài viết: <span className="font-mono">/post/{parsedPaste.slug}</span>
                {staffCode ? ` · sẽ gắn ?ref=${staffCode}` : ''}
              </p>
            )}
            {pasteHint && !showParseError && (
              <p className="mt-1.5 text-[11px] text-rose-600 font-semibold">{pasteHint}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1">
              2. Tùy chọn đuôi link ngắn (không bắt buộc)
            </label>
            <div className="flex items-center gap-1">
              <span className="px-2.5 py-2 bg-neutral-100 border border-neutral-300 rounded-l-xl text-xs font-mono text-neutral-500">
                /s/
              </span>
              <input
                type="text"
                placeholder="vd: qb01, hot-news (hoặc để trống)"
                value={customAlias}
                onChange={(e) => setCustomAlias(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 32))}
                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-r-xl text-xs font-mono text-neutral-900 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isGenerating || !staffCode}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-neutral-300 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all"
          >
            <Link2 className="w-4 h-4" />
            <span>{isGenerating ? 'Đang Tạo Link Ngắn...' : 'Tạo Link Rút Gọn Seeding Ngay'}</span>
          </button>
        </form>

        {createdLink && (
          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Link rút gọn đã sẵn sàng (đã gắn ?ref={staffCode}):</span>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={createdLink}
                className="w-full px-3.5 py-2.5 bg-white border border-emerald-300 rounded-xl text-xs font-mono font-bold text-emerald-900 select-all"
              />
              <button
                type="button"
                onClick={() => handleCopy(createdLink)}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all flex-shrink-0"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Đã Chép!' : 'Copy Link'}</span>
              </button>
            </div>

            {previewPost && (
              <div className="p-3 bg-white rounded-xl border border-emerald-200 text-xs space-y-2">
                <span className="text-[11px] font-bold text-neutral-500 block uppercase font-mono">
                  Xem trước thẻ khi dán lên Facebook / Zalo
                </span>
                <div className="flex items-center gap-3 p-2 bg-neutral-50 rounded-lg border border-neutral-200">
                  {previewPost.coverImage ? (
                    <img
                      src={previewPost.coverImage}
                      alt=""
                      className="w-16 h-16 rounded-lg object-cover flex-shrink-0 border"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-neutral-200 flex-shrink-0" />
                  )}
                  <div className="space-y-1 min-w-0">
                    <span className="text-[10px] font-mono text-neutral-400 uppercase font-bold block">THEHORI.CLICK</span>
                    <h4 className="font-serif font-bold text-neutral-900 text-xs truncate">{previewPost.title}</h4>
                    <p className="text-[11px] text-neutral-500 line-clamp-1">{previewPost.excerpt || previewPost.title}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {previewPost && parsedPaste.ok && !createdLink && (
          <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-xl border border-neutral-200 text-xs">
            {previewPost.coverImage ? (
              <img
                src={previewPost.coverImage}
                alt=""
                className="w-12 h-12 rounded-lg object-cover flex-shrink-0 border"
              />
            ) : null}
            <div className="min-w-0">
              <p className="font-serif font-bold text-neutral-900 truncate">{previewPost.title}</p>
              <p className="text-[11px] text-neutral-500 font-mono truncate">/post/{previewPost.slug}</p>
            </div>
          </div>
        )}

        {shortLinks.length > 0 && (
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold uppercase text-neutral-500 font-mono flex items-center justify-between">
              <span>Link rút gọn gần đây ({shortLinks.length})</span>
            </h3>

            <div className="divide-y divide-neutral-200 border border-neutral-200 rounded-2xl overflow-hidden max-h-48 overflow-y-auto">
              {shortLinks.slice(0, 8).map((link) => {
                const origin = typeof window !== 'undefined' ? window.location.origin : CANONICAL_ORIGIN;
                const fullShortUrl = `${origin}/s/${link.code}`;
                return (
                  <div key={link.id || link.code} className="p-3 bg-neutral-50 hover:bg-neutral-100/80 flex items-center justify-between gap-3 text-xs">
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <a
                          href={fullShortUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="font-mono font-bold text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <span>/s/{link.code}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                        {link.staffCode && (
                          <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 text-[10px] font-mono font-bold">
                            ?ref={link.staffCode}
                          </span>
                        )}
                        <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-mono font-bold">
                          {link.clicks || 0} Clicks
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-600 truncate max-w-sm">{link.postTitle || link.originalUrl}</p>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => handleCopy(fullShortUrl)}
                        className="p-1.5 bg-white hover:bg-neutral-200 rounded-lg text-neutral-700 border border-neutral-200"
                        title="Sao chép link"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(link.id || link.code)}
                        className="p-1.5 bg-white hover:bg-rose-50 rounded-lg text-rose-600 border border-neutral-200"
                        title="Xóa link"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
