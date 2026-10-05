const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');

// We test server routes by starting server on an ephemeral port
const { app, startServer } = require('../server');

let server;
let baseUrl;

test.before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
});

test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

test('GET /api/status returns healthy status', async () => {
  const res = await fetch(`${baseUrl}/api/status`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.status, 'ok');
  assert.equal(data.timezone, 'Asia/Ho_Chi_Minh');
});

test('GET /api/message returns current message payload', async () => {
  const res = await fetch(`${baseUrl}/api/message`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.ok(typeof data.active === 'boolean');
});

test('POST /api/message updates message atomically and increments version', async () => {
  const updatePayload = {
    active: true,
    title: 'Test Title For Love',
    message: 'Test Message Body',
    btn_text: 'Click me',
    btn_link: 'https://example.com'
  };

  const res = await fetch(`${baseUrl}/api/message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updatePayload)
  });

  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.success, true);
  assert.equal(body.data.title, 'Test Title For Love');
  assert.ok(body.data.id.startsWith('msg_'));
  assert.ok(body.data.version >= 2);

  // Verify GET /api/message now returns the active message
  const getRes = await fetch(`${baseUrl}/api/message`);
  const activeData = await getRes.json();
  assert.equal(activeData.active, true);
  assert.equal(activeData.title, 'Test Title For Love');
});

test('DELETE /api/upload/:filename protects against path traversal', async () => {
  const res = await fetch(`${baseUrl}/api/upload/..%2F..%2Fpackage.json`, {
    method: 'DELETE'
  });
  assert.equal(res.status, 400);
  const body = await res.json();
  assert.equal(body.success, false);
});
