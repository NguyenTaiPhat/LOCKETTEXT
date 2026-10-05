const express = require('express');
const cors = require('cors');
const path = require('node:path');
const fs = require('node:fs');
const multer = require('multer');
const storage = require('./lib/storage');

const app = express();
const PORT = process.env.PORT || 3000;
const UPLOADS_DIR = storage.UPLOADS_DIR;
const DATA_FILE = storage.DATA_FILE;
const PUBLIC_DIR = path.join(__dirname, 'public');

// Ensure directories exist safely (creates in /tmp on Vercel)
storage.ensureStorage();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static assets
app.use(express.static(PUBLIC_DIR));
app.use('/uploads', express.static(UPLOADS_DIR));

// Multer Storage Configuration
const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const baseName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_\-]/g, '_');
    const uniqueSuffix = `${Date.now()}_${Math.round(Math.random() * 1e4)}`;
    cb(null, `${uniqueSuffix}_${baseName}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedImage = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  const allowedAudio = ['audio/mpeg', 'audio/mp3', 'audio/ogg', 'audio/wav', 'audio/x-m4a', 'audio/m4a'];

  if (allowedImage.includes(file.mimetype) || allowedAudio.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Định dạng tệp không được hỗ trợ (${file.mimetype}). Chỉ chấp nhận file ảnh hoặc âm thanh.`));
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter,
  limits: {
    fileSize: 25 * 1024 * 1024 // 25 MB max
  }
});

// API Routes

/**
 * Health & Status endpoint
 */
app.get('/api/status', (req, res) => {
  res.json({
    status: 'ok',
    app: 'LOCKET TEXT',
    uptime: Math.floor(process.uptime()),
    timezone: 'Asia/Ho_Chi_Minh',
    current_time: storage.getVietnamISOString()
  });
});

/**
 * Get current message payload (called by APK or Web)
 */
app.get('/api/message', (req, res) => {
  const rawMessage = storage.readMessage(DATA_FILE);
  const clientPayload = storage.evaluateMessageForClient(rawMessage, new Date());
  res.json(clientPayload);
});

/**
 * Admin: Get complete raw config (including inactive/scheduled state)
 */
app.get('/api/admin/message', (req, res) => {
  const rawMessage = storage.readMessage(DATA_FILE);
  res.json(rawMessage);
});

/**
 * Admin: Update message and publish
 */
app.post('/api/message', (req, res) => {
  try {
    const {
      active,
      title,
      message,
      image_url,
      music_url,
      schedule_enabled,
      schedule_time,
      btn_text,
      btn_link
    } = req.body;

    const updateData = {
      active: Boolean(active),
      title: (title || '').trim(),
      message: (message || '').trim(),
      image_url: (image_url || '').trim(),
      music_url: (music_url || '').trim(),
      schedule_enabled: Boolean(schedule_enabled),
      schedule_time: schedule_time ? schedule_time.trim() : null,
      btn_text: (btn_text || 'Yêu anh ❤️').trim(),
      btn_link: (btn_link || 'https://m.me/').trim()
    };

    // Perform atomic save
    const saved = storage.writeMessageAtomic(updateData, DATA_FILE);

    // Clean up old unreferenced media
    const cleaned = storage.cleanupOrphanedFiles(saved, UPLOADS_DIR);

    res.json({
      success: true,
      data: saved,
      cleaned_files: cleaned
    });
  } catch (err) {
    console.error('Error saving message:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Upload single media file (Image or Audio)
 */
app.post('/api/upload', (req, res) => {
  upload.single('file')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ success: false, error: `Lỗi tải file: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ success: false, error: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Không tìm thấy tệp để tải lên.' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({
      success: true,
      file_url: fileUrl,
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype
    });
  });
});

/**
 * Delete a specific uploaded file (with path traversal protection)
 */
app.delete('/api/upload/:filename', (req, res) => {
  const filename = req.params.filename;

  // Prevent path traversal
  if (!filename || path.basename(filename) !== filename || filename.includes('..')) {
    return res.status(400).json({ success: false, error: 'Tên tệp không hợp lệ.' });
  }

  const targetPath = path.join(UPLOADS_DIR, filename);

  if (!fs.existsSync(targetPath)) {
    return res.status(404).json({ success: false, error: 'Tệp không tồn tại.' });
  }

  try {
    fs.unlinkSync(targetPath);
    res.json({ success: true, message: `Đã xóa tệp ${filename}.` });
  } catch (err) {
    console.error('Error deleting file:', err);
    res.status(500).json({ success: false, error: 'Không thể xóa tệp.' });
  }
});

// Fallback error handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ success: false, error: 'Lỗi máy chủ nội bộ.' });
});

function startServer(port = PORT) {
  const server = app.listen(port, () => {
    console.log(`[LOCKET TEXT] Server is running on http://localhost:${port}`);
    console.log(`[LOCKET TEXT] Timezone: Asia/Ho_Chi_Minh (${storage.getVietnamISOString()})`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      const nextPort = Number(port) + 1;
      console.warn(`[LOCKET TEXT] Port ${port} is in use, retrying on port ${nextPort}...`);
      startServer(nextPort);
    } else {
      console.error('[LOCKET TEXT] Server error:', err);
    }
  });

  return server;
}

if (require.main === module) {
  startServer();
}

app.app = app;
app.startServer = startServer;
module.exports = app;
