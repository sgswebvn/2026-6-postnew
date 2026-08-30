# RUNTIME DATABASE TEST RESULTS — POST NEW

**Môi trường kiểm thử:** Live Production / Staging Run (`https://www.thehori.click`)  
**Thời gian thực thi:** 30/08/2026 15:51:57 UTC+7  
**Thực thể kiểm thử (Test Entity):** `DB_CHAOS_TEST_1788079917467` (`db-chaos-test-1788079917467`)  
**Phương pháp:** Runtime Chaos Injection, Direct MongoDB Driver Queries, CDN Response Analysis & Race Condition Simulation.

---

## 1. BẢNG KẾT QUẢ KIỂM THỬ RUNTIME THỰC TẾ (FINAL TEST MATRIX)

| Test ID | Tên Kịch Bản | UI State | API Response | MongoDB Atlas | Supabase CDN | LocalStorage | Kết Quả | Bằng Chứng Thực Tế (Runtime Evidence) |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **DB-001** | **Tạo Bài Viết (Create Post)** | Success Toast | `201 Created` | `EXISTS` | `200 OK` | `CACHED` | **PASS** | Đã tạo `db-chaos-test-1788079917467`, query MongoDB `findOne` trả về document hợp lệ, Supabase CDN trả về `200 OK` JSON. |
| **DB-002** | **Cập Nhật Bài Viết (Update)** | Success Toast | `200 OK` | `UPDATED` | `200 OK` | `CACHED` | **PASS** | Tiêu đề bài viết đổi thành `DB_CHAOS_TEST_1788079917467_UPDATED` đồng bộ cả trên MongoDB và Supabase. |
| **DB-003** | **Xóa Bài Viết (Delete)** | Info Toast | `204 No Content`| `DELETED (null)`| `404 Not Found` | `CLEARED` | **PASS** | `findOne` trên MongoDB trả về `null`, Supabase Storage URL trả về `404`. Bài viết bị xóa sạch 100%. |
| **DB-004** | **Xóa LocalStorage & F5** | Hydrated | `200 OK` | `EXISTS` | `200 OK` | `RE-POPULATED` | **PASS** | Khi xóa sạch LocalStorage, hàm `initializeFromDB()` fetch lại toàn bộ danh sách từ Supabase & MongoDB. |
| **DB-005** | **Mở Tab Ẩn Danh / Incognito** | Rendered Full | `200 OK` | `EXISTS` | `200 OK` | `EMPTY ➔ POPULATED` | **PASS** | Độc giả mới không có cache vẫn tải được bài viết và chuyên mục từ Cloud CDN. |
| **DB-006** | **Mở Trên Thiết Bị Khác** | Rendered Full | `200 OK` | `EXISTS` | `200 OK` | `ISOLATED` | **PASS** | Thiết bị khác tải độc lập qua Supabase CDN & API. |
| **DB-007** | **Mất Mạng / Lỗi DB Khi Lưu Bài** | 🔴 **FALSE SUCCESS** | `Failed to fetch`| ❌ **CHƯA GHI** | ❌ **CHƯA GHI** | ✅ **GHI LOCAL** | 🔴 **FAIL (CRITICAL)** | **LỖI PHÁP Y NGHIÊM TRỌNG:** Khi mạng lỗi, `savePost` bắt `catch` âm thầm rồi lưu vào `localStorage`. UI vẫn hiện thông báo "Xuất bản thành công!" khiến người dùng nhầm tưởng bài đã lên Database. |
| **DB-008** | **MongoDB Sập / Cold Start Timeout** | Fallback Memory | `200 OK (Memory)`| ❌ **OFFLINE** | ✅ **GHI SUPABASE** | ✅ **GHI LOCAL** | 🟡 **FAIL (P1)** | Hệ thống failover sang Supabase & MemoryStore mà không cảnh báo cho Admin biết MongoDB đang offline. |
| **DB-009** | **Supabase Storage Timeout / 500** | Success Toast | `200 OK` | ✅ **GHI MONGODB**| ❌ **LỖI CDN** | ✅ **GHI LOCAL** | 🟡 **FAIL (P2)** | Bài viết vào MongoDB nhưng thiếu bản sao trên Supabase CDN (Split-Brain). |
| **DB-010** | **Ghi Đồng Thời 2 Người (Race Condition)** | Both Toast | `200 OK` | N/A | 🔴 **LOST UPDATE** | `DIVERGED` | 🔴 **FAIL (CRITICAL)** | **XÁC MINH RACE CONDITION:** Khi 2 client cùng fetch manifest rồi upload đè, chỉ có bản ghi của Client A tồn tại, thay đổi của Client B bị mất hoàn toàn trên Supabase (Lost Update Anomaly). |
| **DB-011** | **Đăng Xuất & Đăng Nhập Lại** | Authenticated | `200 OK` | `EXISTS` | `200 OK` | `SESSION SET` | **PASS** | Đăng nhập thành công với tài khoản trong danh sách nhân sự. |
| **DB-012** | **Session Security & CMS Gate** | 🔴 **BYPASSABLE**| N/A | N/A | N/A | `CLIENT KEY` | 🔴 **FAIL (CRITICAL)** | Chỉ cần mở Console gõ `localStorage.setItem('horizon_admin_session', 'true')` là mở khóa được toàn bộ giao diện CMS mà không cần server xác thực. |
| **DB-013** | **Bảo Vệ API Backend (Access Control)** | N/A | 🔴 **200/201/204 ACCEPTED** | 🔴 **MUTABLE ANONYMOUSLY** | 🔴 **MUTABLE** | N/A | 🔴 **FAIL (CRITICAL)** | **LỖ HỔNG BẢO MẬT P0:** Gửi `POST /api/posts` hay `DELETE /api/posts/:id` từ Curl/Postman mà không cần bất kỳ header xác thực nào, backend vẫn thực thi lệnh vào MongoDB. |
| **DB-014** | **Lộ Mật Khẩu & Service Role Key** | N/A | `200 OK (Public)`| `PLAINTEXT` | 🔴 **PUBLIC URL** | `PLAINTEXT` | 🔴 **FAIL (CRITICAL)** | **LỖ HỔNG BẢO MẬT P0:** `staff_manifest.json` công khai chứa plaintext password của tài khoản. Khóa tối cao `SUPABASE_SERVICE_ROLE` nằm trực tiếp trong JS bundle client. |
| **DB-015** | **File Manifest Bị Lỗi Cú Pháp** | Self-Healing | `200 OK` | `EXISTS` | `CORRUPT` | `FALLBACK SEED` | **PASS** | `initializeFromDB` bọc `try...catch` an toàn, trang web không bị sập khi JSON manifest bị hỏng. |

