# ENV MIGRATION REPORT

**Project:** THE HORI CLICK
**Date:** 2026-08-31
**Mode:** Read-only. `.env` was not changed. No source files were modified except this report. No commit.
**Secret values:** not reproduced.

Local `.env` currently names:

- `MONGODB_URI`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_SECRET`
- `NEXT_ANON_PUBLIC`
- `NEXT_ROLE`

Security remediation added these **new required names** (not present in local `.env`):

- `JWT_SECRET`
- `SUPABASE_SERVICE_ROLE_KEY`

Frontend (`src/**`) contains **zero** `process.env` / `import.meta.env` / `NEXT_PUBLIC_*` reads. Vite is not configured to inject those names.

---

## Answers to the six special questions

1. **`NEXT_ROLE` is the old Supabase service-role credential variable.**
   Pre-remediation `server/routes/api.js` loaded
   `process.env.NEXT_ROLE || process.env.SUPABASE_SERVICE_ROLE || <hardcoded JWT>`.
   Current app code no longer reads `NEXT_ROLE`. Current local `.env` value is a JWT whose payload role is `service_role`. Operator scripts still read `NEXT_ROLE`.

2. **`NEXT_PUBLIC_SECRET` is the old JWT secret fallback  Ein name only.**
   Pre-remediation `server/auth.js` used
   `process.env.JWT_SECRET || process.env.NEXT_PUBLIC_SECRET || <hardcoded default>`.
   Current `getJwtSecret()` reads **only** `JWT_SECRET` and refuses `NEXT_PUBLIC_*`.
   The current local `NEXT_PUBLIC_SECRET` value is a Supabase `sb_secret_…` key, **not** a dedicated app JWT secret. Do **not** copy it into `JWT_SECRET`.

3. **`NEXT_ANON_PUBLIC` is unused and duplicates the idea of a Supabase anon key.**
   It is a JWT whose payload role is `anon`. No application, API, or script file reads this name. Frontend does not use a Supabase JS client. Safe to remove from app env.

4. **`NEXT_PUBLIC_SUPABASE_URL` is not required by the frontend.**
   `src/services/supabaseStorage.js` hardcodes the project URL. Server `getSupabaseUrl()` may still read it as a fallback after `SUPABASE_URL`, then a hardcoded project URL. Optional for the running app; still used by several `scripts/` tools.

5. **`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` is not required by the frontend.**
   No source file reads this name. Frontend uploads go through `POST /api/upload`. Safe to remove from app env.

6. **`SUPABASE_SERVICE_ROLE_KEY` is required only server-side.**
   Loaded in `server/env.js` ↁE`getSupabaseServiceRoleKey()` ↁE`server/routes/api.js` `supabaseAuthHeaders()` for upload, post CDN sync, staff manifest sync, and CDN delete. Not referenced under `src/`.

7. **`JWT_SECRET` is required by both the Node server and the Vercel/serverless API.**
   - Node: `server/index.js` calls `assertJwtConfigured()` at boot and `process.exit(1)` if missing.
   - Vercel: `api/index.js` mounts the same `server/routes/api.js` / `server/auth.js`. Login/token verify call `getJwtSecret()`. Missing secret ↁElogin 503, `requireAuth` 401. Cold start does **not** assert JWT, but any authenticated path still needs it.

---

| Variable | Used where | Client/Server | Required? | Replacement | Risk |
| -------- | ---------- | ------------- | --------- | ----------- | ---- |
| `MONGODB_URI` | `server/db.js` `connectDB()`; also `scripts/*` Mongo tools | Server / scripts | **Yes** for app | Keep | Missing ↁE`isConnected=false`; login/posts/staff 503. Safe as a private server var. |
| `NEXT_PUBLIC_SUPABASE_URL` | `server/env.js` `getSupabaseUrl()` fallback; many `scripts/*` | Server / scripts. **Not** frontend | No for app runtime (hardcoded URL exists). Useful for scripts | Prefer `SUPABASE_URL` on the server | Public URL, not a secret. Prefix `NEXT_PUBLIC_` is leftover Next.js naming. Removing does not break frontend. Server still works via hardcoded default. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Local `.env` only. **Zero source reads** | Unused | **No** | None. Do not ship to client | Prefix implies public exposure. Unused. Removing does not break the app. |
| `NEXT_PUBLIC_SECRET` | Local `.env` only in current source. Historically JWT fallback in `server/auth.js` | Unused now. Was server JWT fallback | **No** for current source | Do **not** reuse as `JWT_SECRET`. Create a new dedicated JWT secret | Name is public-prefixed. Current value is a Supabase secret-style key, not an app JWT. Copying it into `JWT_SECRET` would mix credential types. Removing does not break current source. |
| `NEXT_ANON_PUBLIC` | Local `.env` only. **Zero source reads** | Unused | **No** | None. Anon JWT is unused; frontend has no Supabase client | Duplicate of a Supabase anon JWT. Removing does not break the app. |
| `NEXT_ROLE` | Pre-remediation app service-role loader. Now only `scripts/chaos-runtime-test.js`, `scripts/sanitize-db-cdn.js`, `scripts/sync-all-mongo-to-supabase.js`, plus a comment in `scripts/final-round3-penetration-test.js` | Scripts only. **Not** current app server/client | **No** for app. Yes for those operator scripts until they are updated | `SUPABASE_SERVICE_ROLE_KEY` | This **is** the old service-role variable. App no longer reads it ↁEuploads/CDN sync fail unless the new name is set. Scripts still read the old name. Hardcoded fallbacks remain in two scripts (unsafe, out of this review’s edit scope). |
| `JWT_SECRET` | `server/env.js` `getJwtSecret()`; `server/auth.js` `generateToken` / `verifyToken`; `server/index.js` boot assert | Server only (Node **and** Vercel via `api/index.js`) | **Yes** | New dedicated secret, ≥ 16 chars (use a long random value) | **Missing locally.** Node server will not start. Vercel login/auth fail closed. Do not use `NEXT_PUBLIC_SECRET`. |
| `SUPABASE_SERVICE_ROLE_KEY` | `server/env.js` `getSupabaseServiceRoleKey()`; `server/routes/api.js` `supabaseAuthHeaders()` | Server only (Node **and** Vercel via shared router) | **Yes** for upload/CDN writes | Same credential class as old `NEXT_ROLE`, new private name | **Missing locally.** Upload/CDN sync throw; upload returns 503. Never put this on the client. |
| `SUPABASE_URL` | `server/env.js` `getSupabaseUrl()` first choice | Server | Optional | Preferred over `NEXT_PUBLIC_SUPABASE_URL` | If unset, falls back to `NEXT_PUBLIC_SUPABASE_URL` then hardcoded project URL. |
| `JWT_SECRET_PREVIOUS` | `server/env.js` `getJwtSecretPrevious()`; used during token verify rotation | Server | Optional | Keep only during JWT rotation | Missing is fine. |
| `STAFF_SEED_PASSWORD` / `STAFF_SEED_USERNAME` / `STAFF_SEED_EMAIL` | `server/db.js` empty-staff bootstrap | Server | Only if staff collection is empty | Keep private | Existing DBs are not modified. |
| `PORT` | `server/index.js` | Server | No (defaults to 5000) | Keep | Local Node only. |

---

## Occurrence map (current source)

### `MONGODB_URI`

| File | Context | Side | Safe? | Required? | Rename? | Removing breaks? |
| ---- | ------- | ---- | ----- | --------- | ------- | ---------------- |
| `server/db.js` | `connectDB()` | Server | Yes, if private | Yes | No | Yes  Eapp auth/writes 503 |
| `.env.example` | example | Docs | Placeholder | Yes to document | No | N/A |
| `scripts/comprehensive-system-qa.js` | mongoose.connect | Script | Yes | For that script | No | Script only |
| `scripts/chaos-runtime-test.js` | mongoose.connect | Script | Yes | For that script | No | Script only |
| `scripts/verify-tri-database-consistency.js` | mongoose.connect | Script | Yes | For that script | No | Script only |
| `scripts/verify-all-data.js` | mongoose.connect | Script | Yes | For that script | No | Script only |
| `scripts/post-hardening-chaos-test.js` | mongoose.connect | Script | Yes | For that script | No | Script only |
| `scripts/test-delete-persistence.js` | mongoose.connect | Script | Yes | For that script | No | Script only |
| `scripts/final-round3-penetration-test.js` | mongoose.connect | Script | Yes | For that script | No | Script only |
| `scripts/sync-all-mongo-to-supabase.js` | mongoose.connect | Script | Yes | For that script | No | Script only |
| `scripts/sanitize-db-cdn.js` | mongoose.connect | Script | Yes | For that script | No | Script only |

### `NEXT_PUBLIC_SUPABASE_URL`

| File | Context | Side | Safe? | Required? | Rename? | Removing breaks? |
| ---- | ------- | ---- | ----- | --------- | ------- | ---------------- |
| `server/env.js` `getSupabaseUrl()` | URL fallback after `SUPABASE_URL` | Server | Yes (public URL) | No; default URL exists | Prefer `SUPABASE_URL` | No for app |
| `scripts/chaos-runtime-test.js` | CDN URL | Script | Yes | For scripts | Can stay or use `SUPABASE_URL` | Scripts fall back to hardcoded URL |
| `scripts/post-hardening-chaos-test.js` | CDN URL | Script | Yes | For scripts | Same | Same |
| `scripts/comprehensive-system-qa.js` | CDN URL | Script | Yes | For scripts | Same | Same |
| `scripts/verify-tri-database-consistency.js` | CDN URL | Script | Yes | For scripts | Same | Same |
| `scripts/test-delete-persistence.js` | CDN URL | Script | Yes | For scripts | Same | Same |
| `scripts/final-round3-penetration-test.js` | CDN URL | Script | Yes | For scripts | Same | Same |
| `scripts/sync-all-mongo-to-supabase.js` | CDN URL | Script | Yes | For scripts | Same | Same |
| `scripts/sanitize-db-cdn.js` | CDN URL | Script | Yes | For scripts | Same | Same |
| `src/**` | none | Client | N/A | **No** | N/A | **No**  Efrontend hardcodes the URL |

### `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

No `.js` / `.jsx` / config reads. Present only in local `.env`.

- Client/Server: unused
- Safe? Name is public-prefixed; value is a publishable key. Unused.
- Required? **No**
- Replacement: none
- Removing: does **not** break the app

### `NEXT_PUBLIC_SECRET`

No current source reads. Historically JWT fallback in `server/auth.js`.

- Client/Server: unused now
- Safe? **No as a name** (`NEXT_PUBLIC_` implies browser exposure). Current value is a Supabase secret-style key, not an app JWT.
- Required? **No** for current source
- Replacement: new `JWT_SECRET` (generate fresh; do not copy this value)
- Removing: does **not** break current source

### `NEXT_ANON_PUBLIC`

No source reads.

- Client/Server: unused
- Safe? Unused anon JWT sitting in env; not loaded into the app
- Required? **No**
- Replacement: none (no Supabase client SDK in `src/`)
- Removing: does **not** break the app
- Duplicates: conceptually the same class of credential as a Supabase anon/publishable key; not used alongside `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

### `NEXT_ROLE`

| File | Context | Side | Safe? | Required? | Rename? | Removing breaks? |
| ---- | ------- | ---- | ----- | --------- | ------- | ---------------- |
| Current `server/**`, `api/**`, `src/**` | none |  E| N/A | **No for app** | Replace with `SUPABASE_SERVICE_ROLE_KEY` | **App already ignores it**  Ethat is the production break until the new name is set |
| `scripts/sync-all-mongo-to-supabase.js` | `SERVICE_KEY = process.env.NEXT_ROLE` | Script | Private script use | For that script | Yes ↁE`SUPABASE_SERVICE_ROLE_KEY` | That script cannot upload without a key |
| `scripts/chaos-runtime-test.js` | `process.env.NEXT_ROLE \|\| <hardcoded>` | Script | **Unsafe hardcoded fallback** | For that script | Yes | Script still has a hardcoded fallback |
| `scripts/sanitize-db-cdn.js` | same hardcoded fallback | Script | **Unsafe hardcoded fallback** | For that script | Yes | Same |
| `scripts/final-round3-penetration-test.js` | comment/string only | Script | N/A | No | Update comment later | No |

### `JWT_SECRET`

| File | Context | Side | Safe? | Required? | Rename? | Removing breaks? |
| ---- | ------- | ---- | ----- | --------- | ------- | ---------------- |
| `server/env.js` | `getJwtSecret()` / `assertJwtConfigured()` | Server | Yes if private and long | **Yes** | Keep this name | Yes |
| `server/auth.js` | sign + verify | Server | Yes | **Yes** | Keep | Yes  Ecannot issue or verify tokens |
| `server/index.js` | boot assert | Node server | Yes | **Yes** | Keep | Process exits 1 |
| `server/routes/api.js` | login catch if message includes `JWT_SECRET` | Server | Yes | **Yes** (indirect) | Keep | Login 503 |
| `api/index.js` | uses shared router/auth after `dotenv.config()` | Vercel serverless | Yes | **Yes** | Keep | Login 503 / auth 401 |

Not in local `.env`.

### `SUPABASE_SERVICE_ROLE_KEY`

| File | Context | Side | Safe? | Required? | Rename? | Removing breaks? |
| ---- | ------- | ---- | ----- | --------- | ------- | ---------------- |
| `server/env.js` | `getSupabaseServiceRoleKey()` | Server | Yes if private | **Yes** for writes | Keep this name | Yes |
| `server/routes/api.js` | `supabaseAuthHeaders()`; upload error mapping | Server | Yes | **Yes** for upload/CDN | Keep | Upload 503; post/staff CDN sync skipped/fails |

Not in local `.env`. Not in `src/`.

---

## Recommended migration

Do **not** copy values in chat. Apply locally / in Vercel by name.

### Add (required for current source)

| Add | How |
| --- | --- |
| `JWT_SECRET` | Generate a **new** long random secret (≥ 16 characters; use much longer). Do **not** copy `NEXT_PUBLIC_SECRET`. Do **not** use any `NEXT_PUBLIC_*` value. Set on local `.env` **and** Vercel. |
| `SUPABASE_SERVICE_ROLE_KEY` | Set to the existing Supabase **service role** credential currently stored under `NEXT_ROLE`. Server-only. Set on local `.env` **and** Vercel. Then rotate that key in the Supabase dashboard when practical (it was previously named like a Next public var and still hardcoded in two scripts). |

### Optional / preferred renames

| From | To | Notes |
| ---- | -- | ----- |
| `NEXT_PUBLIC_SUPABASE_URL` | `SUPABASE_URL` | Server `getSupabaseUrl()` already prefers `SUPABASE_URL`. Keep the old name temporarily if scripts still need it. |
| `NEXT_ROLE` | `SUPABASE_SERVICE_ROLE_KEY` | App already uses the new name. Scripts still use the old name until updated. |

### Keep unchanged

- `MONGODB_URI`  Estill required.

### Keep out of the browser

Never add `VITE_` / `NEXT_PUBLIC_` prefixes to `JWT_SECRET` or `SUPABASE_SERVICE_ROLE_KEY`. Current Vite config does not expose `process.env` to `src/`, and that must stay true.

---

## Variables that can be removed

Proven **unused by current application source** (`server/`, `api/`, `src/`):

1. **`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`**  Ezero reads.
2. **`NEXT_ANON_PUBLIC`**  Ezero reads; unused anon JWT; frontend has no Supabase client.
3. **`NEXT_PUBLIC_SECRET`**  Ezero reads in current source; old JWT fallback only.
4. **`NEXT_ROLE` from the running app env**  Ezero reads in `server/` / `api/` / `src/`.
   Do **not** delete it until:
   - `SUPABASE_SERVICE_ROLE_KEY` is set, **and**
   - operator scripts are either unused or updated.

**Do not remove `MONGODB_URI`.**
**Do not remove `NEXT_PUBLIC_SUPABASE_URL` until `SUPABASE_URL` is set or you accept the hardcoded URL default.**

---

## Deployment impact

Vercel routes `/api/*`, `/s/*`, and crawler `/post/*` to `api/index.js` (`vercel.json`). That file calls `dotenv.config()` and mounts `server/routes/api.js`. Platform env vars, not the gitignored local `.env`, are what production sees.

### Must add on Vercel / production

| Variable | Required | If missing |
| -------- | -------- | ---------- |
| `MONGODB_URI` | Yes | Auth and CMS writes 503 |
| `JWT_SECRET` | Yes | Node-style boot N/A on Vercel; login 503; authenticated routes 401 |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Image upload 503; published-post CDN sync/delete cannot authenticate |

### Optional on Vercel

| Variable | Effect |
| -------- | ------ |
| `SUPABASE_URL` | Overrides hardcoded project URL for server Storage calls |
| `JWT_SECRET_PREVIOUS` | Only during JWT rotation |
| `STAFF_SEED_PASSWORD` (+ optional username/email) | Only if the staff collection is empty |

### Should not be added to Vercel as public/client vars

- `NEXT_PUBLIC_SECRET`
- `NEXT_ROLE`
- `NEXT_ANON_PUBLIC`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `JWT_SECRET` / `SUPABASE_SERVICE_ROLE_KEY` under any `NEXT_PUBLIC_` or `VITE_` name

### Local impact if names are not migrated

With the current `.env` **as named today**:

- `node server/index.js` **will not stay up**  E`JWT_SECRET` missing ↁE`assertJwtConfigured()` exits 1.
- Vercel/serverless **will not authenticate**  Esame missing `JWT_SECRET`.
- Uploads and CDN writes **will fail**  E`SUPABASE_SERVICE_ROLE_KEY` missing; `NEXT_ROLE` is ignored by app code.
- Mongo can still connect if `MONGODB_URI` is present.
- Frontend still loads because it does not read these env names.

`.env.example` currently documents only `PORT` and `MONGODB_URI`. It does **not** document `JWT_SECRET` or `SUPABASE_SERVICE_ROLE_KEY`. That documentation gap is real; this review did not edit it.

---

## Recommended target env (names only)

**Production / Vercel (server):**

```
MONGODB_URI=
JWT_SECRET=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_URL=
```

**Local `.env` (same, plus optional):**

```
PORT=5000
MONGODB_URI=
JWT_SECRET=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_URL=
STAFF_SEED_PASSWORD=
```

**Stop using for the app:**

```
NEXT_PUBLIC_SECRET
NEXT_ROLE
NEXT_ANON_PUBLIC
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
```
