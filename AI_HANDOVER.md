# TÀI LIỆU BÀN GIAO & NHẬT KÝ DỰ ÁN DÀNH CHO AI (AI_HANDOVER.md)
> **Dành cho AI tiếp theo (Next AI Agent):** Hãy đọc kỹ toàn bộ tài liệu này trước khi thực hiện bất kỳ hành động nào. Tài liệu này được duy trì và cập nhật liên tục qua từng phiên làm việc, tổng hợp toàn bộ lịch sử trao đổi, kiến trúc dự án, các lỗi đã giải quyết, các thay đổi mã nguồn chi tiết, và các quy tắc nghiệp vụ bất biến của dự án **THE HORIZON POST**.

---

## 1. TỔNG QUAN HỆ THỐNG & DỰ ÁN

- **Tên dự án:** THE HORIZON POST (The Hori Click)
- **Mục tiêu sản phẩm:** Trang tin tức, phân tích tài chính cá nhân, công nghệ AI, khoa học trường thọ và kinh tế vĩ mô chuẩn chất lượng cao theo tiêu chuẩn biên tập Hoa Kỳ (US Editorial Standard).
- **Trang web Production hiện tại:** `https://2026-6-postnew.vercel.app/`
- **Tên miền mục tiêu (Domain & Canonical):** `https://www.thehori.click`
- **Mục tiêu quan trọng nhất:** Chuẩn bị hạ tầng & nội dung để được **Google AdSense xét duyệt 100%**, tuân thủ nghiêm ngặt chính sách bản quyền, Ads.txt, SEO E-E-A-T, hiệu năng cao và phân quyền nhân sự.
- **Mã nhà xuất bản AdSense:** `ca-pub-6469608148906900` (hiện tại ads.txt đã cấu hình chuẩn xác, đang chờ duyệt từ Google).

### Tech Stack:
- **Frontend:** React 18 (SPA), Vite 8.2.2, Tailwind CSS (kết hợp các lớp Vanilla CSS tinh chỉnh cao cấp tại `src/index.css`), Lucide React icons, DOMPurify.
- **Backend:** Node.js (v24+) + Express.js 5 (`server/index.js` & `server/routes/api.js`).
- **Database:** MongoDB Atlas qua Mongoose (`server/models/*`) kết hợp cơ chế fallback động `memoryStore` in-memory đảm bảo hệ thống không bao giờ sập ngay cả khi DB ngắt kết nối.
- **Storage:** Supabase Storage (Object storage lưu trữ ảnh bài viết & avatar nhân sự).
- **Deployment:** Vercel Serverless Function (`api/index.js` ánh xạ Express App).

---

## 2. QUY TẮC CỐT LÕI (BẮT BUỘC TUÂN THỦ CHO MỌI AI)

1. **Tuyệt đối KHÔNG commit, KHÔNG push, KHÔNG deploy:**
   - Mọi thay đổi đều được thực hiện và kiểm tra nghiêm ngặt tại **LOCAL**.
   - Chỉ người dùng mới là người quyết định thời điểm commit/push/deploy.
2. **Không tự ý phá hủy Database Production:**
   - Không chạy các lệnh xóa bảng (`dropDatabase`, `dropCollection`) trên MongoDB Atlas.
3. **Bảo tồn các tính năng độc lập khác:**
   - Tuyệt đối không làm ảnh hưởng đến: Reactions (Helpful, Insightful, Bullish, Deep Dive), Bookmarks (Đọc sau), Lượt xem (Telemetry), Chia sẻ mạng xã hội, Tác giả E-E-A-T, Google AdSense slots (Header, In-Article, Sidebar, Multiplex, Sticky Mobile Anchor), Nhân sự & Bảng lương (Staff Payroll), Tiếp thị liên kết Seeding (`?ref=CODE`).
4. **Không hỏi người dùng "file nằm ở đâu":**
   - AI phải tự tìm kiếm bằng `grep_search`, `view_file` để định vị đúng file cần chỉnh sửa.
5. **Cập nhật file `AI_HANDOVER.md` liên tục:**
   - Mỗi khi kết thúc một nhiệm vụ lớn hoặc có thay đổi cấu trúc, AI PHẢI cập nhật file này để lưu vết cho AI kế tiếp.

---

## 3. LỊCH SỬ CÁC GIAI ĐOẠN ĐÃ THỰC HIỆN (CHRONOLOGICAL TIMELINE)

