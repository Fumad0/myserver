const express = require('express');
const app     = express();
const PORT    = 5001;

const SCAN_WINDOW = 4000; // 4 seconds

// –– Authorization state ––
let authorizedTag = null;
let lastTag       = null;
let lastTime      = 0;

// –– Event log for dashboard ––
const events = [];
function logEvent(tag, action) {
  events.unshift({
    tag,
    action,
    locker:   'Locker 1',
    timestamp: new Date()
  });
}

// ─── Dashboard ───────────────────────────────────────────────────────────────
app.get('/dashboard', (req, res) => {
  let html = `
  <html><head><title>RFID Dashboard</title></head><body>
    <h1>RFID Access Events – Locker 1</h1>
    <table border="1" cellpadding="5" cellspacing="0">
      <tr><th>Time</th><th>Locker</th><th>Tag ID</th><th>Action</th></tr>`;
  events.forEach(evt => {
    html += `
      <tr>
        <td>${evt.timestamp.toLocaleString()}</td>
        <td>${evt.locker}</td>
        <td>${evt.tag}</td>
        <td>${evt.action}</td>
      </tr>`;
  });
  html += `
    </table>
  </body></html>`;
  res.send(html);
});

// ─── Main scan endpoint ───────────────────────────────────────────────────────
app.get('/', (req, res) => {
  const id  = req.query.id;
  const now = Date.now();
  if (!id) return res.sendStatus(400);

  // 1) Double-scan within window → authorize
  if (id === lastTag && now - lastTime < SCAN_WINDOW) {
    authorizedTag = id;
    console.log('Authorized tag:', id);
    logEvent(id, 'Authorized');
    lastTag  = null;
    lastTime = 0;
    return res.send('OK');
  }

  // 2) If this is the authorized tag → grant access
  if (id === authorizedTag) {
    console.log('Granting access to:', id);
    logEvent(id, 'Access granted');
    return res.send('granted');
  }

  // ─── NEW: any other tag when a tag is already authorized → deny ───────────
  if (authorizedTag) {
    console.log('Access not granted for:', id);
    logEvent(id, 'Access not granted');
    return res.send('OK');
  }

  // 3) Otherwise, start/restart the authorize window
  lastTag  = id;
  lastTime = now;
  console.log('ℹ️  Scan again within 4s to authorize:', id);
  return res.send('OK');
});

app.listen(PORT, () => {
  console.log('Server listening on port ${PORT}');
  console.log('Dashboard at http://localhost:${PORT}/dashboard');
});
