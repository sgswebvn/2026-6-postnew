# POST NEW — FORENSIC DATABASE & PERSISTENCE VERIFICATION REPORT

**Đơn vị thẩm định:** Senior Software Architect + Database Engineer + Security Auditor  
**Phạm vi thẩm định:** Toàn bộ kiến trúc dữ liệu, cơ chế đồng bộ, rủi ro Race Condition, bảo mật API và tính toàn vẹn khi mất kết nối.  
**Nguyên tắc cốt lõi:** KHÔNG giả định an toàn chỉ từ sự tồn tại của code path. Đánh giá dựa trên phân tích lỗi thực tế (Failure Modes) và tính bất đối xứng giữa các tầng lưu trữ.

---

## A. KIẾN TRÚC LƯU TRỮ THỰC TẾ (ACTUAL ARCHITECTURE)

```
                            [ USER / ADMIN CMS ]
                                     |
                                     v
                        +--------------------------+
                        |   REACT 19 FRONTEND      |
                        +--------------------------+
                         /           |            \
                        /            |             \
      (1. Transient    /             |              \ (3. Direct Cloud
         LocalStorage /              | (2. HTTP API  \    Object Sync)
            Cache)   /               |    Requests)   \
                    v                v                 v
        +------------------+   +-----------+   +-----------------------+
        |   LOCALSTORAGE   |   |  EXPRESS  |   |    SUPABASE STORAGE   |
        |  (Client Cache   |   |  BACKEND  |   |   (JSON Object CDN)   |
        |   & Session)     |   +-----------+   +-----------------------+
        +------------------+         |                     |
                                     v                     |
                         +-----------------------+         | (Manifest
                         |  MONGODB ATLAS NO-SQL | <-------+  Fallback)
                         |  (Primary Data Store) |
                         +-----------------------+
```

---

## B. BẢNG XÁC ĐỊNH SOURCE OF TRUTH (SOURCE OF TRUTH MATRIX)

| Thực Thể (Entity) | PRIMARY SOURCE OF TRUTH (Nguồn Chuẩn Chính) | SECONDARY STORAGE (Lưu Trữ Phụ) | CACHE LAYER (Tầng Bộ Nhớ Đệm) | BACKUP / MIRROR | Rủi Ro Lệch Dữ Liệu |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **Bài viết (Post)** | **MongoDB Atlas** (`posts` collection) | **Supabase Storage** (`posts/{slug}.json`) | LocalStorage (`horizon_posts_v2`) | `posts_manifest.json` | 🟠 Có thể lệch nếu MongoDB write fail nhưng Supabase write success |
| **Nhân sự & Profile (Staff)** | **MongoDB Atlas** (`staffs` collection) | **Supabase Storage** (`staff_manifest.json`) | LocalStorage (`horizon_staff_v2`) | `staff_manifest.json` | 🟠 Có thể lệch khi ghi đồng thời (Race condition) |
| **Chuyên mục (Category)** | **MongoDB Atlas** (`categories` collection) | **Supabase Storage** (`categories_manifest.json`) | LocalStorage (`horizon_categories_v2`) | `categories_manifest.json` | 🟡 Thấp |
| **Tác giả (Author)** | **MongoDB Atlas** (`authors` collection) | **Supabase Storage** (`authors_manifest.json`) | LocalStorage (`horizon_authors_v2`) | `authors_manifest.json` | 🟡 Thấp |
| **Cài đặt (Setting)** | **MongoDB Atlas** (`settings` collection) | **Supabase Storage** (`settings.json`) | LocalStorage (`horizon_settings_v2`) | `settings.json` | 🟡 Thấp |
| **Bình luận (Comment)** | **MongoDB Atlas** (`comments` collection) | Không có | LocalStorage (`horizon_comments_v2`) | Không có | 🔴 Mất bình luận nếu MongoDB down |
| **Độc giả (Subscriber)** | **MongoDB Atlas** (`subscribers` collection) | Không có | LocalStorage (`horizon_subscribers_v2`)| Không có | 🔴 Mất email nếu MongoDB down |
| **Nhật ký (ActivityLog)** | **MongoDB Atlas** (`activitylogs` collection)| Không có | LocalStorage (`horizon_activity_logs_v2`)| Không có | 🟡 Thấp |
| **Mã Seeding (Referral)** | **MongoDB Atlas** (`referrals` collection) | LocalStorage (`horizon_staff_referrals_v2`)| Không có | Không có | 🟡 Thấp |
| **Link rút gọn (ShortLink)** | **MongoDB Atlas** (`shortlinks` collection) | **Supabase Storage** (`shortlinks/{code}.json`) | Memory Store | `shortlinks/` JSON | 🟡 Thấp |

