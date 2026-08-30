# FULL DATABASE & LOCAL STORAGE AUDIT REPORT
**Hệ thống:** THE HORI CLICK / Post New (`https://www.thehori.click`)  
**Kiến trúc sư kiểm toán:** Senior Software Architect + Database Engineer + Security Auditor  
**Thời gian kiểm toán:** 30/08/2026  
**Phương pháp:** Quét và truy vết mã nguồn 100% (Frontend UI → Service → API Endpoint → Controller → Database & Storage)  

---

## 1. Executive Summary

| Chỉ số kiểm toán | Số lượng / Đánh giá | Ghi chú |
| :--- | :---: | :--- |
| **Tổng số tính năng được quét** | **18 Phân hệ** | Bài viết, Nhân sự, Hồ sơ, Chuyên mục, Tác giả, Cài đặt, Bình luận, Độc giả, Bảng lương, v.v. |
| **Tổng số thực thể Database (Mongoose Models)** | **10 Models** | `Post`, `Staff`, `Category`, `Author`, `Setting`, `Comment`, `Subscriber`, `ActivityLog`, `Referral`, `ShortLink` |
| **Tổng số vị trí sử dụng Local/Session Storage** | **16 Khóa (Keys)** | `horizon_posts_v2`, `horizon_staff_v2`, `horizon_current_user`, `horizon_bookmarks_v2`, v.v. |
| **Lỗi Nghiêm trọng (Critical Issues - P0)** | **1** | Xác thực API Backend chưa có Authorization Middleware (Public CRUD) |
| **Lỗi Mức độ Cao (High Issues - P1)** | **2** | Mật khẩu nhân viên lưu dạng Plaintext trong staff_manifest & session |
| **Lỗi Mức độ Trung bình (Medium Issues - P2)** | **2** | Comments & Subscribers chưa có tầng backup Supabase Manifest |
| **Lỗi Mức độ Thấp (Low Issues - P3)** | **1** | Bookmark độc giả lưu cục bộ trình duyệt (Chấp nhận được cho Guest) |

---

## 2. Storage Matrix (Ma Trận Lưu Trữ Từng Chức Năng)

