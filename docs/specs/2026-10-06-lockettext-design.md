# LOCKET TEXT - Technical Design Specification

- **Date:** 2026-10-06
- **Status:** Approved (Updated with Production-Grade Engineering Enhancements)
- **Project:** LOCKET TEXT
- **Location:** `C:\Users\TP\.gemini\antigravity-ide\scratch\lockettext`
- **Timezone:** `Asia/Ho_Chi_Minh` (UTC+7)

---

## 1. Mục tiêu & Tổng quan (Purpose & Overview)
LOCKET TEXT là hệ thống web quản trị nội dung (Control Panel) được thiết kế theo ngôn ngữ thẩm mỹ của Locket (Dark OLED, Locket Gold, bo tròn mềm mại). Ứng dụng quản lý và phát các thông điệp, hình ảnh, bài hát bất ngờ đến ứng dụng Locket (modded APK) trên điện thoại bạn gái qua giao thức HTTP REST API với độ tin cậy và tính toàn vẹn dữ liệu cao.

---

## 2. Kiến trúc Hệ thống (System Architecture)

```text
+--------------------------------------------------------------+
|                    LOCKET TEXT WEB ADMIN                     |
|  +---------------------------+  +--------------------------+ |
|  |  Control Panel (Form)     |  | Live Smartphone Mockup   | |
|  |  - Active Toggle          |  | - Dynamic Island         | |
|  |  - Title & Message        |  | - Locket Camera UI       | |
|  |  - Image & Audio Upload   |  | - Real-time Modal Pop-up | |
|  |  - Auto-scheduler (GMT+7) |  | - Audio Preview Player   | |
|  +---------------------------+  +--------------------------+ |
+--------------------------------------------------------------+
                               |
                               | REST API (POST/DELETE /api/upload, POST /api/message)
                               v
+--------------------------------------------------------------+
|                   NODE.JS / EXPRESS BACKEND                  |
|  - server.js (Port 3000)                                     |
|  - Static Server (/public, /uploads)                         |
|  - Atomic Write Engine (tmp -> rename -> message.json)       |
|  - Media Garbage Collector (Cleanup orphaned files)          |
|  - Timezone Engine: Asia/Ho_Chi_Minh (UTC+7)                 |
+--------------------------------------------------------------+
                               ^
                               | HTTP GET /api/message
+--------------------------------------------------------------+
|                LOCKET APK (CLIENT TRÊN ĐIỆN THOẠI)           |
|  - Gọi ngầm /api/message khi mở app                          |
|  - Kiểm tra (active == true) && (id != last_message_id)      |
|  - Thỏa mãn -> tải ảnh, phát nhạc, bật Pop-up                |
|  - Người dùng đóng pop-up -> lưu last_message_id             |
|  - Lần sau mở app không hiện trùng cùng 1 ID                 |
+--------------------------------------------------------------+
```

---

## 3. Cấu trúc thư mục (Folder Structure)

```text
lockettext/
├── data/
│   └── message.json         # Dữ liệu cấu hình chính (ghi atomic qua file .tmp)
├── uploads/                 # Lưu trữ ảnh và file âm thanh (tự động cleanup file rác)
├── public/
│   ├── index.html           # Bố cục 2 cột (Control Panel + Live Mockup)
│   ├── style.css            # Locket Design System (OLED Dark, Gold Accents)
│   └── app.js               # Logic điều khiển, Live Preview & Gọi API
├── docs/
│   └── specs/
│       └── 2026-10-06-lockettext-design.md
├── server.js                # Express Server, Router, Atomic Writer & Cleanup Engine
└── package.json             # Dependencies (express, multer, cors)
```

---

## 4. Đặc tả Dữ liệu & API (Data & API Specifications)

### 4.1. Schema Dữ liệu (`data/message.json`)
```json
{
  "id": "msg_20261006_001",
  "version": 1,
  "active": true,
  "title": "Bất ngờ dành cho em bé ❤️",
  "message": "Chúc mừng ngày kỷ niệm của chúng mình! Anh yêu em nhiều lắm.",
  "image_url": "/uploads/1728169999-photo.jpg",
  "music_url": "/uploads/1728169999-song.mp3",
  "schedule_enabled": false,
  "schedule_time": null,
  "btn_text": "Yêu anh ❤️",
  "btn_link": "https://m.me/your_profile",
  "updated_at": "2026-10-06T01:10:00+07:00"
}
```

### 4.2. Quy tắc Ghi File Nguyên tử (Atomic Write Engine)
Để tránh race condition khi APK client gửi request `GET` đúng lúc backend đang ghi file:
1. Tạo nội dung JSON hoàn chỉnh.
2. Ghi ra tệp tạm `data/message.json.tmp`.
3. Gọi lệnh đổi tên nguyên tử `fs.renameSync('data/message.json.tmp', 'data/message.json')`.
4. Hệ điều hành đảm bảo tiến trình đọc luôn đọc được file hoàn chỉnh, không bao giờ bị dính file rỗng hoặc corrupt JSON.

### 4.3. Quản lý Tệp tải lên & Dọn dẹp tự động (Media Cleanup Engine)
Khi người dùng lưu thông điệp mới qua `POST /api/message`:
* Backend quét thư mục `uploads/`.
* So sánh danh sách file trên ổ đĩa với `image_url` và `music_url` đang được sử dụng trong `message.json`.
* Tự động xóa vĩnh viễn các file media cũ không còn được tham chiếu, đảm bảo dung lượng ổ đĩa không bị phình to theo thời gian.

