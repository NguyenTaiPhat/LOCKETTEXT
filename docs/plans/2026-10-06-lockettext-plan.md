# LOCKET TEXT Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full-stack web application named LOCKET TEXT featuring an Express REST API backend and a responsive Locket-themed dashboard with real-time smartphone mockup preview, media upload, scheduler, and atomic persistence.

**Architecture:** Node.js/Express backend provides REST endpoints (`/api/message`, `/api/upload`, `/api/upload/:filename`) backed by atomic file-based JSON storage and media cleanup engine. The frontend is a zero-build Vanilla HTML5/CSS3/JavaScript application implementing Locket's signature dark AMOLED + Gold aesthetic with live two-way preview.

**Tech Stack:** Node.js, Express.js, Multer, Cors, Vanilla CSS, Vanilla JavaScript.

## Global Constraints

- Storage location: `C:\Users\TP\.gemini\antigravity-ide\scratch\lockettext`
- Timezone: `Asia/Ho_Chi_Minh` (UTC+7) for all schedule comparisons and ISO timestamps
- Schema requirements: Must include `id` (`msg_YYYYMMDD_HHMMSS`), `version` (integer), `active` (boolean), `schedule_enabled`, `schedule_time`, `updated_at`
- File writing: Must use atomic write pattern (`temp file` -> `fs.renameSync`)
- Security: Must prevent path traversal on file deletion and validate file types
- Design tokens: AMOLED Dark `#070709`, Surface `#141418`, Locket Gold `#FFC400` / `#FFE066`, Outfit / Plus Jakarta Sans fonts

---

### Task 1: Project Scaffolding & Initial Data Setup

**Files:**
- Create: `package.json`
- Create: `data/message.json`
- Create directories: `data/`, `uploads/`, `public/`, `lib/`, `test/`

**Interfaces:**
- Produces: `data/message.json` initial valid JSON state.

- [x] **Step 1: Create package.json**

```json
{
  "name": "lockettext",
  "version": "1.0.0",
  "description": "LOCKET TEXT - Surprise Message Control Panel",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "test": "node --test test/*.test.js"
  },
  "dependencies": {
    "cors": "^2.8.5",
    "express": "^4.21.2",
    "multer": "^1.4.5-lts.1"
  }
}
```

- [x] **Step 2: Install dependencies**

Run: `npm install` inside `C:\Users\TP\.gemini\antigravity-ide\scratch\lockettext`
Expected: `node_modules` created, exit code 0.

- [x] **Step 3: Create initial data/message.json**

```json
{
  "id": "msg_initial_001",
  "version": 1,
  "active": false,
  "title": "Gửi em bé ❤️",
  "message": "Chúc em một ngày tràn đầy năng lượng và nụ cười!",
  "image_url": "",
  "music_url": "",
  "schedule_enabled": false,
  "schedule_time": null,
  "btn_text": "Yêu anh ❤️",
  "btn_link": "https://m.me/",
  "updated_at": "2026-10-06T01:00:00+07:00"
}
```

- [x] **Step 4: Verify directory structure**

Verify directories exist: `data/`, `uploads/`, `public/`, `lib/`, `test/`.

---

### Task 2: Storage Engine with Atomic Write, Timezone & Media Cleanup

**Files:**
- Create: `lib/storage.js`
- Test: `test/storage.test.js`

**Interfaces:**
- Produces:
  - `readMessage(): Object`
  - `writeMessageAtomic(data: Object): Object`
  - `cleanupOrphanedFiles(activeMessage: Object, uploadsDir: string): Array<string>`
  - `getCurrentVietnamTime(): Date`

- [x] **Step 1: Write failing storage tests**

Write `test/storage.test.js` testing atomic write, timestamp generation with UTC+7, and media orphan cleanup.

- [x] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL (cannot find module `lib/storage.js`).

- [x] **Step 3: Implement lib/storage.js**

Implement `readMessage()`, `writeMessageAtomic()`, `cleanupOrphanedFiles()`, and `getCurrentVietnamTime()` with safe file system operations and proper path sanitization.