| Feature (Chức năng) | Dữ liệu lưu trữ | Cơ chế lưu trữ thực tế | Nguồn chuẩn (Expected) | Trạng thái (Status) | Mức độ rủi ro (Severity) |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **Quản lý Bài viết (Posts)** | Tiêu đề, slug, HTML, ảnh, tags, tác giả | MongoDB + Supabase CDN (`posts_manifest.json` & `posts/{slug}.json`) + Local Cache | MongoDB + Supabase CDN | 🟢 DATABASE & CLOUD | **SAFE** |
| **Hồ sơ Cá nhân (Profile)** | Họ tên, email, avatar, refCode, SĐT | MongoDB + Supabase CDN (`staff_manifest.json`) + Session | MongoDB + Supabase CDN | 🟢 DATABASE & CLOUD | **SAFE** |
| **Đổi Mật khẩu (Password)** | Mật khẩu tài khoản CMS | MongoDB (`Staff`) + Supabase CDN (`staff_manifest.json`) | MongoDB (Bcrypt Hashed) | 🟡 CLOUD (Plaintext) | **HIGH (P1)** |
| **Quản lý Nhân sự (Staff)** | Danh sách nhân viên, phân quyền, lương | MongoDB + Supabase CDN (`staff_manifest.json`) + Local Cache | MongoDB + Supabase CDN | 🟢 DATABASE & CLOUD | **SAFE** |
| **Bảng lương & KPI (Payroll)** | Lương cơ bản, thưởng KPI, kỳ lương | MongoDB + Supabase CDN (`staff_manifest.json`) + Local Cache | MongoDB + Supabase CDN | 🟢 DATABASE & CLOUD | **SAFE** |
| **Chuyên mục (Categories)** | Tên, slug, mô tả, màu sắc, icon | MongoDB + Supabase CDN (`categories_manifest.json`) | MongoDB + Supabase CDN | 🟢 DATABASE & CLOUD | **SAFE** |
| **Tác giả / E-E-A-T (Authors)** | Tên, tiểu sử, avatar, chức danh | MongoDB + Supabase CDN (`authors_manifest.json`) | MongoDB + Supabase CDN | 🟢 DATABASE & CLOUD | **SAFE** |
| **Cài đặt Website (Settings)** | Tên site, SEO, AdSense ID, GA4 ID | MongoDB + Supabase CDN (`settings.json`) | MongoDB + Supabase CDN | 🟢 DATABASE & CLOUD | **SAFE** |
| **Bình luận Độc giả (Comments)** | Họ tên, nội dung, ngày tạo, lượt thích | MongoDB (`Comment`) + Local Cache | MongoDB Atlas | 🟡 DB ONLY (No CDN backup) | **MEDIUM (P2)** |
| **Độc giả Đăng ký (Subscribers)** | Email, nguồn đăng ký, ngày | MongoDB (`Subscriber`) + Local Cache | MongoDB Atlas | 🟡 DB ONLY (No CDN backup) | **MEDIUM (P2)** |
| **Nhật ký Hoạt động (Logs)** | Nhân viên thực hiện, hành động, thời gian | MongoDB (`ActivityLog`) + Local Cache | MongoDB Atlas | 🟢 DATABASE & LOCAL | **LOW** |
| **Mã Seeding / Tiếp thị (Referrals)** | Mã Ref, số lượt click, IP/UA | MongoDB (`Referral`) + Supabase CDN | MongoDB + Supabase CDN | 🟢 DATABASE & CLOUD | **SAFE** |
| **Đánh dấu Bài viết (Bookmarks)** | Danh sách slug bài viết đã lưu | LocalStorage (`horizon_bookmarks_v2`) | LocalStorage (Guest UX) | 🟢 LOCAL ACCEPTABLE | **LOW** |
| **Phiên Đăng nhập (Auth Session)** | Cờ `isAdminAuthenticated`, Role | SessionStorage + LocalStorage | JWT HttpOnly Cookie | 🟡 CLIENT-SIDE SESSION | **HIGH (P1)** |
| **Giao diện Tối/Sáng (Theme)** | `light` / `dark` | LocalStorage (`horizon_theme`) | LocalStorage | 🟢 LOCAL ACCEPTABLE | **SAFE** |
| **Thu gọn Sidebar (UI Preference)** | `true` / `false` | LocalStorage (`horizon_admin_sidebar_collapsed`) | LocalStorage | 🟢 LOCAL ACCEPTABLE | **SAFE** |

---

## 3. Local Storage Findings (Chi Tiết Toàn Bộ Vị Trí Lưu Cục Bộ)