### Giai đoạn 1: Cuộc Audit Toàn Diện & Tối Ưu Hóa Hệ Thống (Phases 1 - 5)
- **Mục tiêu:** Kiểm tra và khắc phục triệt để các lỗ hổng về Security, SEO, Ads.txt, RBAC, Database Resilience, và hiệu năng.
- **Các kết quả đạt được:**
  1. **Ads.txt & AdSense Policy:** Đồng bộ file `public/ads.txt` chứa `google.com, pub-6469608148906900, DIRECT, f08c47fec0942fa0`. Cấu hình đúng các vị trí banner quảng cáo mẫu đáp ứng chính sách Google.
  2. **Bảo mật & Phân quyền (RBAC):** Thiết lập phân quyền chặt chẽ: `admin` (toàn quyền), `editor`, `author`, `accountant`. Bảo vệ API bằng JWT Bearer Token, rate limiter chống Brute Force (`authLoginLimiter`) và chống Spam/DoS (`publicSpamLimiter`).
  3. **Tối ưu hóa hình ảnh:** Thiết lập hàm tiện ích `getOptimizedImageUrl()` tại `src/utils/imageOptimizer.js` tự động resize và nén WebP/JPEG theo breakpoint màn hình.
  4. **Hệ thống tạo Short-Link & Tiếp thị Seeding:** Tích hợp tính năng tự động đính kèm mã nhân viên `?ref=CODE` vào các liên kết bài viết được sao chép/chia sẻ, đồng thời lọc sạch rác URL từ Facebook (`fbclid`), Google (`gclid`), Zalo.

### Giai đoạn 2: Sửa Lỗi Chức Năng "Thêm Nhân Viên" (Staff Management)
- **Hiện tượng lỗi ban đầu:** Admin bấm thêm nhân viên mới trong trang `/admin/staff` báo lỗi không lưu được hoặc mật khẩu không hợp lệ.
- **Nguyên nhân cốt lõi:**
  - Logic backend kiểm tra độ dài mật khẩu và hash bcrypt bị lệch định dạng giữa req.body và model Staff.
  - Phân quyền mặc định thiếu một số cờ và schema MongoDB của Staff yêu cầu `tokenVersion`.
- **Cách khắc phục:**
  - Sửa `server/routes/api.js` (endpoint `POST /api/staff`): Chuẩn hóa validation (mật khẩu tối thiểu 6 ký tự, username duy nhất, hash mật khẩu bằng `hashPassword`), khởi tạo `tokenVersion: 0`.
  - Sửa `src/pages/admin/AdminStaffNew.jsx`: Đồng bộ form state, bổ sung các quyền chi tiết và hiển thị toast thông báo tiếng Việt trực quan.
  - Kết quả: Nhân viên được thêm mới lập tức, đăng nhập được ngay bằng tài khoản vừa tạo, tự động tạo mã giới thiệu referral (`refCode`).

### Giai đoạn 3: Cải Tiến Giao Diện "Trending Dispatches" (Trang Chủ)
- **Vấn đề trước khi sửa:**
  - Khối Trending bên phải cột Hero chỉ có số thứ tự `01`, `02`, `03` và dòng chữ tiêu đề, **không hề có hình ảnh đại diện**, giao diện đơn điệu và mất cân đối so với bài chính bên trái.
- **Yêu cầu người dùng:**
  - Bổ sung ảnh đại diện (thumbnail/cover) cân đối, đồng đều, đẹp mắt.
  - Tuyệt đối không làm méo, kéo giãn ảnh khi các bài có tỷ lệ ảnh gốc khác nhau.
  - Dùng `object-fit: cover` và căn giữa (`object-center`).
  - Đồng nhất chiều cao các card và responsive tốt trên mọi thiết bị.
  - Không thay đổi logic lấy dữ liệu hoặc API.
