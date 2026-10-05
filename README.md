# LOCKET TEXT 💛

Hệ thống quản lý và đồng bộ thông điệp bất ngờ cho ứng dụng Locket (hỗ trợ text, ảnh kỷ niệm, nhạc nền và hẹn giờ GMT+7).

## Tính năng

- **Locket Aesthetic**: Giao diện AMOLED Dark (`#070709`) phối màu vàng Locket Gold (`#FFC400`).
- **Live Smartphone Preview**: Mô phỏng điện thoại iPhone thời gian thực phản chiếu tức thì mọi thay đổi nội dung.
- **Media Upload**: Tải lên hình ảnh và tệp âm thanh (MP3), hỗ trợ trình phát nhạc và visualizer sóng âm.
- **Bộ hẹn giờ (Asia/Ho_Chi_Minh)**: Tự động kích hoạt khi đến thời điểm định trước.
- **Atomic Persistence**: Lưu trữ an toàn chống xung đột bằng cơ chế `.tmp -> rename`.
- **Tự dọn dẹp file rác**: Tự động xóa file media cũ khi cập nhật nội dung mới.
- **REST API chuẩn**: Cung cấp endpoint cho ứng dụng Android / iOS hoặc widget.

## Cài đặt & Khởi chạy

```bash
# Cài đặt thư viện
npm install

# Chạy server
npm start
# Mặc định server chạy tại http://localhost:3000 (tự chuyển port 3001 nếu 3000 đang bận)

# Chạy test kiểm thử
npm test
```

## API Endpoints

- `GET /api/status`: Kiểm tra trạng thái máy chủ và giờ GMT+7.
- `GET /api/message`: Lấy payload thông điệp hiện tại (dành cho APK / Client).
- `POST /api/message`: Cập nhật nội dung thông điệp.
- `POST /api/upload`: Tải file ảnh hoặc nhạc lên.
- `DELETE /api/upload/:filename`: Xóa file media an toàn.
