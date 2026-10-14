# Website Rebuild Project

Dự án đã được reset về trạng thái sạch hoàn toàn để chuẩn bị xây dựng lại từ đầu.

## 1. Dữ liệu được bảo toàn
- **MongoDB Atlas (`blogweb`)**: Toàn bộ dữ liệu bài viết (30 bài), danh mục, cấu hình hệ thống (settings), và nhân sự (staffs) cùng các liên kết được giữ nguyên 100%.
- **Supabase Storage (`postnew`)**: Toàn bộ 217 tệp tin và các thư mục `uploads/`, `articles/`, `posts/`, `categories/`, `branding/` được bảo toàn nguyên vẹn.
- **Bản sao lưu dự phòng an toàn**: Được lưu trữ tại `c:/DevWeb/backup_pre_reset_2026/`.

## 2. Khởi chạy cục bộ
```bash
npm install
npm run dev
```
