# DIFF SECURITY REVIEW

**Project:** THE HORI CLICK
**Date:** 2026-08-31
**Scope:** Uncommitted working tree (11 modified files, 3 untracked files)
**Stats:** 520 insertions, 892 deletions
**Constraint:** This report is read-only analysis. No files were modified by the review itself except this report file.

---

## Overall

**NEEDS REVIEW**

This working tree is **security remediation**, not an accidental rewrite. The P0 auth issues are mostly closed in the new server path: no hardcoded service-role fallback, no default JWT secret, Mongo-only login, staff PUT no longer uses `$or`/`upsert`, drafts are filtered on public post APIs, and the admin staff form no longer sends `123456`.

It is **not SAFE** to treat as a drop-in production patch. `server/routes/api.js` is a large fail-closed rewrite (memory/CDN fallbacks removed), **F05 is incomplete** on short links and leftover public CDN objects, and production will not boot or authenticate unless new env vars are set. Rolling the whole diff back would restore known P0 holes.

---

## P0 Matrix

| Finding | Status | Evidence |
| ------- | ------ | -------- |
| F01     | PASS   | Hardcoded service-role fallback was removed from `server/routes/api.js`. New code reads only `process.env.SUPABASE_SERVICE_ROLE_KEY` via `getSupabaseServiceRoleKey()` in `server/env.js` and throws if missing. Upload maps that failure to 503. No `service_role` / `SUPABASE_SERVICE_ROLE` hits under `src/`. Residual hardcoded keys remain in **unchanged** scripts (`scripts/chaos-runtime-test.js`, `scripts/sanitize-db-cdn.js`) and in local gitignored `.env` under `NEXT_ROLE`; those are **not used** by the new server path. |
| F02     | PASS   | Default `'hori-click-secure-jwt-secret-2026-production'` and `NEXT_PUBLIC_SECRET` fallbacks were removed. `getJwtSecret()` requires `JWT_SECRET` with length ≥ 16 and never reads `NEXT_PUBLIC_*`. `server/index.js` calls `assertJwtConfigured()` and `process.exit(1)` on failure. `verifyToken()` returns null on bad/expired tokens; `requireAuth` responds **401**. Signing is always HMAC-SHA256; header `alg` is not used to select the algorithm, then must be `HS256`. Vercel `api/index.js` does **not** assert JWT at cold start (login becomes 503 / auth 401), which is fail-closed but not a boot-time production check. |
| F03     | PASS   | `PUT /staff/:id` uses `staffPutAuthorization(req.user, req.params.id)` only. Non-admin filter is `{ id: actor.id }`. `req.body.id` is not in the allow-list. Username is never used as the update selector. Update is `findOneAndUpdate({ id: existing.id }, { $set }, { upsert: false })`. Username collision returns **409**. Omitted/empty password ↁE`extractPasswordUpdate` `{ change: false }`. |
| F04     | PASS   | `POST /auth/login` returns **503** when mongoose is not ready, **before** any lookup. User lookup is `Staff.findOne` on Mongo only. Missing user ↁE**401**. `memoryStore.staff` is initialized to `[]`. `initialStaffList` is `[]`. `generateToken()` runs only after a successful Mongo password verify. |
| F05     | FAIL   | Anonymous `GET /posts` and `GET /posts/:slug` are published-only (drafts ↁE**404**). `/post/:slug` SSR now queries `{ status: 'published' }` and no longer reads CDN/memory/seed. **Still open:** `GET /s/:code` in both `api/index.js` and `server/index.js` loads `Post.findOne({ slug: shortLink.postSlug })` **without** a published filter, then falls back to `memoryStore.posts` / `initialPosts`, and will SSR that HTML to crawlers. New CDN writes are published-only and unpublish deletes the object, but this diff does **not** purge existing public `posts/{slug}.json` objects. Direct public CDN URLs can still bypass app publication rules for leftover files. |
| F25     | PASS   | Same path as F04. Memory/seed staff cannot issue a JWT. Mongo down ↁE503. Mongo up, unknown user ↁE401. Dead `needsUpgrade` branch never fires because plaintext verify was removed. |
| F26     | PASS   | `requireAuth` ↁE`resolveActorFromToken()` loads `Staff.findOne({ id: decoded.id })`, rejects missing/disabled users, and compares `tokenVersion`. `req.user.role` comes from `actorFromStaff(staffMember)` (DB), not from the JWT. New tokens contain only `id` and `tokenVersion`. Role change, disable, or delete in Mongo immediately drops privilege on the next request. Password change increments `tokenVersion`. |
| F28     | PASS   | `AdminStaff.jsx` edit/create password default is `''`. Empty password is deleted from the payload. `storageService.saveStaff` also strips empty password. Server `extractPasswordUpdate` does not hash/set password when the field is omitted, null, or blank. `POST /staff` no longer defaults to `123456`; it requires an explicit password ≥ 6 chars. |