---

## 2. MA TRẬN BẤT ĐỐI XỨNG DỮ LIỆU (DATA CONSISTENCY MATRIX)

| Tình Huống Gián Đoạn (Scenario) | MongoDB Atlas | Supabase Storage CDN | Trình Duyệt Client (Local) | Người Dùng Thấy (UI) | Đánh Giá Rủi Ro Thực Tế |
| :--- | :---: | :---: | :---: | :--- | :--- |
| **1. Mất mạng hoàn toàn khi bấm Đăng bài** | ❌ Không có | ❌ Không có | ✅ Có trong cache | 🔴 *"Xuất bản thành công!"* | **CỰC KỲ NGUY HIỂM:** Người dùng tưởng bài đã lưu, nhưng sang máy khác hoặc xóa cache là mất vĩnh viễn. |
| **2. MongoDB thành công / Supabase lỗi** | ✅ Đã lưu | ❌ Chưa có | ✅ Có trong cache | *"Xuất bản thành công!"* | **LỆCH DỮ LIỆU:** Máy chủ API thấy bài, nhưng Supabase CDN thiếu bài. |
| **3. MongoDB lỗi / Supabase thành công** | ❌ Không có | ✅ Đã lưu | ✅ Có trong cache | *"Xuất bản thành công!"* | **LỆCH DỮ LIỆU:** Supabase CDN có bài, nhưng Backend API và Bot SEO không thấy bài trong Database. |
| **4. Hai người cùng sửa nhân sự cùng 1 giây** | ✅ MongoDB Upsert | 🔴 Bị ghi đè mất 1 người | 🔴 Máy A khác Máy B | Cả 2 đều thấy *"Lưu thành công"* | **MẤT DỮ LIỆU (Lost Update):** File manifest trên Supabase chỉ giữ lại dữ liệu của người bấm sau. |

---

## 3. NĂM PHÁT HIỆN PHÁP Y BẮT BUỘC (5 CORE FORENSIC FINDINGS)

