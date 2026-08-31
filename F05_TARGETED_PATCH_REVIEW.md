# F05 TARGETED PATCH REVIEW

**Project:** THE HORI CLICK
**Date:** 2026-08-31
**Finding:** F05  EPublic draft exposure via `GET /s/:code`
**Scope:** Smallest safe patch only. No commit. No JWT/staff/auth/DB changes. No CDN migration.

---

## Overall

F05 shortlink draft exposure is **patched** in both shortlink handlers.

Anonymous `GET /s/:code` can no longer SSR, emit OG metadata, or redirect using unpublished/draft/missing post content. The target post must be loaded from MongoDB with `status: 'published'`. If that check fails, the handler returns the same safe unpublished/missing behavior as serverless `/post/:slug`: `302` to `https://www.thehori.click/`.

This patch does **not** purge leftover public CDN post JSON objects. That remains an operational cleanup task.

---

## Files changed

- `api/index.js`  EVercel/serverless `GET /s/:code`
- `server/index.js`  Elong-running Node `GET /s/:code`

No other files were modified for this patch.
`scripts/_f05_verify.js` was used as a temporary static checker and deleted after the run.

Nothing was committed.

---

## Changes

### Before (vulnerable)

Both handlers resolved a shortlink, then loaded the post with:

```js
Post.findOne({ slug: shortLink.postSlug })
```

If Mongo missed, they fell back to:

- `memoryStore.posts`
- `initialPosts`

`api/index.js` could also synthesize a post from `shortLink.postTitle` / `coverImage` / `excerpt` and SSR it.

Crawlers received full HTML. Browsers could be redirected to `originalUrl` or `/post/{draft-slug}`.

### After (patched)

Both handlers load the post only from MongoDB:

```js
Post.findOne({ slug: shortLink.postSlug, status: 'published' })
```

If the post is missing, unpublished, or Mongo throws:

- do **not** render content
- do **not** fall back to `memoryStore.posts`
- do **not** fall back to `initialPosts`
- do **not** invent OG HTML from shortlink metadata
- do **not** redirect to `originalUrl` or `/post/{draft-slug}`
- return `302 https://www.thehori.click/`

If a published post is found:

- crawlers still get `buildPostHtml` SSR
- browsers still redirect to `originalUrl` or `/post/{slug}?ref=...`

Unused `initialPosts` imports were removed because the post fallbacks that used them are gone.

Shortlink **record** lookup is unchanged:

- Mongo `ShortLink`
- `memoryStore.shortLinks`
- existing public CDN `shortlinks/{code}.json` in `api/index.js`

---

## Security verification

Static syntax check:

- `node --check api/index.js`  Epass
- `node --check server/index.js`  Epass

Source invariants on both `/s/:code` handlers:

| Invariant | `api/index.js` | `server/index.js` |
| --------- | -------------- | ----------------- |
| `findOne({ slug, status: 'published' })` | yes | yes |
| no `memoryStore.posts` | yes | yes |
| no `initialPosts` | yes | yes |
| no synthetic `postTitle` SSR | yes | yes |
| unpublished/missing ↁEhomepage 302 | yes | yes |
| `/post/:slug` remains published-only | yes | yes |

| Case | Result | Evidence |
| ---- | ------ | -------- |
| Published shortlink | **PASS** | Published Mongo hit still SSR for crawlers and still redirects browsers to `/post/{slug}`. |
| Draft shortlink | **PASS** | `status: 'published'` cannot return a draft. Null post ↁEhomepage 302, no SSR, no draft URL redirect. |
| Deleted post | **PASS** | Missing Mongo document ↁEhomepage 302, no SSR. |
| Anonymous access | **PASS** | `/s/:code` has no auth bypass. Publication is enforced server-side before SSR or redirect. |
| Mongo unavailable | **PASS** | Lookup catch leaves `post = null`. No memory/seed fallback. Homepage 302. |
| Direct post route | **PASS** | `/post/:slug` still queries `{ status: 'published' }` and does not use memory/seed. |

Live HTTP against Mongo was not run. Auth and database architecture were intentionally not started or changed. Cases B–E are fail-closed by construction.

---

## Diff scope

This task touched **only** F05 shortlink post resolution in:

- `api/index.js`
- `server/index.js`

plus the now-unused `initialPosts` imports.

It did **not** change:

- JWT implementation
- staff authorization
- login / logout
- `server/routes/api.js`
- env loading
- database connection behavior
- unrelated routes
- leftover public CDN post JSON objects

Note: the working tree already contained the earlier unpublished `/post/:slug` crawler fix from the prior security remediation. That was not reopened here.

---

## Regression risk

1. A previously valid shortlink whose post is now draft, deleted, or unpublished redirects home instead of rendering or sending users to `/post/{slug}`. That is the intended F05 behavior.
2. If Mongo is down, a published shortlink also redirects home instead of using memory/seed. Same fail-closed choice as `/post/:slug`.
3. `originalUrl` is used only after a published Mongo post is confirmed. A stale `originalUrl` on a **still-published** post can still redirect to an old slug; that is pre-existing shortlink data, not draft SSR.
4. Existing public CDN `posts/{slug}.json` objects are **not** purged by this patch. Direct CDN URLs remain an operational cleanup item, not part of this F05 code fix.

---

## Related P0 status after this patch

| Finding | Status | Notes |
| ------- | ------ | ----- |
| F01 | unchanged | Service-role env loader from prior remediation. |
| F02 | unchanged | JWT fail-closed from prior remediation. |
| F03 | unchanged | Staff PUT authorization from prior remediation. |
| F04 / F25 | unchanged | Mongo-only login from prior remediation. |
| **F05** | **patched for `/s/:code` and `/post/:slug`** | Shortlink draft SSR/redirect closed. Leftover public CDN objects still operational. |
| F26 | unchanged | DB actor + tokenVersion from prior remediation. |
| F28 | unchanged | Empty/omitted staff password from prior remediation. |

---

## Recommendation

The F05 shortlink hole in application code is closed.

Before production testing of the broader working tree, the earlier review still applies:

1. Set `JWT_SECRET` and `SUPABASE_SERVICE_ROLE_KEY` in deployment (not `NEXT_ROLE` / `NEXT_PUBLIC_SECRET`).
2. Confirm production staff passwords are scrypt `salt:hash`, or have a reset path.
3. Plan a one-time purge of leftover public CDN draft JSON (ops).

**Do not commit until those deployment prerequisites are accepted.**