---

## Change classification

Legend:

- **A**  ERequired security fix
- **B**  ERequired bug fix
- **C**  ERegression-risking behavior change
- **D**  EUnrelated refactor
- **E**  EDead-code removal
- **F**  EUnknown / needs investigation

| Area | Class | Notes |
| ---- | ----- | ----- |
| Remove hardcoded Supabase service-role fallback; load `SUPABASE_SERVICE_ROLE_KEY` | **A** | F01 |
| Remove JWT default / `NEXT_PUBLIC_SECRET`; fail-closed `JWT_SECRET` | **A** | F02 |
| JWT payload reduced to `id` + `tokenVersion`; DB actor + `tokenVersion` | **A** | F26 |
| Login Mongo-only; 503 if DB down; empty `memoryStore.staff` / `initialStaffList` | **A** | F04 / F25 |
| Delete plaintext seed staff accounts | **A** | F04 / credential leak |
| Staff PUT: id-only filter, no `$or`, no upsert, 409, password omit | **A** | F03 / F28 |
| Stop defaulting new/edit staff password to `123456` / `user123` | **A** | F28 |
| Public post APIs + `/post/:slug` crawler: published only; no CDN/seed fallback | **A** | F05 (partial) |
| Sync unpublished posts off Supabase; project public post fields | **A** | F05 |
| Client no longer falls back to public post JSON CDN | **A** | F05 |
| Send `Authorization` on `getPosts` / `getPostBySlug` | **A** | so CMS can still see drafts |
| Reject plaintext password verify (no auto-upgrade) | **A** / **C** | security-correct; can lock existing plaintext Mongo rows |
| Author mutate limited to `createdById === actor.id` | **A** / **C** | legacy posts with empty `createdById` become uneditable by authors |
| `upsert: false` on post/category/author updates | **A** | stops creating records via PUT |
| Strip public staff `username` / `role` / `permissions` / `status` | **A** / **C** | tighter sanitization; public staff UI may lose fields |
| Mongo down ↁE503 on posts/staff/auth instead of memory/CDN | **C** | availability / homepage / OG regression |
| Crawler 302 home when unpublished/missing instead of synthetic OG HTML | **C** | SEO / share cards |
| Remove memory fallbacks for comments, activity logs, staff writes | **C** | fail-closed writes |
| `refCode` alnum slice(0,16) | **A** | injection hygiene in OG HTML |
| `server/env.js`, `server/staffRules.js` | **A** | required new modules |
| `scripts/audit-check.js` | **D** | untracked probe; not imported |
| Remove rocket emoji from listen log | **D** | |
| Dead `needsUpgrade` login branch | **E** | leftover after plaintext verify removal |
| Shortlink unpublished lookup left in place | **C** / **F** | F05 hole inside a modified file |

---

## Regression Risks

1. **Production boot / login will fail without new env vars.** `JWT_SECRET` is not in `.env.example` and is absent from the local gitignored `.env`. `server/index.js` exits 1. Vercel uses `api/index.js`, which will 503 login if `JWT_SECRET` is unset. Uploads/CDN sync throw unless `SUPABASE_SERVICE_ROLE_KEY` is set; current local env still names the key `NEXT_ROLE`, which the new code **does not read**.