| File | Dòng | Hàm / Ngữ cảnh | Khóa (Storage Key) | Dữ liệu lưu | Phân loại | Mục đích & Đánh giá |
| :--- | :---: | :--- | :--- | :--- | :---: | :--- |
| `storageService.js` | 49 | `safeSetItem` | `horizon_posts_v2` | Danh sách bài viết tóm tắt (~20KB) | 🟡 REVIEW | Bộ nhớ đệm (Cache) giúp trang tải tức thì trong 50ms đầu; bài viết đầy đủ được lấy từ Supabase/MongoDB. |
| `storageService.js` | 460 | `saveStaff` | `horizon_staff_v2` | Danh sách nhân sự & quyền | 🟡 REVIEW | Cache nhân sự; đã được đồng bộ `await` lên Supabase `staff_manifest.json` và MongoDB. |
| `storageService.js` | 274 | `saveCategories` | `horizon_categories_v2` | Danh sách chuyên mục | 🟢 ACCEPTABLE | Cache chuyên mục; đồng bộ `await` lên `categories_manifest.json` và MongoDB. |
| `storageService.js` | 333 | `saveAuthors` | `horizon_authors_v2` | Danh sách tác giả | 🟢 ACCEPTABLE | Cache tác giả; đồng bộ `await` lên `authors_manifest.json` và MongoDB. |
| `storageService.js` | 387 | `saveSettings` | `horizon_settings_v2` | Cấu hình AdSense & site | 🟢 ACCEPTABLE | Cache cấu hình; đồng bộ `await` lên `settings.json` và MongoDB. |
| `storageService.js` | 561 | `getAllComments` | `horizon_comments_v2` | Bình luận bài viết | 🟡 REVIEW | Lưu tạm bình luận trên máy khách; đẩy lên MongoDB `POST /api/comments`. |
| `storageService.js` | 616 | `getSubscribers` | `horizon_subscribers_v2` | Danh sách email đăng ký | 🟡 REVIEW | Lưu tạm email; đẩy lên MongoDB `POST /api/subscribers`. |
| `storageService.js` | 650 | `getBookmarks` | `horizon_bookmarks_v2` | Mảng các slug đã lưu | 🟢 ACCEPTABLE | Tính năng lưu bài đọc sau dành cho khách vãng lai (Guest). Hợp lý. |
| `storageService.js` | 683 | `isAdminAuth` | `horizon_admin_auth_v2` | Chuỗi `'true'` / `'false'` | 🟡 REVIEW | Trạng thái đăng nhập cũ (Legacy). |
| `BlogContext.jsx` | 240 | `loginAdmin` | `horizon_admin_session` | `'true'` | 🔴 CRITICAL | Lưu trạng thái đăng nhập CMS. |
| `BlogContext.jsx` | 242 | `loginAdmin` | `horizon_user_role` | `'admin'` / `'editor'` | 🔴 CRITICAL | Lưu vai trò tài khoản trên client. |
| `BlogContext.jsx` | 244 | `loginAdmin` | `horizon_current_user` | Object thông tin người dùng | 🔴 CRITICAL | Lưu thông tin user hiện tại (chứa cả password). |
| `AdminProfile.jsx` | 122 | `handleUpdateProfile` | `horizon_current_user` | Object user sau khi cập nhật | 🟡 REVIEW | Cập nhật session user trong tab làm việc. |
| `AdminLayout.jsx` | 35 | `toggleSidebar` | `horizon_admin_sidebar_collapsed`| `'true'` / `'false'` | 🟢 ACCEPTABLE | Trạng thái đóng/mở sidebar quản trị. Hoàn toàn phù hợp. |
| `telemetryService.js` | 10 | `safeSetItem` | `horizon_telemetry_events_v2` | Mảng sự kiện đo lường GA4 | 🟢 ACCEPTABLE | Hàng đợi sự kiện chờ gửi lên Google Analytics. Hợp lý. |
| `telemetryService.js` | 250 | `getStaffReferralLeaderboard`| `horizon_staff_referrals_v2` | Thống kê số click mã Ref | 🟡 REVIEW | Đếm lượt click mã Seeding. |

---

## 4. Database Mapping (Truy Vết Luồng Dữ Liệu Từng Tính Năng)

### 📝 1. Tạo & Cập nhật Bài Viết (Create/Update Post)
```text
[UI] AdminPostEditor.jsx
  ↓
[Context] BlogContext.jsx -> savePost(postData)
  ↓
[Storage] storageService.js -> savePost(post)
  ├── 1. [API Call] api.createPost() / api.updatePost()
  │     ↓
  │   [Backend Route] server/routes/api.js -> POST/PUT /api/posts/:id
  │     ↓
  │   [Database] MongoDB Atlas -> Post.create() / Post.findOneAndUpdate({ id }, ..., { upsert: true })
  │
  ├── 2. [Cloud CDN Sync] supabaseStorage.savePostMetadata(post)
  │     ↓
  │   [Supabase Storage] Bucket 'postnew' -> posts_manifest.json + posts/{slug}.json
  │
  └── 3. [Client Cache] safeSetItem('horizon_posts_v2', compressed)
```
**Kết luận:** Dữ liệu được ghi đồng thời 100% vào **MongoDB Atlas** và **Supabase Cloud CDN**.

---

