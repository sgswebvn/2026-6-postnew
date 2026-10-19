# HƯỚNG DẪN CẤU HÌNH VÀ VẬN HÀNH GOOGLE DRIVE STORAGE (TIẾNG VIỆT)

Tài liệu này hướng dẫn chi tiết quy trình cấu hình Google Cloud Console, thiết lập biến môi trường, cấp quyền thư mục Drive, tích hợp và kiểm thử hệ thống lưu trữ ảnh cho dự án HRM & BlogWeb CMS.

---

## 1. Tổng quan Kiến trúc Lưu trữ Ảnh

- **Thư mục lưu trữ đích trên Google Drive:**
  - `GOOGLE_DRIVE_FOLDER_ID`: `1GxSVId3qLNG3LP-3jbUWH7T84ctdAAR1` (Đã được cố định và sử dụng trong toàn bộ hệ thống).
- **Cơ chế xác thực:**
  - **OAuth 2.0 Offline Access** với Refresh Token, đảm bảo an toàn cho tài khoản cá nhân hoặc doanh nghiệp.
  - Phía server tự động gia hạn Access Token định kỳ, không lộ bất kỳ thông tin bí mật nào (`client_secret`, `refresh_token`, token mã hóa) ra phía client (trình duyệt).
- **Cơ chế hiển thị ảnh:**
  - Server cung cấp endpoint proxy an toàn: `/api/uploads/file/:fileId`.
  - Phía website không yêu cầu thư mục Google Drive phải mở quyền công khai toàn bộ (Public folder), giúp bảo mật tài nguyên lưu trữ và kiểm soát truy cập chặt chẽ.
  - Tự động gắn header `Cache-Control: public, max-age=86400` và `ETag` (HTTP 304 Not Modified) để tối ưu hóa tốc độ tải trang và giảm thiểu giới hạn hạn ngạch (quota) của Google Drive API.
- **Bảo vệ định dạng & kích thước:**
  - Kiểm tra Magic Header byte signature (chống giả mạo đuôi tệp).
  - Hỗ trợ các định dạng: JPEG, PNG, WebP, GIF.
  - Giới hạn dung lượng tối đa: 5MB/ảnh.
  - Chống tải tệp trùng lặp (Deduplication) thông qua hàm băm MD5.

---

## 2. Các Biến Môi Trường Bắt Buộc

Cấu hình trong file `.env` (máy chủ local) hoặc trong bảng Environment Variables trên nền tảng deploy (Vercel, Render, Railway, VPS):

| Tên biến | Bắt buộc | Giá trị mẫu / Mô tả |
| :--- | :---: | :--- |
| `GOOGLE_DRIVE_FOLDER_ID` | **Có** | `1GxSVId3qLNG3LP-3jbUWH7T84ctdAAR1` |
| `GOOGLE_CLIENT_ID` | **Có** | Client ID OAuth 2.0 dạng `*.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | **Có** | Mã bí mật Client Secret `GOCSPX-...` |
| `GOOGLE_REDIRECT_URI` | **Có** | `http://localhost:3000/api/auth/google/callback` (Local) hoặc `https://domain-cua-ban/api/auth/google/callback` (Production) |
| `GOOGLE_REFRESH_TOKEN` | **Có** | Mã làm mới OAuth 2.0 offline (dùng để tạo Access Token tự động) |
| `GOOGLE_TOKEN_ENCRYPTION_KEY` | **Có** | Chuỗi bí mật ngẫu nhiên tối thiểu 32 ký tự dùng để mã hóa token lưu trong CSDL |
| `PORT` | Không | Cổng Express server chạy local (mặc định: `5000`) |
| `MONGODB_URI` | **Có** | Chuỗi kết nối MongoDB Atlas cơ sở dữ liệu `blogweb` |
| `JWT_SECRET` | **Có** | Khóa bí mật JWT xác thực phiên đăng nhập |

---

## 3. Các bước Cấu hình trên Google Cloud Console