---

## C. MA TRẬN BỀN VỮNG DỮ LIỆU & THỨ TỰ GHI (PERSISTENCE & MUTATION ORDER)

### 1. Phân Tích Thứ Tự Ghi Dữ Liệu Khi Tạo/Sửa Bài Viết (`savePost`):
```text
Thứ tự thực tế:
Bước 1: api.createPost(post) ➔ Gửi HTTP POST tới Backend Express ➔ Mongoose Post.create() vào MongoDB Atlas
Bước 2: supabaseStorage.savePostMetadata(post) ➔ Gửi HTTP POST tới Supabase Storage posts/{slug}.json & posts_manifest.json
Bước 3: safeSetItem('horizon_posts_v2', compressed) ➔ Ghi vào LocalStorage máy client
```

#### Phân Tích Sự Cố (Failure Analysis):
- **Trường hợp 1 (MongoDB Thành công, Supabase Thất bại):**
  - Trạng thái DB: Bài viết đã được lưu an toàn trong MongoDB.
  - Trạng thái Supabase: `posts_manifest.json` chưa có bài viết mới.
  - Trạng thái Local: Trình duyệt của người tạo vẫn thấy bài viết vì LocalStorage đã ghi.
  - Trình duyệt khác / Bot SEO: Khi bot crawler truy cập `api/index.js`, crawler query MongoDB trước nên **vẫn thấy bài viết**. Tuy nhiên, nếu MongoDB cold start, Supabase fallback sẽ thiếu bài viết này ➔ **CONSISTENCY RISK**.
- **Trường hợp 2 (MongoDB Thất bại, Supabase Thành công):**
  - Trạng thái DB: MongoDB không có bài viết.
  - Trạng thái Supabase: File `posts/{slug}.json` và `posts_manifest.json` có bài viết.
  - Trạng thái Local: Trình duyệt của người tạo có bài viết.
  - Trình duyệt khác: Khi máy khác vào trang chủ, `initializeFromDB()` tải `posts_manifest.json` từ Supabase về nên vẫn thấy bài viết. Tuy nhiên, khi backend query MongoDB trực tiếp sẽ không tìm thấy ➔ **SPLIT-BRAIN RISK**.
- **Trường hợp 3 (Cả MongoDB và Supabase đều Thất bại do Mất Mạng):**
  - Trong `src/services/storageService.js:167` và `195`:
    ```javascript
    try { const saved = await api.createPost(newPost); } catch (err) { console.warn(...) }
    await supabaseStorage.savePostMetadata(newPost).catch(() => {});
    safeSetItem(STORAGE_KEYS.POSTS, JSON.stringify(updated));
    ```
  - **Hậu quả nghiêm trọng:** Code bắt ngoại lệ (`catch`) nhưng KHÔNG ném lỗi lên UI (`BlogContext`). Giao diện người dùng vẫn hiển thị toast thông báo: *"Đã xuất bản bài viết mới!"*.
  - Dữ liệu lúc này **CHỈ TỒN TẠI TRÊN TRÌNH DUYỆT MÁY ĐÓ (LOCAL ONLY)**. Người dùng tưởng đã lưu lên Cloud nhưng khi sang máy khác hoặc xóa cache thì bài viết biến mất hoàn toàn ➔ **🔴 POTENTIAL DATA DIVERGENCE**.

---

## D. MA TRẬN BẢO MẬT & LỘ DỮ LIỆU (SECURITY & CREDENTIAL MATRIX)

| Dữ Liệu Nhạy Cảm | MongoDB Atlas | Supabase Storage (Public Bucket) | LocalStorage / SessionStorage | Backend API Auth Enforcement | Mức Độ Rủi Ro (Severity) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Mật khẩu nhân sự (Staff Password)** | Có (Plaintext) | 🔴 **CÓ (Plaintext trong staff_manifest.json công khai)** | 🔴 **CÓ (Plaintext trong horizon_current_user)** | 🔴 **KHÔNG CÓ (API không check auth)** | **P0 — CRITICAL** |
| **Quyền Quản trị viên (Permissions)** | Có | Có (Public JSON) | Có (Client-editable) | 🔴 **KHÔNG CÓ (Backend không verify role)** | **P0 — CRITICAL** |
| **Số điện thoại & Email nhân sự** | Có | Có (Public JSON) | Có | Không bảo vệ | **P1 — HIGH** |
| **Bảng lương & Thu nhập (Salary)** | Có | Có (Public JSON) | Có | Không bảo vệ | **P1 — HIGH** |
| **Supabase Service Role Key** | N/A | Hardcoded trong frontend client `supabaseStorage.js` | N/A | N/A | **P0 — CRITICAL** |