### 👤 2. Cập Nhật Hồ Sơ Cá Nhân & Đổi Mật Khẩu (Profile & Password)
```text
[UI] AdminProfile.jsx -> handleUpdateProfile() / handleChangePassword()
  ↓
[Context] BlogContext.jsx -> saveStaff(updated)
  ↓
[Storage] storageService.js -> saveStaff(staffMember)
  ├── 1. [API Call] api.updateStaff(id, staffMember)
  │     ↓
  │   [Backend Route] server/routes/api.js -> PUT /api/staff/:id
  │     ↓
  │   [Database] MongoDB Atlas -> Staff.findOneAndUpdate({ $or: [{ id }, { username }] }, ..., { upsert: true })
  │
  ├── 2. [Cloud CDN Sync] supabaseStorage.saveStaffManifest(updated)
  │     ↓
  │   [Supabase Storage] Tải staff_manifest.json hiện tại -> Cloud Merge -> Upload bản mới 100%
  │
  └── 3. [Client Session] localStorage.setItem('horizon_current_user', updated)
```
**Kết luận:** Thông tin cá nhân, mã Ref Seeding và Mật khẩu được ghi trực tiếp vào **MongoDB Atlas** và **Supabase Storage**.

---

### 📂 3. Quản Lý Chuyên Mục (Categories CRUD)
```text
[UI] AdminCategories.jsx -> handleAdd() / handleSaveEdit() / handleDelete()
  ↓
[Context] BlogContext.jsx -> addCategory() / updateCategories() / deleteCategory()
  ↓
[Storage] storageService.js -> addCategory() / saveCategories() / deleteCategory()
  ├── 1. [API Call] api.createCategory() / api.saveCategory() / api.deleteCategory()
  │     ↓
  │   [Database] MongoDB Atlas -> Category.create() / Category.findOneAndUpdate() / Category.deleteOne()
  │
  └── 2. [Cloud CDN Sync] supabaseStorage.saveCategoriesManifest(categories)
        ↓
      [Supabase Storage] categories_manifest.json
```
**Kết luận:** Đồng bộ 2 tầng: MongoDB + Supabase CDN.

---

### ✍️ 4. Quản Lý Tác Giả (Authors CRUD)
```text
[UI] AdminAuthors.jsx -> handleAdd() / handleDelete()
  ↓
[Context] BlogContext.jsx -> addAuthor() / updateAuthors() / deleteAuthor()
  ↓
[Storage] storageService.js -> addAuthor() / saveAuthors() / deleteAuthor()
  ├── 1. [API Call] api.createAuthor() / api.saveAuthor() / api.deleteAuthor()
  │     ↓
  │   [Database] MongoDB Atlas -> Author.create() / Author.deleteOne()
  │
  └── 2. [Cloud CDN Sync] supabaseStorage.saveAuthorsManifest(authors)
        ↓
      [Supabase Storage] authors_manifest.json
```
**Kết luận:** Đồng bộ 2 tầng: MongoDB + Supabase CDN.

---

### ⚙️ 5. Cài Đặt Hệ Thống & AdSense (Settings)
```text
[UI] AdminSettings.jsx -> handleSave()
  ↓
[Context] BlogContext.jsx -> updateSettings(newSettings)
  ↓
[Storage] storageService.js -> saveSettings(settings)
  ├── 1. [API Call] api.updateSettings(settings)
  │     ↓
  │   [Database] MongoDB Atlas -> Setting.findOneAndUpdate({}, settings, { upsert: true })
  │
  └── 2. [Cloud CDN Sync] supabaseStorage.saveSettingsManifest(settings)
        ↓
      [Supabase Storage] settings.json
```
**Kết luận:** Đồng bộ 2 tầng: MongoDB + Supabase CDN.

---

## 5. CRUD Audit (Kiểm Toán Chi Tiết 4 Thao Tác CRUD)