- [x] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS (all storage tests pass).

---

### Task 3: Express Backend API & Upload Handling

**Files:**
- Create: `server.js`
- Test: `test/api.test.js`

**Interfaces:**
- Produces:
  - `GET /api/message`: Public client endpoint with schedule calculation.
  - `POST /api/message`: Admin configuration update with ID generation, version bump, and cleanup.
  - `POST /api/upload`: Multipart file upload with MIME type and size validation.
  - `DELETE /api/upload/:filename`: Safe file removal preventing path traversal.
  - `GET /api/status`: System status and metadata.

- [x] **Step 1: Write failing API route tests**

Write `test/api.test.js` covering `GET /api/message`, `POST /api/message`, `POST /api/upload`, and `DELETE /api/upload/:filename`.

- [x] **Step 2: Run test to verify failure**

Run: `npm test`
Expected: FAIL (`server.js` not found or routes not responding).

- [x] **Step 3: Implement server.js**

Implement Express app, CORS, Multer storage in `uploads/`, static serving for `public/` and `uploads/`, route handlers with error boundaries.

- [x] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS (all API and route tests pass).

---

### Task 4: Frontend HTML Structure & Locket Design System (CSS)

**Files:**
- Create: `public/index.html`
- Create: `public/style.css`

**Interfaces:**
- Consumes: Static assets from `/uploads/` and API endpoints.
- Produces: Responsive 2-column layout (Control Panel on left, Interactive iPhone Mockup with Dynamic Island on right).

- [x] **Step 1: Create public/index.html**

Structure with header bar (Logo, Live/Paused status badge, Version badge), Left Column (Control panel with form inputs, upload dropzones, scheduler controls, save button), and Right Column (Smartphone chassis, dynamic island, Locket camera overlay, modal pop-up).

- [x] **Step 2: Implement public/style.css**

Implement AMOLED dark theme (`#070709`), Locket Gold accent system (`#FFC400`), Google Fonts imports, glassmorphism modal styles, custom toggle switches, responsive grid breakpoints.

- [x] **Step 3: Verify static page renders in browser / curl**

Start test server and fetch `http://localhost:3000/`. Verify HTTP 200 and valid HTML response.

---

### Task 5: Frontend Logic, Live Preview & Two-Way Synchronization

**Files:**
- Create: `public/app.js`

**Interfaces:**
- Consumes: REST API (`/api/message`, `/api/upload`, `/api/upload/:filename`).
- Produces: Real-time mirror between form inputs and phone mockup, drag-and-drop file upload, audio preview playback, toast notifications.

- [x] **Step 1: Implement public/app.js state & live preview**

Connect form inputs (`title`, `message`, `btn_text`, `btn_link`) to the live modal in the smartphone mockup so every keystroke updates the mockup instantly.

- [x] **Step 2: Implement file upload & audio preview**

Add drag-and-drop and file input handlers for images and MP3 files. Upload via `fetch('/api/upload')`, update mockup image and audio elements, and provide a play/pause tester.

- [x] **Step 3: Implement scheduler countdown & active toggle**

Calculate remaining time to scheduled date in GMT+7, toggle header badge between LIVE / SCHEDULED / PAUSED.

- [x] **Step 4: Implement Save & Sync with Backend**

Handle form submission to `POST /api/message`, update local ID and version, show polished toast alert upon success.

---

### Task 6: End-to-End Verification & Health Audit

**Files:**
- Verify: Full integration between web UI, server API, file system storage, and client simulation.

- [x] **Step 1: Execute all unit and integration tests**

Run: `npm test`
Expected: All tests PASS.

- [x] **Step 2: Simulate client APK request**

Perform `curl http://localhost:3000/api/message` with various schedule/active states to verify exact payload received by the Android app.

- [x] **Step 3: Final self-review & launch readiness**

Verify atomic writing under rapid successive saves, verify orphaned file deletion, confirm responsive layout on mobile/desktop viewports.