---

### 4.4. Đặc tả Chi tiết các Endpoints

#### A. `GET /api/message`
* **Mục đích:** Client (APK điện thoại hoặc Web Mockup) lấy thông điệp hiện tại.
* **Xử lý Timezone:** Tính toán thời gian theo múi giờ `Asia/Ho_Chi_Minh` (UTC+7).
* **Logic Hẹn giờ & Phân phối:**
  * Nếu `active == false` -> Trả về `{"active": false}`.
  * Nếu `active == true` và `schedule_enabled == true`:
    * Lấy thời gian hiện tại theo UTC+7.
    * Nếu `currentTime < schedule_time`: Trả về `{"active": false, "scheduled": true}`.
    * Nếu `currentTime >= schedule_time`: Trả về toàn bộ payload kèm `id`, `version`, `active: true`.
* **Cơ chế Client tránh lặp:**
  * APK lưu `last_message_id` vào `SharedPreferences`.
  * Khi client nhận payload với `id == last_message_id` mà người dùng đã từng xem/tắt: Không hiện lại pop-up làm phiền.
  * Khi Phát cập nhật thông điệp mới (sinh ra `id` mới hoặc tăng `version`), APK phát hiện `id != last_message_id` -> lập tức kích hoạt pop-up bất ngờ.

#### B. `POST /api/message`
* **Mục đích:** Cập nhật thông điệp mới, tạo `id` mới (`msg_YYYYMMDD_XXX`), tăng `version` và kích hoạt cleanup file cũ.
* **Headers:** `Content-Type: application/json`
* **Body:**
```json
{
  "active": true,
  "title": "...",
  "message": "...",
  "image_url": "/uploads/...",
  "music_url": "/uploads/...",
  "schedule_enabled": false,
  "schedule_time": "2026-10-20T00:00:00+07:00",
  "btn_text": "...",
  "btn_link": "..."
}
```
* **Xử lý phía Server:**
  1. Tự sinh `id` dựa trên timestamp GMT+7 (ví dụ: `msg_20261006_011500`).
  2. Tăng số `version`.
  3. Gán `updated_at` theo định dạng ISO-8601 kèm offset `+07:00`.
  4. Thực hiện **Atomic Write** vào `data/message.json`.
  5. Kích hoạt dọn dẹp các file thừa trong `uploads/`.
* **Response (200 OK):**
```json
{
  "success": true,
  "data": { ... }
}
```

#### C. `POST /api/upload`
* **Mục đích:** Tải lên file ảnh hoặc file nhạc.
* **Headers:** `multipart/form-data` (trường `file`).
* **Validation:**
  * Ảnh: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif` (tối đa 15MB).
  * Nhạc: `.mp3`, `.ogg`, `.m4a`, `.wav` (tối đa 25MB).
* **Response:**
```json
{
  "success": true,
  "file_url": "/uploads/1728170000-photo.jpg",
  "filename": "1728170000-photo.jpg"
}
```

#### D. `DELETE /api/upload/:filename`
* **Mục đích:** Xóa thủ công một file cụ thể khỏi thư mục `uploads/`.
* **Security:** Validate tên file nghiêm ngặt để chống lỗ hổng Path Traversal (`../`).
* **Response:** `{ "success": true, "message": "File deleted" }`

---

## 5. Thiết kế Giao diện (UI / UX Specification)

### 5.1. Design Tokens
* Nền chính: `#070709` (Deep AMOLED Black)
* Nền Card / Panel: `#141418` (Surface)
* Nền Input / Dropzone: `#1C1C22`
* Locket Gold: `#FFC400` / `#FFE066`
* Font: `Outfit` (Headings, ID, Time) + `Plus Jakarta Sans` (Body, Controls)

### 5.2. Các thành phần trên giao diện Web Admin
1. **Header Bar:**
   * Logo Locket vàng + Tiêu đề **LOCKET TEXT**.
   * Badge trạng thái: **LIVE** (xanh lá nhấp nháy), **SCHEDULED** (vàng cam), hoặc **PAUSED** (xám).
   * Hiển thị Version hiện tại và Message ID đang active.
2. **Cột trái (Control Panel):**
   * **Active Switch:** Toggle lớn để bật/tắt toàn bộ tính năng.
   * **Thông điệp:** Input tiêu đề + Textarea lời chúc (có bộ đếm ký tự).
   * **Media Uploader:**
     * Dropzone tải ảnh (kéo thả hoặc bấm chọn, xem trước tức thì, có nút xóa).
     * Dropzone tải nhạc MP3 (thanh phát nhạc mini để nghe thử trực tiếp).
   * **Hẹn giờ (Timezone Asia/Ho_Chi_Minh):** Toggle kích hoạt + Datetime-local picker tính theo giờ Việt Nam.
   * **Nút bấm phản hồi (CTA):** Tùy biến text nút và link đích.
   * **Nút "Lưu & Kích hoạt":** Kích hoạt lưu nguyên tử, cấp ID mới và dọn dẹp file cũ.
3. **Cột phải (Smartphone Mockup):**
   * Khung iPhone Dynamic Island sang trọng.
   * Màn hình mô phỏng camera Locket.
   * Pop-up hộp quà ở trung tâm, phản chiếu trực tiếp thông điệp, ảnh, trình phát nhạc và nút bấm theo thời gian thực.
