// File: index.js
const express = require('express');
const mqtt    = require('mqtt');
const app     = express();
const PORT    = 5000;

const CAPACITY = 10;
let carCount    = 0;

// ─── ThingsBoard MQTT setup ──────────────────────────────────────────────────
const TB_HOST           = 'mqtt://mqtt.thingsboard.cloud:1883';
const TB_TOKEN          = '9TMLFHrp41lDdLIOPIRB';  // your device token
const TB_TELEMETRY_TOPIC = 'v1/devices/me/telemetry';

const tbClient = mqtt.connect(TB_HOST, {
  username: TB_TOKEN,
  reconnectPeriod: 5000,
  queueQoSZero: true
});

tbClient.on('connect', () => {
  console.log('📡 Connected to ThingsBoard');
  publishCount();
});
tbClient.on('reconnect', () => console.log(' Reconnecting to TB…'));
tbClient.on('offline',   () => console.log(' TB client offline'));
tbClient.on('error',     err => console.error(' TB MQTT Error:', err));

// Publish current count
function publishCount() {
  const payload = JSON.stringify({ carCount });
  tbClient.publish(TB_TELEMETRY_TOPIC, payload, { qos: 1 }, err => {
    if (err) console.error(' Publish error:', err);
    else     console.log(` Published to TB: ${payload}`);
  });
}

// ─── Entry endpoint ───────────────────────────────────────────────────────────
app.get('/enter', (req, res) => {
  if (carCount < CAPACITY) {
    carCount++;
    console.log(`Entry → count = ${carCount}`);
    publishCount();
    res.send(`granted,${carCount}`);
  } else {
    console.log(`Entry denied → count = ${carCount}`);
    publishCount();
    res.send(`denied,${carCount}`);
  }
});

// ─── Exit endpoint ────────────────────────────────────────────────────────────
app.get('/exit', (req, res) => {
  if (carCount > 0) {
    carCount--;
    console.log(`Exit → count = ${carCount}`);
  } else {
    console.log(`Exit at 0 → count remains 0`);
  }
  publishCount();
  res.send(`exited,${carCount}`);
});

// ─── Status endpoint ─────────────────────────────────────────────────────────
app.get('/status', (req, res) => {
  res.send(carCount.toString());
});

app.listen(PORT, () => {
  console.log(`Backend listening on port ${PORT}`);
});
