# BlogWeb - Admin CMS & Website (HRM & Google Drive)

Hệ thống Quản trị Nội dung & Nhân sự (Admin Dashboard / HRM) hiện đại, hiệu quả và bảo mật cao, kết nối trực tiếp với cơ sở dữ liệu MongoDB Atlas (`blogweb`) và Google Drive (Thư mục lưu trữ: `1GxSVId3qLNG3LP-3jbUWH7T84ctdAAR1`).

## 1. Tính năng cốt lõi

### A. Xác thực & Phân quyền (Authentication & RBAC)
- Xác thực qua JWT (lưu trữ HttpOnly Cookie an toàn hoặc Authorization Bearer token).
- Mã hóa mật khẩu bảo mật bằng thuật toán **scrypt** (kèm salt 16 bytes ngẫu nhiên, chống tấn công dò tìm).
- Cơ chế kiểm tra mật khẩu hằng số thời gian (`timingSafeEqual`) chống tấn công Time-Attack.
- Chống tấn công Brute-force đăng nhập bằng `express-rate-limit`.
- Phân quyền chi tiết: `admin` (toàn quyền hệ thống, quản lý nhân sự), `editor` (quản lý bài viết & danh mục), `author`, `accountant`.

### B. Dashboard Tổng quan (Overview Metrics)
- Hiển thị trực tiếp dữ liệu thời gian thực từ MongoDB: Tổng bài viết, Bài đã xuất bản, Bản nháp, Danh mục, Tổng lượt xem bài viết, Tổng nhân sự.
- Giám sát trạng thái kết nối trực tiếp MongoDB Atlas (`online / connected`).
- Danh sách bài viết mới nhất với thao tác nhanh.

### C. Quản lý Bài viết & Nội dung Đa phương tiện
- Xem danh sách bài viết phân trang (10 bài/trang).
- Tìm kiếm theo tiêu đề hoặc slug.
- Lọc theo trạng thái (Tất cả, Đã xuất bản, Bản nháp) và Danh mục.
- Thêm mới & Chỉnh sửa bài viết với slug tự động (hỗ trợ Unicode tiếng Việt đầy đủ).
- Chế độ xem trước (Preview Reader) ngay trong trang soạn thảo.
- Đổi trạng thái bài viết (Xuất bản / Bản nháp) với 1 click.
- Tải ảnh bìa và chèn ảnh trực tiếp lên **Google Drive** với proxy stream an toàn (`/api/uploads/file/:fileId`).
- Xóa bài viết vĩnh viễn có hộp thoại xác nhận an toàn.
- Quản lý metadata SEO: Meta Title, Meta Description, Focus Keyword.
- Bật/tắt quảng cáo Google AdSense riêng cho từng bài viết.

### D. Quản lý Chuyên mục (Categories)
- Xem danh sách chuyên mục kèm số lượng bài viết đang liên kết.
- Thêm mới, sửa chuyên mục (tên, slug, mô tả, thẻ màu).
- Cơ chế bảo vệ dữ liệu: Ngăn chặn xóa chuyên mục nếu đang có bài viết gắn liền.

### E. Quản lý Nhân sự (Staff & Profile - HRM)
- Danh sách tài khoản quản trị và nhân sự kèm ảnh đại diện (Avatar).
- Tải và thay đổi ảnh đại diện nhân viên trực tiếp lên **Google Drive**.
- Thêm tài khoản mới, phân quyền `admin`, `editor`, `author`, `accountant`.
- Cập nhật thông tin, kích hoạt / vô hiệu hóa tài khoản, đặt lại mật khẩu.
- Bảo vệ tài khoản: Ngăn chặn tự xóa tài khoản của chính mình và ngăn chặn người không có quyền sửa ảnh của nhân viên khác.

### F. Cấu hình Hệ thống (Website Settings)
- Tên website, domain chuẩn (Canonical URL), khẩu hiệu (tagline), email liên hệ.
- Công tắc tổng bật/tắt toàn bộ quảng cáo Google AdSense (Master Switch) và cấu hình mã nhà xuất bản (Publisher ID).
- Mã theo dõi Google Analytics 4 (GA4).

---

## 2. Hướng dẫn Khởi chạy Cục bộ

### Cài đặt dependencies:
```bash
npm install
```

### Chạy hệ thống:
1. **Khởi động Backend API Server (Port 5000):**
   ```bash
   npm run server
   ```

2. **Khởi động Frontend Vite Dev Server (Port 5173):**
   ```bash
   npm run dev
   ```

Truy cập:
- Public Website Reader: `http://localhost:5173`
- Admin Dashboard Portal: `http://localhost:5173` (Bấm vào nút "Admin Dashboard" góc trên bên phải)

### Chạy bộ kiểm thử tự động toàn diện:
```bash
npm test
```

---

## 3. Tài khoản Đăng nhập Quản trị mặc định

- **Username:** `admin`
- **Mật khẩu:** `admin123`
- **Quyền hạn:** `admin` (Quản trị viên tối cao)

---

## 4. Cấu hình Biến Môi trường (.env)

| Tên biến | Mục đích |
| :--- | :--- |
| `MONGODB_URI` | Chuỗi kết nối MongoDB Atlas chứa cơ sở dữ liệu `blogweb` |
| `JWT_SECRET` | Khóa bí mật dùng để ký và xác thực phiên đăng nhập JWT |
| `PORT` | Cổng mạng cho Express API Server (mặc định: `5000`) |
| `GOOGLE_CLIENT_ID` | Client ID ứng dụng OAuth 2.0 từ Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | Client Secret ứng dụng OAuth 2.0 |
| `GOOGLE_REDIRECT_URI` | URI điều hướng xác thực OAuth (ví dụ `http://localhost:3000/api/auth/google/callback`) |
| `GOOGLE_DRIVE_FOLDER_ID` | ID thư mục Google Drive để lưu trữ ảnh (`1GxSVId3qLNG3LP-3jbUWH7T84ctdAAR1`) |
| `GOOGLE_REFRESH_TOKEN` | Refresh Token OAuth 2.0 offline dùng để cấp mới Access Token |
| `GOOGLE_TOKEN_ENCRYPTION_KEY` | Khóa mã hóa đối xứng AES-256 dùng để mã hóa an toàn token trong CSDL |