2. **Public reads no longer survive Mongo outages.** `GET /posts`, `GET /posts/:slug`, and crawler `/post/:slug` return 503 / 302 instead of CDN, `memoryStore`, or `initialPosts`. Homepage, post pages, and Facebook/Zalo OG cards can go empty during Atlas blips.

3. **Existing plaintext Mongo passwords cannot log in.** `verifyPassword()` now rejects any hash without `:`. The old auto-upgrade path is dead. If production staff rows were seeded from the old plaintext `initialStaffList`, every account 401s until passwords are reset via `STAFF_SEED_PASSWORD` on an empty collection (existing DBs are not modified).

4. **Author edit/delete of legacy posts.** `canMutatePost` requires `post.createdById === actor.id`. Historical posts with empty `createdById` are editable by admin/editor only. Authors will get 403.

5. **Staff create UX vs API.** Admin modal no longer pre-fills a password and does not validate one on create. Empty create ↁE`POST /staff` **400**. Edit path is correct for F28.

6. **Public staff JSON shape changed.** `sanitizeStaffForPublic` dropped `username`, `role`, `status`, `permissions`, `seedingHits`. Anything on the public site that rendered those fields will show blanks. Admin still gets `sanitizeStaffForAdmin` when the request has an admin/accountant actor.

7. **`GET /posts` now 503s instead of returning an array.** `storageService.initializeFromDB` already null-guards; localStorage/`initialPosts` can still paint the public UI with **stale or seed** posts, including drafts previously cached in `horizon_posts_v2`.

8. **Crawler behavior change.** Unknown/unpublished `/post/:slug` is now **302** to `/` instead of 200 OG HTML. Share previews for bad slugs and Mongo misses change.

9. **Post create/update no longer upserts and no longer writes memoryStore.** Offline/demo CMS flows that relied on in-memory success will 400/404. This is intended fail-closed, but it is a functional break versus the previous “always succeeds EAPI.

10. **Image upload fails closed without `SUPABASE_SERVICE_ROLE_KEY`.** Previously a hardcoded key always existed (insecure). After this diff, upload is 503 until the new env var is configured.

11. **JWT session invalidation.** New tokens omit `role`/`username`/`name`. Frontend login uses `response.user`, so UI should still work after a fresh login. Existing tokens signed with the old hardcoded secret will 401 unless `JWT_SECRET` is that same value.

12. **Authors can still set `status`, `featured`, `authorId` on posts they own** (`pickPostFields`). Ownership is enforced; field-level publish privilege is not.

13. **No unit tests** for `server/env.js` or `server/staffRules.js`. `scripts/audit-check.js` is not a security test.

---

## Unrelated Changes

- `scripts/audit-check.js` (untracked production/CDN probe; not imported).
- Listen-log emoji removal in `server/index.js`.
- `needsUpgrade` login branch left in place after plaintext verify was deleted (dead code).
- Broader fail-closed rewrite of categories/authors/comments/settings memory fallbacks  Ehygiene, not a listed P0.
- Public post projection dropping `factCheckerId` / `enableAds` / `focusKeyword` / `createdById` beyond the published-status filter.

---

## API compatibility

No router paths were removed. Same HTTP methods on the same `/api/*` routes.

| Change | Detail |
| ------ | ------ |
| Removed endpoints | None |
| Changed methods | None |
| Request fields | `PUT /staff/:id` ignores `id` and unknown fields; empty `password` is ignored. `POST /staff` no longer accepts a full `...req.body` spread and **requires** password. JWT body is only `{ id, tokenVersion, iat, exp }`. |
| Response fields | Anonymous posts use `publicPostProjection`. Public staff objects lost `username`, `role`, `status`, `permissions`, `seedingHits`. Login `user` is still `sanitizeStaffForAdmin`. |
| Status codes | **503** when Mongo is down on auth/posts/staff (was 200 from memory/CDN). **409** username collision (was upsert/create). **404** for anonymous draft slug/id (was 200). **400** creating staff without password (was 201 with `123456`). Draft crawler **302** (was 200 HTML). |
| Auth requirements | `GET /posts` and `GET /posts/:slug` gained `optionalAuth` (anonymous still allowed, published-only). Privileged routes still `requireAuth`. Privilege now uses **live DB role**, not JWT role. |
| Database behavior | Staff/post PUT `upsert: false`. Login does not touch `memoryStore`. Staff seed only if collection empty **and** `STAFF_SEED_PASSWORD` is set. Unpublished posts are deleted from the public bucket on sync. |

