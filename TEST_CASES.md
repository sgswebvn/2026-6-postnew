# THEHORIZON — COMPREHENSIVE TEST SPECIFICATION & QA AUDIT MATRIX

**Project:** TheHorizon (blogweb-cms)  
**QA Lead:** Senior Full-stack Engineer & Technical SEO Specialist  
**Execution Environment:** Node.js v24+, MongoDB Atlas, React 19, Express 4.21, Vite 6  
**Last Audit Run:** October 14, 2026  
**Automated Test Suite Status:** **62 / 62 PASSED (100% Pass Rate)**  

---

## 1. Automated Execution Instructions

To execute the automated regression test suite against the local development/staging environment:

```bash
# 1. Ensure backend server is running on port 5000
npm run server

# 2. In another terminal, run the automated integration & security test suite
npm test
# OR
node test-admin-suite.mjs
```

---

## 2. Test Case Matrix

| Test Case ID | Module | Type | Priority | Description | Preconditions | Steps | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|---|---|---|---|
| **TC-SYS-001** | System | Positive | P1 | Health Check API | Backend running | `GET /api/health` | HTTP 200, status: "online" | HTTP 200, status: "online" | **PASS** |
| **TC-SYS-002** | System | Security | P0 | Database Connection Security | Mongo URI in `.env` | Inspect connection pool & error masking | DB connected without leaking credentials in error responses | Healthy connection, sanitized errors | **PASS** |
| **TC-SYS-003** | Frontend | Positive | P1 | Vite Production Build | Dependencies installed | `npm run build` | Compiles JS/CSS bundles in `< 5s` without errors | Built cleanly in 3.60s (`dist/`) | **PASS** |
| **TC-SYS-004** | Security | Security | P0 | Dependency Vulnerability Scan | Node environment | `npm audit` | 0 high/critical vulnerabilities | 0 vulnerabilities found | **PASS** |
| **TC-PUB-001** | Public | Positive | P1 | Fetch Public Articles | Real MongoDB posts | `GET /api/posts?page=1&limit=12` | Returns array of published posts with total count | Returns real MongoDB posts (total: 19) | **PASS** |
| **TC-PUB-002** | Public | Positive | P1 | Load Article Detail by Slug | Valid post exists | `GET /api/posts/2nm-silicon-gaafet-nanosheets-backside-power` | HTTP 200, full body HTML and title | Loads full article content from database | **PASS** |
| **TC-PUB-003** | Public | Negative | P2 | Non-existent Article Slug | None | `GET /api/posts/non-existent-article-slug-xyz` | HTTP 404, error message | HTTP 404 "Article not found." | **PASS** |
| **TC-PUB-004** | Public | Positive | P2 | Related Articles Enrichment | Posts in same category | `GET /api/posts/:slug` | Response includes `relatedPosts` array (up to 3) | Array of related articles matching categoryId | **PASS** |
| **TC-PUB-005** | Public | Positive | P2 | Continuous Reading (Prev/Next) | Chronological posts | `GET /api/posts/:slug` | Response includes `prevPost` and `nextPost` | Prev/Next navigation populated correctly | **PASS** |
| **TC-PUB-006** | Public | Positive | P1 | Public Categories with Post Count | 8 Taxonomies exist | `GET /api/categories` | Array of 8 categories with accurate `postCount` | 8 categories returned with live counts | **PASS** |
| **TC-PUB-007** | Public | Positive | P1 | Category Detail by Slug | Valid category slug | `GET /api/categories/ai-frontier-tech` | HTTP 200, category details and post count | Resolves category details with count (4) | **PASS** |
| **TC-PUB-008** | Public | Negative | P2 | Non-existent Category Slug | None | `GET /api/categories/non-existent-taxonomy-9999` | HTTP 404 Not Found | HTTP 404 "Category not found." | **PASS** |
| **TC-PUB-009** | Public | Security | P1 | Category Slug Regex Injection Defense | None | `GET /api/categories/test[brackets(*+` | Handled safely as 404 without 500 regex syntax error | HTTP 404 handled safely without crash | **PASS** |
| **TC-PUB-010** | Public | Positive | P1 | Filter Posts by Category Slug or ID | Category exists | `GET /api/posts?categoryId=ai-frontier-tech` vs `cat-tech` | Both queries return identical 4 posts | Total 4 posts returned identically | **PASS** |
| **TC-PUB-011** | Public | Boundary | P2 | Search with Special Characters | None | `GET /api/posts?search=GAAFET+(nanosheets)` | Handles parentheses/symbols without crash | Returns matched post safely | **PASS** |
| **TC-PUB-012** | Public | Positive | P2 | Submit Editorial Contact Inquiry | Valid payload | `POST /api/contact` | HTTP 200, `success: true` | Inquiry logged and confirmed | **PASS** |
| **TC-PUB-013** | Public | Negative | P2 | Contact Form Email Validation | Malformed email | `POST /api/contact` with `email: 'bad'` | HTTP 400 Bad Request | HTTP 400 "Please provide a valid email" | **PASS** |
| **TC-PUB-014** | Public | Boundary | P2 | Contact Form Missing Required Field | Empty message | `POST /api/contact` with `message: ''` | HTTP 400 Bad Request | HTTP 400 "Name, email, and message are required" | **PASS** |
| **TC-UI-001** | UI | Positive | P1 | Brand Name Display Verification | App loaded | Inspect Navbar, Footer, and Meta | Strictly "TheHorizon" (Zero "Post" suffix) | "TheHorizon" displayed consistently | **PASS** |
| **TC-UI-002** | UI | Security | P0 | Zero Admin Exposure in Public Reader | Public view | Inspect PublicNavbar & PublicFooter source | No `/admin`, `onAdminClick`, or Admin buttons | Zero Admin links/buttons in public UI | **PASS** |
| **TC-UI-003** | UI | Positive | P2 | Table of Contents Removal | Post detail page | Inspect PostDetailPage source | Zero TOC component, zero `toc-box`, zero `tocItems` | TOC completely eliminated | **PASS** |
| **TC-UI-004** | UI | Positive | P2 | About & Contact Navigation Placement | Public view | Check Navbar vs Footer | Absent from Navbar/drawer; present in Footer | Relocated exclusively to Footer | **PASS** |
| **TC-UI-005** | UI | Responsive | P1 | Streamlined Category Row with More Dropdown | Desktop & Mobile | Check PublicNavbar category rendering | Top 4 on main row, remaining in "More" dropdown | Clean single row + outside-click dropdown | **PASS** |
| **TC-UI-006** | UI | Responsive | P1 | Responsive Media & 16:9 YouTube Embeds | Article content | Check `.article-rich-body img` & `iframe` | Max-width 100%, aspect-ratio 16/9, no layout overflow | Responsive CSS styles active | **PASS** |
| **TC-SEC-001** | Security | Security | P0 | HTML Sanitization for Rich Articles | Content with script | Pass `<script>alert(1)</script>` into renderer | Strips `<script>` tags & inline event handlers | Cleanly sanitized before rendering | **PASS** |
| **TC-SEC-002** | Security | Security | P0 | Prevent Draft Article Leakage | Draft post in DB | Request draft post via `/api/posts/:slug` | HTTP 404 Not Found | Draft strictly hidden from public | **PASS** |
| **TC-SEC-003** | Security | Security | P0 | Password Hashing & Timing Safe Equal | Staff account | Inspect `server/auth.js` | Uses scryptSync + `crypto.timingSafeEqual` | Constant-time comparison implemented | **PASS** |
| **TC-SEC-004** | Security | Security | P0 | Reject Unauthenticated Admin Access | No JWT token | `GET /api/admin/stats` | HTTP 401 Unauthorized | HTTP 401 Unauthorized | **PASS** |
| **TC-SEC-005** | Security | Security | P0 | Reject Invalid Admin Credentials | Bad password | `POST /api/auth/login` | HTTP 401 Unauthorized | HTTP 401 "Invalid username or password" | **PASS** |
| **TC-SEC-006** | Security | Security | P0 | Exclude Password Hash from API Output | Logged-in staff | `POST /api/auth/login` & `GET /api/admin/staff` | Zero `password` field in JSON output | Password field completely omitted | **PASS** |
| **TC-SEC-007** | Security | Security | P0 | Protection Against Accidental Mass Deletion | Admin token | `POST /api/admin/posts/delete-all` without phrase | HTTP 400 Bad Request | Blocked unless exact confirmation string provided | **PASS** |
| **TC-ADM-001** | Admin | Positive | P1 | Admin Login with Valid Credentials | Valid credentials | `POST /api/auth/login` | HTTP 200, JWT token returned, cookie set | Valid JWT token & admin session established | **PASS** |
| **TC-ADM-002** | Admin | Positive | P1 | Fetch Dashboard Telemetry & Stats | Admin token | `GET /api/admin/stats?range=30d` | Post counts, categories count, view metrics | Full metrics aggregated from real DB | **PASS** |
| **TC-ADM-003** | Admin | Positive | P2 | Date Range Filters for Analytics | Admin token | `GET /api/admin/stats?range=7d` & `this_year` | Start/end dates calculated accurately | Metrics filtered by exact range | **PASS** |
| **TC-ADM-004** | Admin | Positive | P1 | Create Post in MongoDB | Admin token | `POST /api/admin/posts` | HTTP 201, new post persisted in MongoDB | Post created successfully | **PASS** |
| **TC-ADM-005** | Admin | Boundary | P2 | Block Duplicate Post Slug | Existing slug | `POST /api/admin/posts` with duplicate slug | HTTP 400 Bad Request | HTTP 400 "A post with this URL slug already exists" | **PASS** |
| **TC-ADM-006** | Admin | Positive | P1 | Bulk Status Update (Draft / Publish) | Admin token | `POST /api/admin/posts/bulk` | HTTP 200, posts status updated | Selected posts updated in single operation | **PASS** |
| **TC-ADM-007** | Admin | Positive | P1 | Delete Post from MongoDB | Admin token | `DELETE /api/admin/posts/:id` | HTTP 200, post permanently removed | Post deleted and verified 404 afterwards | **PASS** |
| **TC-ADM-008** | Admin | Positive | P2 | Custom Script Injection Management | Admin token | Create, list, toggle, delete script | Scripts active on public `/api/scripts` only when enabled | Custom scripts managed dynamically | **PASS** |
| **TC-ADM-009** | Admin | Positive | P1 | Real-time Dynamic Settings Sync | Admin token | `PUT /api/admin/settings` | Settings persisted and reflected on `/api/settings` | Settings updated in real time | **PASS** |
| **TC-SEO-001** | SEO | Positive | P1 | Dynamic XML Sitemap Generation | DB posts & cats | `GET /sitemap.xml` | XML with `<urlset>`, `<loc>`, `<lastmod>`, `<changefreq>` | Sitemap generated dynamically from DB | **PASS** |
| **TC-SEO-002** | SEO | Security | P1 | Robots.txt Disallows Admin & Indexing | Crawler agent | `GET /robots.txt` | Allow `/`, Disallow `/admin*`, trỏ Sitemap | Robots.txt directives verified | **PASS** |
| **TC-SEO-003** | SEO | Positive | P1 | Dynamic Google AdSense ads.txt | Publisher ID set | `GET /ads.txt` | Formats `google.com, pub-XXXX, DIRECT, f08c47fec0942fa0` | Ads.txt dynamically formatted with verified pub ID | **PASS** |
| **TC-SEO-004** | SEO | Positive | P2 | HTML Lang & Default Title | Root document | Inspect `index.html` | `<html lang="en">` and TheHorizon title | Proper internationalization & default title | **PASS** |
| **TC-SEO-005** | SEO | Positive | P1 | JSON-LD Structured Data Injection | Public route | Inspect `ScriptInjector.jsx` | Emits `@type: WebSite`, `BlogPosting`, `BreadcrumbList` | Structured data tags active without admin leakage | **PASS** |

---

## 3. Core Web Vitals & Performance Observations

- **Bundle Size:** Vite production bundle gzip size is `120.77 kB` JS, `4.56 kB` CSS. Fast initial parse.
- **Cumulative Layout Shift (CLS):** Ad slots define `.ad-slot-container` with `min-height: 100px` to reserve vertical space before Google AdSense loads.
- **Largest Contentful Paint (LCP):** Preconnected to Google Fonts; featured story images use native `object-fit: cover` with proper aspect ratios.
- **Interaction to Next Paint (INP):** Lightweight Vanilla CSS without heavy runtime component libraries ensures zero UI thread locking.
