const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const storage = require('../lib/storage');

const TEST_DATA_DIR = path.join(__dirname, 'temp_data');
const TEST_FILE = path.join(TEST_DATA_DIR, 'test_message.json');
const TEST_UPLOADS = path.join(TEST_DATA_DIR, 'temp_uploads');

test.beforeEach(() => {
  if (fs.existsSync(TEST_DATA_DIR)) {
    fs.rmSync(TEST_DATA_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(TEST_DATA_DIR, { recursive: true });
  fs.mkdirSync(TEST_UPLOADS, { recursive: true });
});

test.afterEach(() => {
  if (fs.existsSync(TEST_DATA_DIR)) {
    fs.rmSync(TEST_DATA_DIR, { recursive: true, force: true });
  }
});

test('readMessage returns fallback default when file does not exist', () => {
  const msg = storage.readMessage(TEST_FILE);
  assert.ok(msg);
  assert.equal(msg.active, false);
  assert.ok(msg.id);
});

test('writeMessageAtomic performs atomic write without corrupting data', () => {
  const initial = {
    title: 'Hello Baby',
    message: 'Love you so much',
    active: true,
    version: 1
  };

  const written = storage.writeMessageAtomic(initial, TEST_FILE);
  assert.equal(written.title, 'Hello Baby');
  assert.equal(written.version, 2);
  assert.match(written.id, /^msg_\d{8}_\d{6}/);
  assert.match(written.updated_at, /\+07:00$/);

  // Verify file was written and can be read back
  const readBack = storage.readMessage(TEST_FILE);
  assert.equal(readBack.title, 'Hello Baby');
  assert.equal(readBack.version, 2);
  assert.equal(fs.existsSync(TEST_FILE + '.tmp'), false, 'Tmp file must be cleaned up');
});

test('cleanupOrphanedFiles deletes files not referenced in active message', () => {
  // Create 3 dummy files in uploads
  fs.writeFileSync(path.join(TEST_UPLOADS, 'keep_img.jpg'), 'image data');
  fs.writeFileSync(path.join(TEST_UPLOADS, 'keep_song.mp3'), 'music data');
  fs.writeFileSync(path.join(TEST_UPLOADS, 'orphan_old.jpg'), 'old junk');

  const activeMessage = {
    image_url: '/uploads/keep_img.jpg',
    music_url: '/uploads/keep_song.mp3'
  };

  const deleted = storage.cleanupOrphanedFiles(activeMessage, TEST_UPLOADS);
  assert.equal(deleted.length, 1);
  assert.equal(deleted[0], 'orphan_old.jpg');

  assert.equal(fs.existsSync(path.join(TEST_UPLOADS, 'keep_img.jpg')), true);
  assert.equal(fs.existsSync(path.join(TEST_UPLOADS, 'keep_song.mp3')), true);
  assert.equal(fs.existsSync(path.join(TEST_UPLOADS, 'orphan_old.jpg')), false);
});
