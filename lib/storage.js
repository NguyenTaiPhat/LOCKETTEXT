const fs = require('node:fs');
const path = require('node:path');

const DEFAULT_MESSAGE = {
  id: 'msg_initial_001',
  version: 1,
  active: false,
  title: 'Gửi em bé ❤️',
  message: 'Chúc em một ngày tràn đầy năng lượng và nụ cười!',
  image_url: '',
  music_url: '',
  schedule_enabled: false,
  schedule_time: null,
  btn_text: 'Yêu anh ❤️',
  btn_link: 'https://m.me/',
  updated_at: '2026-10-06T01:00:00+07:00'
};

/**
 * Returns formatted ISO-8601 string in Asia/Ho_Chi_Minh (UTC+7)
 */
function getVietnamISOString(date = new Date()) {
  const vnTime = new Date(date.getTime() + 7 * 60 * 60 * 1000);
  const iso = vnTime.toISOString(); // e.g. 2026-10-06T01:15:30.123Z
  return iso.replace('Z', '+07:00');
}

/**
 * Generates an ID in format msg_YYYYMMDD_HHMMSS using Vietnam time
 */
function generateMessageId(date = new Date()) {
  const vnTime = new Date(date.getTime() + 7 * 60 * 60 * 1000);
  const pad = (n) => String(n).padStart(2, '0');
  const yyyy = vnTime.getUTCFullYear();
  const mm = pad(vnTime.getUTCMonth() + 1);
  const dd = pad(vnTime.getUTCDate());
  const hh = pad(vnTime.getUTCHours());
  const min = pad(vnTime.getUTCMinutes());
  const ss = pad(vnTime.getUTCSeconds());
  return `msg_${yyyy}${mm}${dd}_${hh}${min}${ss}`;
}

/**
 * Reads message.json safely. Returns fallback if unreadable.
 */
function readMessage(filePath = path.join(__dirname, '..', 'data', 'message.json')) {
  try {
    if (!fs.existsSync(filePath)) {
      return { ...DEFAULT_MESSAGE };
    }
    const raw = fs.readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_MESSAGE, ...parsed };
  } catch (err) {
    console.error('Error reading message.json, returning fallback:', err.message);
    return { ...DEFAULT_MESSAGE };
  }
}

/**
 * Writes data atomically via .tmp -> rename
 */
function writeMessageAtomic(data, filePath = path.join(__dirname, '..', 'data', 'message.json')) {
  const current = readMessage(filePath);
  const now = new Date();

  const nextVersion = (typeof current.version === 'number' ? current.version : 1) + 1;
  const nextId = generateMessageId(now);
  const updatedAt = getVietnamISOString(now);

  const payload = {
    ...current,
    ...data,
    id: nextId,
    version: nextVersion,
    updated_at: updatedAt
  };

  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const tmpPath = `${filePath}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(payload, null, 2), 'utf-8');
  fs.renameSync(tmpPath, filePath);

  return payload;
}

/**
 * Scans uploadsDir and removes files not referenced in activeMessage
 */
function cleanupOrphanedFiles(activeMessage, uploadsDir = path.join(__dirname, '..', 'uploads')) {
  if (!fs.existsSync(uploadsDir)) {
    return [];
  }

  const referenced = new Set();
  if (activeMessage.image_url) {
    referenced.add(path.basename(activeMessage.image_url));
  }
  if (activeMessage.music_url) {
    referenced.add(path.basename(activeMessage.music_url));
  }

  const files = fs.readdirSync(uploadsDir);
  const deleted = [];

  for (const file of files) {
    // Avoid deleting hidden files or system files
    if (file.startsWith('.')) continue;

    if (!referenced.has(file)) {
      try {
        const fullPath = path.join(uploadsDir, file);
        if (fs.statSync(fullPath).isFile()) {
          fs.unlinkSync(fullPath);
          deleted.push(file);
        }
      } catch (err) {
        console.error(`Failed to delete orphaned file ${file}:`, err.message);
      }
    }
  }

  return deleted;
}

/**
 * Evaluates schedule condition according to Asia/Ho_Chi_Minh time
 */
function evaluateMessageForClient(message, now = new Date()) {
  if (!message || !message.active) {
    return { active: false };
  }

  if (message.schedule_enabled && message.schedule_time) {
    const scheduledTime = new Date(message.schedule_time).getTime();
    const currentTime = now.getTime();

    if (currentTime < scheduledTime) {
      return {
        active: false,
        scheduled: true,
        schedule_time: message.schedule_time
      };
    }
  }

  return {
    ...message,
    active: true
  };
}

module.exports = {
  DEFAULT_MESSAGE,
  getVietnamISOString,
  generateMessageId,
  readMessage,
  writeMessageAtomic,
  cleanupOrphanedFiles,
  evaluateMessageForClient
};