### 🔍 Chi Tiết 2 Lỗ Hổng Bảo Mật Cốt Lõi:
1. **Lộ Mật Khẩu & Dữ Liệu Nhân Sự trên URL Công Khai:**
   - Tệp `staff_manifest.json` nằm tại:  
     `https://mmltqgekvpdnezqdavvc.supabase.co/storage/v1/object/public/postnew/staff_manifest.json`
   - Bất kỳ ai trên Internet mở URL này đều có thể đọc toàn bộ danh sách tài khoản, mật khẩu plaintext, bảng lương và email của toàn bộ tòa soạn.
2. **Hardcoded Supabase Service Role Key ở Client-Side:**
   - Trong `src/services/supabaseStorage.js:5`:
     ```javascript
     const SUPABASE_SERVICE_ROLE = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
     ```
   - Service Role Key là khóa tối cao của Supabase (Bypass toàn bộ Row Level Security). Khóa này đang được đóng gói trong file JavaScript của trình duyệt khách. Bất kỳ ai mở DevTools cũng có thể lấy khóa này và xóa sạch toàn bộ bucket `postnew`.

---

## E. MA TRẬN GHI ĐỒNG THỜI & RACE CONDITIONS (CONCURRENCY AUDIT)

| Thao tác | Cơ chế ghi dữ liệu | Nguy cơ Race Condition | Hậu quả thực tế |
| :--- | :--- | :---: | :--- |
| **Sửa Hồ sơ nhân viên A & B cùng lúc** | Tải `staff_manifest.json` ➔ Hợp nhất trên RAM trình duyệt ➔ Upload đè toàn bộ file | 🔴 **RẤT CAO** | Nếu Admin sửa Nhân viên 1 và Kế toán sửa Lương Nhân viên 2 cùng một thời điểm: Bản ghi của người bấm Lưu sau sẽ ghi đè lên bản ghi của người bấm trước nếu cả hai cùng đọc từ phiên bản gốc cũ (Lost Update Anomaly). |
| **Đăng bài viết mới đồng thời** | Upload file đơn lẻ `posts/{slug}.json` + Cập nhật `posts_manifest.json` | 🟠 **TRUNG BÌNH** | File nội dung chi tiết bài viết an toàn (vì tên file là slug riêng biệt), nhưng danh sách bài viết trên `posts_manifest.json` có thể bị mất bài nếu 2 phóng viên cùng bấm Đăng tại cùng 1 giây. |
| **Tạo Chuyên mục / Tác giả** | Upload đè toàn bộ `categories_manifest.json` | 🟡 **THẤP** | Tần suất tạo chuyên mục thấp, ít xảy ra đồng thời. |

---

## F. TRẢ LỜI 10 CÂU HỎI PHÁP Y TRỌNG TÂM

### 1. Database Source of Truth thực sự là gì?
- **Trả lời:** **MongoDB Atlas** là Database Primary Source of Truth chính thống. Tuy nhiên, hệ thống đang vận hành theo mô hình **Hybrid Dual-Store**, trong đó **Supabase Storage** đóng vai trò Secondary Static JSON Mirror.

### 2. Có chức năng nào có thể hoạt động mà KHÔNG ghi Database không?
- **Trả lời:** **CÓ.** Nếu mạng bị lỗi hoặc MongoDB timeout, các hàm `savePost`, `saveStaff`, `saveCategories` đều bọc `catch` và tiếp tục lưu vào `localStorage`. UI vẫn báo "Thành công", tạo cảm giác bài đã lưu nhưng thực chất chưa vào Database.