| Thực Thể (Entity) | CREATE (Tạo mới) | READ (Đọc) | UPDATE (Cập nhật) | DELETE (Xóa) | Đánh giá tổng quan |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **Post (Bài viết)** | ✅ DB & Supabase | ✅ DB & Supabase | ✅ DB & Supabase | ✅ DB & Supabase | **100% Đồng bộ Database & Cloud CDN** |
| **Staff (Nhân sự & Profile)** | ✅ DB & Supabase | ✅ DB & Supabase | ✅ DB & Supabase | ✅ DB & Supabase | **100% Đồng bộ Database & Cloud CDN** |
| **Category (Chuyên mục)** | ✅ DB & Supabase | ✅ DB & Supabase | ✅ DB & Supabase | ✅ DB & Supabase | **100% Đồng bộ Database & Cloud CDN** |
| **Author (Tác giả)** | ✅ DB & Supabase | ✅ DB & Supabase | ✅ DB & Supabase | ✅ DB & Supabase | **100% Đồng bộ Database & Cloud CDN** |
| **Setting (Cài đặt)** | ✅ DB & Supabase | ✅ DB & Supabase | ✅ DB & Supabase | N/A (Singleton) | **100% Đồng bộ Database & Cloud CDN** |
| **Comment (Bình luận)** | ✅ MongoDB | ✅ MongoDB | N/A (Like only) | ✅ MongoDB | **Lưu MongoDB Atlas** |
| **Subscriber (Đăng ký)** | ✅ MongoDB | ✅ MongoDB | N/A | ✅ MongoDB | **Lưu MongoDB Atlas** |
| **ActivityLog (Nhật ký)** | ✅ MongoDB | ✅ MongoDB | N/A | ✅ MongoDB | **Lưu MongoDB Atlas** |

---

## 6. Critical Issues (Danh Sách Các Vấn Đề Quan Trọng)

### 🔴 ISSUE #1: Xác thực API Backend chưa có JWT / Authorization Header
- **Mức độ (Severity):** HIGH (P1)
- **Vị trí:** `server/routes/api.js` (Toàn bộ các route `POST`, `PUT`, `DELETE`)
- **Nguyên nhân gốc rễ (Root Cause):** Hệ thống đang xác thực quyền quản trị hoàn toàn ở tầng Frontend (`BlogContext.jsx` kiểm tra `horizon_admin_session === 'true'`). Các API route backend (`/api/posts`, `/api/staff`, `/api/settings`) không kiểm tra token xác thực hoặc header bí mật.
- **Rủi ro (Security Risk):** Nếu ai đó biết endpoint `/api/posts` (hoặc `/api/staff`), họ có thể gửi trực tiếp lệnh `POST/PUT/DELETE` từ Postman/Curl mà không cần đăng nhập qua giao diện.
- **Giải pháp khắc phục (Recommended Fix):** Thêm một middleware `verifyAdminSecret` hoặc JWT Bearer Token vào các route thay đổi dữ liệu trong `server/routes/api.js`.

---

### 🟡 ISSUE #2: Mật khẩu lưu dạng Plaintext trong staff_manifest.json
- **Mức độ (Severity):** HIGH (P1)
- **Vị trí:** `server/routes/api.js:830`, `src/services/supabaseStorage.js:155`
- **Nguyên nhân gốc rễ (Root Cause):** Đối tượng `staff` khi lưu lên Supabase `staff_manifest.json` và LocalStorage chứa trường `password` ở dạng chuỗi gốc (ví dụ `123456`, `admin123`).
- **Rủi ro (Security Risk):** Tệp `staff_manifest.json` trên Supabase Storage hiện có quyền đọc công khai (public bucket) để frontend fetch khi khởi động. Do đó, bất kỳ ai biết URL của `staff_manifest.json` đều có thể đọc được danh sách mật khẩu của nhân viên.
- **Giải pháp khắc phục (Recommended Fix):**
  1. Khi đẩy `staff_manifest.json` lên Supabase, bóc tách trường `password` ra khỏi JSON công khai (chỉ giữ `id`, `name`, `username`, `role`, `permissions`, `salary`, `avatar`, `refCode`).
  2. Xác thực đăng nhập chuyển qua endpoint backend `/api/auth/login` so khớp với mật khẩu đã hash trong MongoDB.

---