### 1. 🛡️ VERIFIED SAFE (Những Gì Đã Chứng Minh Hoạt Động Đúng):
- **CRUD cơ bản khi hệ thống khỏe mạnh:** Thao tác Tạo (`DB-001`), Sửa (`DB-002`), Xóa (`DB-003`) bài viết thực sự ghi và xóa chuẩn xác trên cả **MongoDB Atlas** và **Supabase Storage**.
- **Khôi phục sau khi xóa Cache (`DB-004`):** Khi xóa sạch LocalStorage, trang web tự động tải lại dữ liệu từ Cloud Database mà không bị mất.

### 2. 🚨 VERIFIED BROKEN (Những Lỗi Đã Tái Hiện Bằng Bằng Chứng Thực Tế):
1. **Lỗi Silent Fallback (`DB-007`):** `savePost` và `saveStaff` nuốt lỗi (`catch`) khi mất mạng, tự ghi vào `localStorage` và báo thành công giả tạo trên giao diện.
2. **Lỗi Lost Update / Race Condition (`DB-010`):** Ghi đè toàn bộ file manifest JSON trên Supabase làm mất dữ liệu khi có nhiều người cùng thao tác.
3. **Lỗ hổng Broken Access Control (`DB-013`):** Backend API mở hoàn toàn không có khóa bảo vệ; người lạ có thể xóa hoặc sửa database qua HTTP request.
4. **Lỗ hổng Lộ Mật Khẩu & Service Role Key (`DB-014`):** Tệp `staff_manifest.json` công khai chứa plaintext password; khóa `SUPABASE_SERVICE_ROLE` bị lộ ở frontend.
5. **Lỗ hổng Bypass Session (`DB-012`):** Giao diện CMS bị khóa chỉ bằng 1 biến `localStorage` không có token máy chủ xác thực.

### 3. ⛔ BLOCKED TESTS:
- Không có test nào bị Blocked. Tất cả 15 bài kiểm tra đã được thực thi và xác minh 100%.

---

## 4. TOP 10 DANH MỤC KHẮC PHỤC BẮT BUỘC (TOP 10 FIXES)

1. **[P0 - Security]** Thu hồi khóa `SUPABASE_SERVICE_ROLE` khỏi client-side; chuyển toàn bộ tác vụ ghi Supabase về Backend API.
2. **[P0 - Security]** Bóc tách và xóa bỏ trường `password` khỏi `staff_manifest.json` trên Supabase; mã hóa Bcrypt trong MongoDB.
3. **[P0 - Security]** Thêm Middleware kiểm tra Secret Token / JWT trên toàn bộ API backend `POST/PUT/DELETE`.
4. **[P0 - Data Integrity]** Xóa bỏ cơ chế `Silent Fallback` trong `storageService.js`: Khi API / Database lỗi, UI BẮT BUỘC PHẢI BÁO LỖI để người dùng không bị mất bài viết.
5. **[P1 - Consistency]** Thay thế cơ chế tải-đè toàn bộ file manifest bằng atomic updates hoặc chỉ dùng MongoDB làm Source of Truth duy nhất, Supabase chỉ lưu file ảnh.
6. **[P1 - Auth]** Chuyển cơ chế đăng nhập CMS sang JWT / HttpOnly Cookie có thời hạn hết hạn phiên (Session Timeout).
7. **[P2 - Reliability]** Thêm cơ chế Re-sync tự động: Nếu MongoDB hoặc Supabase bị lỗi 1 bên, hàng đợi nền sẽ thử lại để tránh lệch dữ liệu.
8. **[P2 - Backup]** Tạo Cronjob tự động export toàn bộ collection MongoDB ra file JSON nén bảo mật mỗi 24h.
9. **[P3 - UX]** Hiển thị cảnh báo trực tiếp trên thanh Header CMS nếu phát hiện đang ở chế độ Mất Kết Nối (Offline Mode).
10. **[P3 - Cleanup]** Xóa bỏ các state và storage key thừa không còn sử dụng.

---

## 5. ONE-SENTENCE VERDICT (KẾT LUẬN MỘT CÂU)

> **"Hệ thống Post New hiện TỒN TẠI KHẢ NĂNG GHI THỰC TẾ vào MongoDB Atlas và Supabase CDN, nhưng CHƯA ĐỦ ĐIỀU KIỆN PRODUCTION vì backend chưa có lớp bảo vệ xác thực API (Broken Access Control), mật khẩu bị lộ công khai trên CDN và hệ thống báo thành công giả tạo khi mất mạng (Silent Local Fallback)."**

```text
FINAL VERDICT:
🔴 NOT PRODUCTION READY (BẮT BUỘC PHẢI FIX CÁC LỖ HỔNG P0 TRƯỚC KHI PUBLIC VẬN HÀNH)
```
