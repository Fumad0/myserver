// const express = require('express');
// const app = express();

// let first = true;
// let authorizedTag = null;
// let lastScannedTag = null;
// let lastScanTime = 0;
// let isWaitingForSecondScan = false;
// const SCAN_WINDOW = 4000; // 4 seconds

// app.get('/', (req, res) => {
//   const id = req.query.id;

//   // Handshake on first connection
//   if (first && id === 'handshake') {
//     console.log('Connection received');
//     first = false;
//     res.send('OK');
//     return;
//   }

//   const now = Date.now();

//   // Double-scan logic
//   if (isWaitingForSecondScan && id === lastScannedTag && (now - lastScanTime < SCAN_WINDOW)) {
//     // Within window
//     if (authorizedTag === id) {
//       // Unauthorize
//       authorizedTag = null;
//       console.log('Tag has been unauthorized!');
//     } else if (!authorizedTag) {
//       // Authorize new tag
//       authorizedTag = id;
//       console.log('Tag has been authorized.');
//     } else {
//       // Another tag already authorized
//       console.log('Cannot authorize: Another tag is already authorized.');
//       console.log('Please unauthorized the current tag first.');
//     }
//     isWaitingForSecondScan = false;
//   } else {
//     // First scan or outside window
//     lastScannedTag = id;
//     lastScanTime = now;
//     isWaitingForSecondScan = true;

//     if (authorizedTag === id) {
//       // Authorized tag scanned once
//       console.log('Welcome! Access granted.');
//       console.log('Scan again within 4 seconds to unauthorize this tag.');
//     } else if (authorizedTag) {
//       // Different tag scanned while one is authorized
//       console.log('Access denied. This tag is not authorized.');
//       console.log('Only one tag can be authorized at a time.');
//       isWaitingForSecondScan = false;
//     } else {
//       // No tag authorized yet
//       console.log('Scan any tag twice within 4 seconds.');
//       console.log(id); // print the tag in HEX
//     }

//     // Schedule timeout message
//     setTimeout(() => {
//       if (isWaitingForSecondScan) {
//         console.log('Second scan timeout. Authorization unchanged.');
//         isWaitingForSecondScan = false;
//       }
//     }, SCAN_WINDOW);
//   }

//   res.send('OK');
// });

// const PORT = 5000;
// app.listen(PORT, () => {
//   console.log(`Server listening on port ${PORT}`);
// });
const express = require('express');
const app = express();

let first = true;
let authorizedTag = null;
let lastScannedTag = null;
let lastScanTime = 0;
let isWaitingForSecondScan = false;
const SCAN_WINDOW = 4000; // 4 seconds

// In-memory event log for dashboard
const events = [];

// Helper to record an event
function logEvent(tag, action) {
  const timestamp = new Date();
  events.unshift({ tag, action, locker: 'Locker 1', timestamp });
}

// Serve dashboard
app.get('/dashboard', (req, res) => {
  let html = `
    <html>
    <head><title>RFID Dashboard</title></head>
    <body>
      <h1>RFID Access Events - Locker 1</h1>
      <table border="1" cellpadding="5" cellspacing="0">
        <tr><th>Time</th><th>Locker</th><th>Tag ID</th><th>Action</th></tr>
  `;
  events.forEach(evt => {
    html += `<tr>
      <td>${evt.timestamp.toLocaleString()}</td>
      <td>${evt.locker}</td>
      <td>${evt.tag}</td>
      <td>${evt.action}</td>
    </tr>`;
  });
  html += `
      </table>
    </body>
    </html>
  `;
  res.send(html);
});

app.get('/', (req, res) => {
  const id = req.query.id;

  // Handshake on first connection
  if (first && id === 'handshake') {
    console.log('Connection received');
    first = false;
    res.send('OK');
    return;
  }

  const now = Date.now();

  // Timeout check
  if (isWaitingForSecondScan && (now - lastScanTime >= SCAN_WINDOW)) {
    console.log('Second scan timeout. Authorization unchanged.');
    isWaitingForSecondScan = false;
  }

  // Double-scan logic
  if (
    isWaitingForSecondScan &&
    id === lastScannedTag &&
    (now - lastScanTime < SCAN_WINDOW)
  ) {
    if (authorizedTag === id) {
      // Unauthorize
      authorizedTag = null;
      console.log('Tag has been unauthorized!');
      logEvent(id, 'Unauthorized');
    } else if (!authorizedTag) {
      // Authorize new tag
      authorizedTag = id;
      console.log('Tag has been authorized.');
      logEvent(id, 'Authorized');
    } else {
      // Another tag already authorized
      console.log('Cannot authorize: Another tag is already authorized.');
      console.log('Please unauthorized the current tag first.');
    }
    isWaitingForSecondScan = false;
  } else {
    // First scan or outside window
    lastScannedTag = id;
    lastScanTime = now;
    isWaitingForSecondScan = true;

    if (authorizedTag === id) {
      // Authorized tag scanned once
      console.log('Welcome! Access granted.');
      console.log('Scan again within 4 seconds to unauthorize this tag.');
      logEvent(id, 'Access granted');
    } else if (authorizedTag) {
      // Different tag scanned while one is authorized
      console.log('Access denied. This tag is not authorized.');
      console.log('Only one tag can be authorized at a time.');
    } else {
      // No tag authorized yet
      console.log('Scan any tag twice within 4 seconds.');
      console.log(id); // print the tag in HEX
    }

    // Schedule timeout message automatically
    setTimeout(() => {
      if (isWaitingForSecondScan) {
        console.log('Second scan timeout. Authorization unchanged.');
        isWaitingForSecondScan = false;
      }
    }, SCAN_WINDOW);
  }

  res.send('OK');
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
  console.log(`Dashboard available at http://localhost:${PORT}/dashboard`);
});