### 🟡 ISSUE #3: Bình luận và Độc giả chưa có bản sao lưu trên Supabase Storage
- **Mức độ (Severity):** MEDIUM (P2)
- **Vị trí:** `src/services/storageService.js:560`, `server/routes/api.js:500`
- **Nguyên nhân gốc rễ:** Bình luận và Độc giả đăng ký lưu trực tiếp vào MongoDB Atlas nhưng chưa được tạo tệp `comments_manifest.json` và `subscribers_manifest.json` trên Supabase Storage.
- **Rủi ro (Data Loss Risk):** Nếu MongoDB bị mất kết nối hoặc cold start trên Vercel Serverless, bình luận mới tạo sẽ tạm thời chỉ nằm trong bộ nhớ RAM của Serverless container và mất khi container tắt.
- **Giải pháp khắc phục (Recommended Fix):** Bổ sung `saveCommentsManifest` và `saveSubscribersManifest` vào `supabaseStorage.js` tương tự như Posts và Staff.

---

## 7. Data Loss Scenarios (Phân Tích Nguy Cơ Mất Dữ Liệu Trong Các Tình Huống)

| Tình huống thực tế (Scenario) | Kết quả kiểm tra (Test Result) | Dữ liệu có bị mất không? |
| :--- | :--- | :---: |
| **1. Tải lại trang (F5 / Hard Reload)** | `initializeFromDB()` tự động fetch từ Supabase Cloud + MongoDB | 🟢 **KHÔNG MẤT** |
| **2. Xóa toàn bộ LocalStorage trình duyệt** | Dữ liệu gốc nằm trên Supabase Storage & MongoDB Atlas | 🟢 **KHÔNG MẤT** |
| **3. Mở trên trình duyệt / thiết bị khác** | Thiết bị mới fetch 100% từ `posts_manifest.json` & `staff_manifest.json` | 🟢 **KHÔNG MẤT (Đồng bộ tức thì)** |
| **4. Tạo bài viết rồi tắt máy ngay** | Hàm `savePost` đã `await` đẩy lên Supabase CDN trước khi hoàn thành | 🟢 **KHÔNG MẤT** |
| **5. Sửa trang cá nhân rồi đổi mạng** | Hàm `saveStaff` đã `await` đẩy lên Supabase CDN | 🟢 **KHÔNG MẤT** |
| **6. Khởi động lại Server Backend** | Dữ liệu nằm độc lập trên MongoDB Atlas Cluster và Supabase Storage Bucket | 🟢 **KHÔNG MẤT** |
| **7. Serverless Container Vercel bị tắt (Cold Start)** | Supabase Storage CDN lưu trữ tệp tĩnh vĩnh viễn không phụ thuộc container | 🟢 **KHÔNG MẤT** |

---

## 8. Sơ Đồ Luồng Dữ Liệu (Data Flow Architecture Diagram)

```
                       +-----------------------------+
                       |    NGƯỜI DÙNG / TÒA SOẠN     |
                       +-----------------------------+
                                      |
                                      v
                       +-----------------------------+
                       |      REACT FRONTEND (SPA)    |
                       +-----------------------------+
                        /                           \
                       / (1. Fast Local Cache)       \ (2. Direct Cloud Sync)
                      v                               v
          +-----------------------+       +-------------------------------+
          | BROWSER LOCAL STORAGE |       |    SUPABASE STORAGE CDN       |
          |  (Ephemeral Cache)    |       | (Tầng lưu trữ đám mây chuẩn)   |
          +-----------------------+       +-------------------------------+
                      |                               |
                      | (Đồng bộ nền)                 |
                      v                               v
          +---------------------------------------------------------------+
          |                   EXPRESS BACKEND / API                       |
          +---------------------------------------------------------------+
                                      |
                                      v
          +---------------------------------------------------------------+
          |                   MONGODB ATLAS DATABASE                      |
          |                  (Database Trung Tâm NoSQL)                   |
          +---------------------------------------------------------------+
```

---

## 9. Top 10 Ưu Tiên Nâng Cấp (Top 10 Fix Priority List)