---

## Untracked files

| File | Required | Safe | Imported | Tested | Production-safe | Secrets |
| ---- | -------- | ---- | -------- | ------ | --------------- | ------- |
| `server/env.js` | Yes | Yes, if env vars are set | `auth.js`, `api.js`, `server/index.js` | No | Yes as a loader; process will not start without `JWT_SECRET` on the Node server | No hardcoded secrets. `getSupabaseUrl()` still defaults to the real project URL (not a key). |
| `server/staffRules.js` | Yes | Yes for F03/F28/post field picking | `server/routes/api.js` | No | Yes | No |
| `scripts/audit-check.js` | No | Mostly (public GETs only) | No | It **is** a manual probe, not a test suite | Do not ship/run as a server module | No secrets; it does fetch the public `posts_manifest.json` CDN URL |

---

## Secret scan

Inspected: `service_role`, `SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET`, `NEXT_PUBLIC_SECRET`, `NEXT_PUBLIC_JWT`, `123456`, `memoryStore`, `initialStaffList`, `seedData`, `upsert`, `$or`.

- **This diff removes** the production hardcoded service-role string from `server/routes/api.js` and the default JWT secret from `server/auth.js`.
- **This diff removes** plaintext staff passwords (`admin123`, `minh123`, …) from `server/seedData.js` and the `123456` staff POST default.
- **Still present, not introduced by this diff:** service-role JWT hardcoded in `scripts/chaos-runtime-test.js` and `scripts/sanitize-db-cdn.js`; local gitignored `.env` still contains `NEXT_PUBLIC_SECRET` and a service-role-shaped `NEXT_ROLE`. New server code does not read those names.
- **`$or` remaining uses** are post slug/id lookup and login username/email, not staff authorization. Staff PUT no longer uses `$or`.
- **`upsert: true` remaining:** settings update and referral hit counter only. Staff/post account edits are `upsert: false`.
- **`memoryStore` remaining:** categories/authors/settings/comments/shortlinks fallbacks; **staff is empty**; login does not use it.
- No `NEXT_PUBLIC_JWT` hits.

Do not treat the gitignored `.env` as part of this commit; it is still a local credential store and should stay untracked.

**No actual secret values are reproduced in this report.**

---

## Files inspected

### Modified

- `api/index.js`
- `server/auth.js`
- `server/db.js`
- `server/index.js`
- `server/models/Staff.js`
- `server/routes/api.js` (~855 changed lines)
- `server/seedData.js` (~233 changed lines)
- `src/pages/PostDetailPage.jsx`
- `src/pages/admin/AdminStaff.jsx`
- `src/services/api.js`
- `src/services/storageService.js`

### Untracked

- `scripts/audit-check.js`
- `server/env.js`
- `server/staffRules.js`

---

## Files Requiring Manual Review

Ranked by risk:

1. **`server/routes/api.js`**  E855-line fail-closed rewrite; all P0 auth/post/staff behavior lives here.
2. **`api/index.js`**  Ecrawler fix is real; shortlink path still unpublished + memory/seed.
3. **`server/index.js`**  Esame shortlink hole; JWT boot assert; published-only `/post/:slug`.
4. **`server/auth.js`**  EJWT and password verifier; plaintext lockout.
5. **`server/env.js`**  Enew fail-closed secret loader; env **name** change vs current `NEXT_ROLE`.
6. **`server/staffRules.js`**  EF03/F28/author rules; untested.
7. **`server/db.js`**  Econnected flag + staff seed via `STAFF_SEED_PASSWORD`.
8. **`server/seedData.js`**  Ecredential deletion (correct) plus empty `initialStaffList`.
9. **`src/services/storageService.js`** / **`src/pages/admin/AdminStaff.jsx`**  EF28 client path.
10. **`scripts/audit-check.js`**  Eunrelated untracked probe.