- **File đã chỉnh sửa:** [src/components/blog/HeroFeatured.jsx](file:///c:/Users/Administrator/Desktop/New%20folder/2026-6-postnew/src/components/blog/HeroFeatured.jsx)
- **Giải pháp kỹ thuật đã áp dụng:**
  - Bao bọc ảnh trong khung cố định: `w-20 sm:w-24 h-16 sm:h-20 shrink-0 rounded-lg overflow-hidden bg-neutral-100 dark:bg-neutral-800 border border-neutral-200/70 dark:border-neutral-800`.
  - Thẻ `<img>` dùng `src={getOptimizedImageUrl(post.coverImage, 360)}`, `className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"`, `loading="lazy"`, `decoding="async"`.
  - Thiết lập card `flex items-center gap-3 sm:gap-3.5 flex-1 min-h-[92px]` kết hợp tiêu đề `line-clamp-2` và `min-w-0` đảm bảo cả 3 card có chiều cao đồng nhất và thẳng hàng tuyệt đối.

### Giai đoạn 4: Xóa Hoàn Toàn Tính Năng "Comments / Bình Luận"
- **Yêu cầu người dùng:**
  - Loại bỏ hoàn toàn 100% chức năng Comments khỏi source code dự án (không chỉ là ẩn khỏi UI).
  - Xóa Components, Pages, Admin routes, API endpoints, Models, Services, Context, Mock data, và Test cases.
  - Không được xóa nhầm các tính năng Like, Reactions, Bookmark, Tác giả, Related Posts.
- **Chi tiết các file đã xóa (3 files):**
  1. `src/pages/admin/AdminComments.jsx` (Trang quản trị duyệt bình luận)
  2. `src/components/blog/CommentsSection.jsx` (Component cũ không dùng)
  3. `server/models/Comment.js` (Mongoose Schema & Model Comment)
- **Chi tiết các file đã chỉnh sửa (18 files):**
  1. `src/pages/PostDetailPage.jsx`: Xóa toàn bộ markup giao diện bình luận, form nhập, submit handler, state `commentsList`, `commentAuthor`, `commentContent`, `isSubmittingComment`, icon `MessageSquare`, `Send`.
  2. `src/App.jsx`: Xóa route `/admin/comments` và dynamic import `AdminComments`.
  3. `src/pages/admin/AdminLayout.jsx`: Xóa nav item `Kiểm Duyệt Bình Luận`.
  4. `src/pages/admin/AdminAccessDenied.jsx`: Xóa case phân quyền `canManageComments`.
  5. `src/pages/admin/AdminProfile.jsx`: Xóa fallback permission `canManageComments`.
  6. `src/pages/admin/AdminSettings.jsx`: Xóa nhắc đến "bình luận" trong hộp thoại reset data.
  7. `src/pages/TermsPage.jsx`: Đổi mục 3 từ "User Conduct in Forums & Comments" thành "Reader Conduct & Communications".
  8. `src/context/BlogContext.jsx`: Xóa các hàm `addComment`, `likeComment`, `deleteComment` khỏi Context.
  9. `src/services/storageService.js`: Xóa các hàm `getAllComments`, `getCommentsByPostSlug`, `addComment`, `likeComment`, `deleteComment`, key `STORAGE_KEYS.COMMENTS`, và sync comments trong `initializeFromDB()`.
  10. `src/services/api.js`: Xóa các client methods `getComments`, `addComment`, `likeComment`, `deleteComment`.
  11. `src/utils/defaultData.js`: Xóa `export const initialComments = []`.
  12. `server/routes/api.js`: Xóa import `Comment`, `initialComments`, và 4 routes: `GET /comments`, `POST /comments`, `POST /comments/:id/like`, `DELETE /comments/:id`.
  13. `server/db.js`: Xóa `Comment` model, `initialComments`, và đoạn code seeder comments vào MongoDB.
  14. `server/seedData.js`: Xóa mảng mẫu `export const initialComments = [...]`.
  15. `server/index.js`: Thêm middleware `app.all('/api/*splat', ...)` trả về JSON `{ error: 'Not Found' }` HTTP 404 cho mọi route API không tồn tại.
  16. `scripts/verify-imports.js`: Xóa `AdminComments` khỏi danh sách import audit.
  17. `scripts/test-suite.js`: Cập nhật route check và danh sách RBAC permission.
  18. `scripts/stress-test-10000.js`: Cập nhật RBAC permissions trong bộ test 10,000 ca.
  19. `scripts/test-shortlink.js`: Thay thế hash URL test `#comments` thành `#discussion-faq`.

---

## 4. TRẠNG THÁI HIỆN TẠI CỦA HỆ THỐNG (CURRENT SYSTEM STATE)

### A. Quy trình chạy Local:
1. **Frontend Dev Server:**
   - Lệnh: `npm run dev`
   - Cổng: `http://localhost:5173`
   - Tình trạng: **RUNNING** (Vite HMR phản hồi tức thì, không có lỗi console).
2. **Backend API Server:**
   - Lệnh: `node server/index.js`
   - Cổng: `http://localhost:5000`
   - Tình trạng: **RUNNING** (Kết nối thành công MongoDB Atlas, tất cả collection sẵn sàng).

### B. Kết quả Build & Lint:
- **Build:** `npm run build` -> Hoàn tất trong **285ms**, `dist/` đóng gói sạch sẽ, `0 error`.
- **Lint:** `npx oxlint` -> `0 error`.
- **Verify Imports:** `node scripts/verify-imports.js` -> `0 missing imports`.

### C. Kết quả 3 Bộ Test Tự Động (Automated Test Suites):
1. `node scripts/test-suite.js`: **5,573 / 5,573 Passed (100.00%)**
2. `node scripts/stress-test-10000.js`: **13,801 / 13,801 Passed (100.00%)**
3. `node scripts/test-shortlink.js`: **6,575 / 6,575 Passed (100.00%)**

### D. Kiểm thử HTTP Endpoints:
- `GET http://localhost:5000/api/posts` -> **200 OK** (trả về 39 bài viết chuẩn).
- `GET http://localhost:5000/api/staff` -> **200 OK** (trả về danh sách nhân sự đã được làm sạch bảo mật).
- `GET http://localhost:5000/api/comments` -> **404 Not Found** (chuẩn JSON, xác nhận route Comments đã bị xóa sổ hoàn toàn).

---

## 5. BẢN ĐỒ KIẾN TRÚC THƯ MỤC CHÍNH

```
2026-6-postnew/
├── public/
│   ├── ads.txt                  # Cấu hình AdSense: pub-6469608148906900
│   └── robots.txt
├── server/
│   ├── index.js                 # Entry backend Express, xử lý Open Graph Crawler & SPA fallback
│   ├── db.js                    # Kết nối MongoDB Atlas, seeder, in-memory cache fallback
│   ├── auth.js                  # JWT Token, bcrypt password hashing, sanitize staff
│   ├── staffRules.js            # RBAC permissions và validation dữ liệu bài viết
│   ├── seedData.js              # Dữ liệu mẫu chuẩn (Categories, Authors, Posts, Settings)
│   ├── models/                  # Mongoose Models: Post, Category, Author, Staff, Setting, etc.
│   └── routes/
│       └── api.js               # REST API endpoints cho toàn bộ hệ thống
├── src/
│   ├── App.jsx                  # SPA Router phân chia Public pages & Admin CMS
│   ├── index.css                # CSS Variables, Design system, Dark mode & Animation
│   ├── components/
│   │   ├── ads/                 # Các khối AdSense: AdSenseUnit, StickyBottomAd, etc.
│   │   ├── blog/                # ArticleCard, HeroFeatured, AuthorBioCard, TableOfContents
│   │   ├── common/              # Badge, Toast, CustomDialog, SearchModal
│   │   └── layout/              # Header, Footer, ReadingProgressBar
│   ├── context/
│   │   └── BlogContext.jsx      # Global State Provider (Posts, Categories, Auth, Toast, Dialog)
│   ├── pages/                   # HomePage, PostDetailPage, CategoryPage, TermsPage, etc.
│   │   └── admin/               # AdminDashboard, AdminPostsList, AdminPostEditor, AdminStaff, etc.
│   ├── services/
│   │   ├── api.js               # Fetch client gọi REST API backend
│   │   ├── storageService.js    # LocalStorage cache & đồng bộ DB cloud
│   │   └── telemetryService.js  # Analytics sự kiện đọc bài
│   └── utils/
│       ├── defaultData.js       # Dữ liệu khởi tạo fallback cho frontend
│       ├── imageOptimizer.js    # Tối ưu kích thước ảnh WebP/CDN
│       └── shortLink.js         # Phân giải và gắn mã giới thiệu referral ?ref=
├── scripts/
│   ├── test-suite.js            # 5,000-Point Comprehensive Test Suite
│   ├── stress-test-10000.js     # 10,000-Point Stress & Fuzzing Resilience Suite
│   ├── test-shortlink.js        # 1,000-Point Short-Link & Referral Suite
│   └── verify-imports.js        # Quét kiểm tra import JSX toàn dự án
├── AI_HANDOVER.md               # [TÀI LIỆU NÀY] Bàn giao thông tin chi tiết cho AI
```

---

## 6. DANH SÁCH VIỆC TIẾP THEO & LƯU Ý KHI TIẾP QUẢN

1. **Về Google AdSense ID:**
   - Hiện tại ID `ca-pub-6469608148906900` trong `public/ads.txt` là thông tin chính xác.
   - Chưa thay thế bất kỳ ID thật nào khác cho đến khi người dùng thông báo AdSense đã duyệt.
2. **Khi người dùng yêu cầu chỉnh sửa UI hoặc Logic mới:**
   - Đọc kỹ yêu cầu, định vị chính xác component.
   - Giữ nguyên phong cách thẩm mỹ: Tông màu sang trọng (Editorial Serif, HSL Tailwind palette, Dark mode tinh tế, không làm vỡ bố cục).
   - Kiểm tra lại bằng cách chạy các bộ test trong `scripts/` sau mỗi lần chỉnh sửa lớn.
3. **Luôn cập nhật `AI_HANDOVER.md`:**
   - Bổ sung nội dung vào mục "Lịch sử các giai đoạn" và cập nhật "Trạng thái hệ thống" sau khi hoàn thành phiên làm việc của bạn.