### Bước 1: Kích hoạt Google Drive API
1. Truy cập [Google Cloud Console](https://console.cloud.google.com/).
2. Chọn dự án tương ứng với Client ID hiện tại (`1030455730184-gjql3ha9uo1jcic9qmbqbak2hjbv28ks`).
3. Vào menu **APIs & Services** → **Library**.
4. Tìm kiếm từ khóa **Google Drive API** và bấm **Enable** (Kích hoạt).

### Bước 2: Cấu hình Màn hình Đồng ý OAuth (OAuth Consent Screen)
1. Vào **APIs & Services** → **OAuth consent screen**.
2. Chọn loại người dùng: **External** (hoặc Internal nếu dùng Google Workspace).
3. Điền thông tin ứng dụng: Tên ứng dụng (HRM BlogWeb), Email hỗ trợ.
4. Thêm Scopes:
   - `https://www.googleapis.com/auth/drive.file` (Xem và quản lý các tệp được tải lên bởi ứng dụng này).
5. Trong mục **Test users**, thêm địa chỉ email Google đang sở hữu thư mục Drive `1GxSVId3qLNG3LP-3jbUWH7T84ctdAAR1`.
6. Lưu cấu hình.

### Bước 3: Cấu hình Authorized Redirect URIs
1. Vào **APIs & Services** → **Credentials**.
2. Bấm vào Web Client đã tạo (tương ứng với Client ID `1030455730184-...`).
3. Trong phần **Authorized redirect URIs**, thêm các URI sau:
   - Chạy kiểm thử / dev local:
     - `http://localhost:3000/api/auth/google/callback`
     - `http://localhost:5000/api/auth/google/callback`
   - Chạy trên Vercel / Production:
     - `https://domain-chinh-thuc.com/api/auth/google/callback`
4. Bấm **Save** (Lưu).

### Bước 4: Lấy Refresh Token
Có 2 phương thức thuận tiện để lấy `GOOGLE_REFRESH_TOKEN`:

#### Cách 1: Xác thực trực tiếp qua giao diện Website (Khuyên dùng)
1. Khởi động server local (`npm run server`).
2. Mở trình duyệt và truy cập liên kết:
   ```
   https://accounts.google.com/o/oauth2/v2/auth?access_type=offline&prompt=consent&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fdrive.file%20https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fdrive.metadata.readonly&response_type=code&client_id=1030455730184-gjql3ha9uo1jcic9qmbqbak2hjbv28ks.apps.googleusercontent.com&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fapi%2Fauth%2Fgoogle%2Fcallback
   ```
   *(Hoặc truy cập endpoint `/api/uploads/auth/google/url` từ tài khoản Admin)*.
3. Đăng nhập bằng tài khoản Google sở hữu thư mục Drive và bấm **Cho phép** (Allow).
4. Google sẽ điều hướng về callback và hệ thống sẽ tự động lưu Refresh Token mã hóa vào database MongoDB, đồng thời kích hoạt Drive Storage ngay lập tức.

#### Cách 2: Sử dụng Google OAuth 2.0 Playground
1. Vào [Google OAuth 2.0 Playground](https://developers.google.com/oauthplayground/).
2. Bấm vào biểu tượng bánh răng ⚙️ góc trên bên phải:
   - Đánh dấu chọn **Use your own OAuth credentials**.
   - Nhập `OAuth Client ID` và `OAuth Client secret`.
3. Trong danh sách bên trái (Step 1): Chọn `Drive API v3` → tích chọn `https://www.googleapis.com/auth/drive.file`.
4. Bấm **Authorize APIs** và đăng nhập tài khoản Google.
5. Tại Step 2: Bấm **Exchange authorization code for tokens**.
6. Sao chép giá trị trong ô **Refresh token** và dán vào file `.env`:
   ```env
   GOOGLE_REFRESH_TOKEN=1//04xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

---

## 4. Cách Cấp Quyền Thư Mục Drive

1. Mở [Google Drive](https://drive.google.com/).
2. Điều hướng đến thư mục có ID `1GxSVId3qLNG3LP-3jbUWH7T84ctdAAR1` (URL dạng: `https://drive.google.com/drive/folders/1GxSVId3qLNG3LP-3jbUWH7T84ctdAAR1`).
3. Đảm bảo tài khoản thực hiện xác thực OAuth là chủ sở hữu (Owner) hoặc có quyền **Người chỉnh sửa (Editor)** đối với thư mục này.
4. **Không cần chuyển thư mục sang "Bất kỳ ai có đường liên kết"**: Cơ chế Proxy Server `/api/uploads/file/:fileId` của dự án sẽ tự động đọc luồng dữ liệu an toàn bằng API Key/Token và truyền tải ảnh đến trình duyệt người dùng mà không cần mở public toàn bộ thư mục.

---

## 5. Danh Sách Endpoint Upload & Quản Lý

| Phương thức | Đường dẫn API | Xác thực | Mô tả |
| :---: | :--- | :---: | :--- |
| `GET` | `/api/uploads/health` | Không | Kiểm tra trạng thái cấu hình và kết nối thư mục Google Drive |
| `GET` | `/api/uploads/file/:fileId` | Không | Stream và hiển thị ảnh an toàn, hỗ trợ bộ nhớ đệm HTTP ETag |
| `POST` | `/api/uploads/avatar` | JWT | Tải lên ảnh đại diện nhân viên (Staff Avatar / HRM) |
| `POST` | `/api/uploads/image` | JWT | Tải lên ảnh bài viết (Cover image & WYSIWYG Content image) |
| `POST` | `/api/admin/upload` | JWT | Endpoint tương thích ngược tải ảnh lên Google Drive |
| `GET` | `/api/uploads/auth/google/url` | Admin | Lấy URL đăng nhập cấp quyền Google OAuth 2.0 |
| `GET` | `/api/auth/google/callback` | Không | Nhận mã xác thực từ Google và lưu trữ Refresh Token mã hóa |

---

## 6. Hướng Dẫn Kiểm Thử Thực Tế

### Khởi động hệ thống
```bash
# Terminal 1: Chạy backend server
npm run server

# Terminal 2: Chạy kiểm thử tự động Google Drive Suite
node test-google-drive-suite.mjs
```

### Các kịch bản kiểm thử đã được tích hợp tự động:
1. **Thiếu cấu hình Google:** Kiểm tra khi thiếu Client ID / Secret / Refresh Token.
2. **Cấu hình sai:** Xử lý lỗi xác thực rõ ràng, không làm crash server.
3. **Quyền truy cập thư mục:** Kiểm tra khả năng đọc / ghi vào thư mục `1GxSVId3qLNG3LP-3jbUWH7T84ctdAAR1`.
4. **ID thư mục không tồn tại:** Báo lỗi rõ ràng bằng tiếng Việt.
5. **Upload JPEG:** Kiểm tra Magic bytes `FF D8 FF` và upload thành công.
6. **Upload PNG:** Kiểm tra Magic bytes `89 50 4E 47` và upload thành công.
7. **Upload WebP:** Kiểm tra Magic bytes `RIFF...WEBP` và upload thành công.
8. **Từ chối tệp không phải ảnh:** Tệp text, PDF hoặc tệp giả mạo extension bị từ chối với HTTP 400.
9. **Từ chối tệp quá dung lượng:** Tệp lớn hơn 5MB bị từ chối với thông báo tiếng Việt.
10. **Bảo vệ xác thực:** Người dùng chưa đăng nhập không thể gọi API upload.
11. **Bảo vệ phân quyền HRM:** Nhân viên không thể sửa ảnh của nhân viên khác trừ khi có quyền Admin.
12. **Bảo toàn dữ liệu khi upload lỗi:** Thất bại trong quá trình upload không làm mất ảnh cũ của nhân viên.
13. **Lưu đúng thư mục:** Tệp được tạo với `parents: ['1GxSVId3qLNG3LP-3jbUWH7T84ctdAAR1']`.
14. **Lưu URL vào CSDL:** Trường `avatar` trong bảng Staff và `coverImage` trong bảng Post được cập nhật đúng định dạng.
15. **Hiển thị lại ảnh:** Endpoint `/api/uploads/file/:fileId` trả về ảnh với đúng MIME type và cache header.

---

## 7. Cấu Hình Khi Deploy Lên Production (Vercel / Render / VPS)

1. **Trên Vercel / Nền tảng hosting:**
   Vào phần **Project Settings** → **Environment Variables**, thêm các biến sau:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `GOOGLE_REDIRECT_URI`: `https://ten-mien-cua-ban.com/api/auth/google/callback`
   - `GOOGLE_DRIVE_FOLDER_ID`: `1GxSVId3qLNG3LP-3jbUWH7T84ctdAAR1`
   - `GOOGLE_REFRESH_TOKEN`: Điền Refresh Token đã lấy ở Bước 4.
   - `GOOGLE_TOKEN_ENCRYPTION_KEY`: Chuỗi bí mật 32 ký tự.
2. **Trên Google Cloud Console:**
   Thêm URL production `https://ten-mien-cua-ban.com/api/auth/google/callback` vào mục **Authorized redirect URIs**.
3. **Kiểm tra sau khi deploy:**
   Truy cập `https://ten-mien-cua-ban.com/api/uploads/health` để kiểm tra kết nối hiển thị `"connected": true`.