### 3. Có chức năng nào LocalStorage có thể trở thành Source of Truth không?
- **Trả lời:** **CÓ.** Trong kịch bản Mất Mạng (Offline) hoặc Backend sập: Dữ liệu bài viết mới chỉ nằm duy nhất trong `localStorage` của trình duyệt người tạo cho đến khi được sync thủ công. Ngoài ra, tính năng **Bookmarks (Độc giả lưu bài)** 100% chỉ nằm trên `localStorage`.

### 4. Có trường hợp MongoDB và Supabase bị lệch nhau không?
- **Trả lời:** **CÓ.** Do hệ thống không sử dụng Distributed Transaction (2-Phase Commit), nếu một trong hai bên gặp lỗi mạng (ví dụ MongoDB ghi thành công nhưng Supabase bị lỗi 500 hoặc ngược lại), trạng thái giữa MongoDB và Supabase sẽ bị lệch (Diverged State).

### 5. Có Race Condition khi nhiều user cùng update không?
- **Trả lời:** **CÓ.** Pattern `Download Manifest ➔ Merge in Memory ➔ Upload Entire Manifest` trên Supabase Storage không có cờ khóa (Locking) hay ETag/Optimistic Concurrency Control, dẫn đến việc ghi đè làm mất thay đổi của nhau.

### 6. Có credential/password/token nào xuất hiện ở client/public storage không?
- **Trả lời:** **CÓ VÀ RẤT NGHIÊM TRỌNG.** 
  1. `staff_manifest.json` trên Supabase Public Bucket chứa mật khẩu Plaintext của tất cả nhân viên.
  2. `SUPABASE_SERVICE_ROLE` Key bị lộ trực tiếp trong mã nguồn frontend `src/services/supabaseStorage.js`.

### 7. Backend có thực sự enforce Authentication + Authorization không?
- **Trả lời:** **HOÀN TOÀN KHÔNG.** Toàn bộ các API route `POST/PUT/DELETE /api/posts`, `/api/staff`, `/api/settings` trong `server/routes/api.js` đều không có Middleware kiểm tra Token, Cookie hay Header xác thực. Bất kỳ ai gửi request HTTP từ bên ngoài đều có thể thao tác với Database.

### 8. Nếu xóa toàn bộ LocalStorage, hệ thống có khôi phục đầy đủ dữ liệu không?
- **Trả lời:** **CÓ THỂ (Với điều kiện dữ liệu đã từng được ghi thành công lên MongoDB hoặc Supabase).** Khi xóa sạch LocalStorage và F5, hàm `initializeFromDB()` sẽ tự động tải lại toàn bộ bài viết, chuyên mục, tác giả từ Supabase và MongoDB về máy.

### 9. Nếu Supabase chết, hệ thống có tiếp tục hoạt động bằng MongoDB không?
- **Trả lời:** **CÓ.** Backend Express tại `server/routes/api.js` ưu tiên query trực tiếp từ MongoDB (`if (isMongooseReady())`). Nếu Supabase chết, các API backend vẫn đọc và ghi được vào MongoDB Atlas.

### 10. Nếu MongoDB chết, hệ thống có vô tình coi LocalStorage/Supabase là Database chính không?
- **Trả lời:** **CÓ.** Khi MongoDB chết (`isInMemoryFallback === true`), backend chuyển sang đọc từ Supabase Manifest và `memoryStore`. Frontend đọc từ Supabase Storage CDN và `localStorage`. Hệ thống tiếp tục chạy ở chế độ "giả lập không Database".

---

## G. KẾT LUẬN KIỂM TOÁN PHÁP Y (FINAL VERDICT)

```text
FINAL VERDICT:
🔴 NOT PRODUCTION READY (CẦN KHẮC PHỤC CÁC LỖ HỔNG BẢO MẬT P0 TRƯỚC KHI VẬN HÀNH CHÍNH THỨC)
```

### Bằng chứng xác thực:
1. **Lỗ hổng P0:** Mật khẩu nhân viên đang bị phơi bày công khai trên Internet qua URL `staff_manifest.json` của Supabase.
2. **Lỗ hổng P0:** Khóa quản trị tối cao `SUPABASE_SERVICE_ROLE` đang nằm ở client-side.
3. **Lỗ hổng P0:** Backend API hoàn toàn không có lớp bảo vệ xác thực (Zero Backend Auth Enforcement).
4. **Rủi ro P1:** Cơ chế bắt lỗi âm thầm (`Silent Catch`) khiến người dùng tưởng đã lưu bài lên Database khi mất mạng nhưng thực chất chỉ lưu trên máy cục bộ.