---

## Functional regression checklist

| Area | Status after this diff |
| ---- | ---------------------- |
| Post creation | Still present (`POST /posts`). No memory fallback; Mongo required. Sets `createdById`. |
| Post editing | Still present (`PUT /posts/:id`). `upsert: false`. Authors limited to own `createdById`. |
| Post deletion | Still present (`DELETE /posts/:id`). Same author ownership rule. Also deletes CDN object. |
| Post publication | Still present via `status` field. Unpublished posts are removed from CDN on sync. |
| Crawler `/post/:slug` | Published-only Mongo lookup. No CDN/memory/seed. Miss ↁE302 home. |
| Crawler `/s/:code` | **Not fully remediated.** Can SSR unpublished posts. |
| Image handling | Upload still `POST /upload` + requireAuth. Fails closed without `SUPABASE_SERVICE_ROLE_KEY`. |
| Supabase storage | Service role from env only. Drafts no longer written to public CDN on new sync. Leftover objects not purged. |
| Authentication | Mongo-only. 503 if DB down. 401 if user missing / password wrong / disabled. |
| Logout | Client still clears tokens. Server `POST /auth/logout` remains a no-op JSON success (unchanged model). |
| Staff CRUD | Create requires password; update does not overwrite omitted password; delete admin-only. |
| Role permissions | Live DB role via `resolveActorFromToken`. JWT role is ignored. |
| Admin UI | Password field empty on edit/create. Create without password ↁE400. |
| Author permissions | Own posts only, by `createdById`. Legacy posts without that field are blocked. |
| API routes | Same path list. Behavior/status codes changed as tabulated above. |
| Database connection | `isConnected = false` on missing URI or connect failure. Auth/writes unavailable. |
| Deployment / serverless | Vercel still routes `/api`, `/s`, crawler `/post` to `api/index.js`. JWT is not asserted at cold start. |

---

## Recommendation

**2. REQUIRES TARGETED FIXES BEFORE TESTING**

Do **not** roll the whole diff back: that would restore the hardcoded service-role key, default JWT secret, seed plaintext passwords, staff `$or`+`upsert`, and anonymous draft APIs.

Do **not** test this as-is against production until at least:

1. Shortlink post lookup is published-only (and does not SSR `memoryStore`/`initialPosts` drafts)  EF05.
2. Deployment actually has `JWT_SECRET` and `SUPABASE_SERVICE_ROLE_KEY` (not `NEXT_ROLE` / `NEXT_PUBLIC_SECRET`).
3. Production staff passwords are confirmed scrypt `salt:hash`, or a reset path is ready.
4. A one-time purge of leftover public CDN draft JSON is planned (ops, not necessarily this diff).

---

## Appendix  Erequired env vars after this diff

| Variable | Required by | Fail-closed behavior if missing |
| -------- | ----------- | ------------------------------- |
| `JWT_SECRET` | `server/env.js` ↁEauth + `server/index.js` boot | Node server exits 1. Serverless login 503 / auth 401. |
| `JWT_SECRET_PREVIOUS` | Optional rotation | Ignored if missing. |
| `SUPABASE_SERVICE_ROLE_KEY` | Upload + CDN sync | Throws; upload returns 503. Old name `NEXT_ROLE` is **not** read. |
| `MONGODB_URI` | `server/db.js` | `isConnected = false`; login/posts/staff 503. |
| `STAFF_SEED_PASSWORD` | Empty staff collection only | Warns; does not modify existing databases. |
| `STAFF_SEED_USERNAME` | Optional | Defaults to `admin`. |
| `STAFF_SEED_EMAIL` | Optional | Defaults to `admin@localhost`. |

Minimum `JWT_SECRET` length enforced in code is **16 characters**. That is fail-closed against empty/default secrets, but 16 characters is still a weak production secret; use a long random value.