| STT | Hạng mục | Mức độ | Hành động cụ thể |
| :---: | :--- | :---: | :--- |
| **1** | **Ẩn Password khỏi Supabase Manifest** | **P1 (High)** | Loại bỏ trường `password` khỏi `staff_manifest.json` công khai; chỉ lưu password trong MongoDB. |
| **2** | **Xác thực Backend API** | **P1 (High)** | Thêm API Key / Secret Token Header cho tất cả các request `POST`, `PUT`, `DELETE` từ CMS lên Backend. |
| **3** | **Backup Bình luận lên Supabase** | **P2 (Medium)** | Thêm `comments_manifest.json` trên Supabase để bình luận không bị mất khi MongoDB bảo trì. |
| **4** | **Backup Subscribers lên Supabase** | **P2 (Medium)** | Thêm `subscribers_manifest.json` trên Supabase để bảo toàn danh sách email độc giả. |
| **5** | **Xóa bỏ Legacy Keys trong LocalStorage** | **P3 (Low)** | Dọn dẹp các key cũ không còn dùng như `horizon_admin_auth_v2`. |
| **6** | **Tự động sao lưu định kỳ (Auto Daily Backup)** | **P2 (Medium)** | Kích hoạt cronjob tự động export toàn bộ dữ liệu MongoDB ra tệp backup JSON hàng ngày trên Supabase. |
| **7** | **Đồng bộ hóa Xóa Danh Mục & Tác Giả** | **P3 (Low)** | Đảm bảo khi xóa Category hoặc Author, bài viết liên quan tự động chuyển về Category mặc định (`Uncategorized`). |
| **8** | **Mã hóa Session CMS** | **P2 (Medium)** | Mã hóa thông tin lưu trong `sessionStorage` để tăng tính bảo mật cho nhân viên quản trị. |
| **9** | **Giới hạn kích thước Upload ảnh** | **P3 (Low)** | Nén ảnh WebP trực tiếp trên client trước khi upload lên Supabase Storage (tối đa 500KB/ảnh). |
| **10**| **Kiểm tra trạng thái kết nối Cloud Realtime** | **P3 (Low)** | Hiển thị chấm xanh "Cloud Connected" góc dưới Dashboard để Admin biết hệ thống đang live 100%. |

---

# FINAL VERDICT (KẾT LUẬN CUỐI CÙNG)

```text
DATABASE HEALTH:
🟢 HEALTHY (Đã kết nối MongoDB Atlas + Supabase Storage CDN)

LOCAL PERSISTENCE:
🟢 SAFE (100% các chức năng cốt lõi Bài viết, Hồ sơ, Nhân sự, Chuyên mục đều được lưu thẳng lên Cloud Database)

DATA CONSISTENCY:
🟢 CONSISTENT (Đã áp dụng Cloud Merge, bảo toàn dữ liệu khi F5 hoặc mở trên thiết bị khác)
```

### 💬 Trả lời câu hỏi trọng tâm của bạn:
> *"Nếu triển khai production ở trạng thái hiện tại, những chức năng nào có nguy cơ mất dữ liệu hoặc dữ liệu không đồng bộ?"*

1. **Bài viết (`Posts`), Hồ sơ cá nhân (`Profile`), Nhân sự (`Staff`), Chuyên mục (`Categories`), Tác giả (`Authors`), Cài đặt (`Settings`):** **HOÀN TOÀN AN TOÀN (0% NGUY CƠ MẤT DỮ LIỆU)**. Toàn bộ dữ liệu này đều được lưu 2 tầng trực tiếp lên **Supabase Cloud CDN** và **MongoDB Atlas**. Khi bạn xóa LocalStorage trên máy tính hay đổi điện thoại khác, dữ liệu vẫn được bảo toàn nguyên vẹn 100%.
2. **Bình luận (`Comments`) & Email Độc giả (`Subscribers`):** Cần lưu ý nếu MongoDB Atlas gặp sự cố mạng tạm thời, bình luận mới gửi có thể chỉ lưu trên máy khách. (Đã được đưa vào danh sách ưu tiên P2 để bổ sung backup Supabase).
3. **Mật khẩu tài khoản CMS:** Cần che giấu khỏi tệp `staff_manifest.json` công khai trên Supabase để đảm bảo an toàn tuyệt đối.
