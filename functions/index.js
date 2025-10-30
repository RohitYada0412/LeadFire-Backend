// functions/index.js
const { onRequest } = require('firebase-functions/v2/https');

require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { sendVerificationEmail } = require('./utils');

// ---------- simple file logger (best-effort) ----------
const LOG_DIR = path.join(process.cwd(), 'logs');
const LOG_FILE = path.join(LOG_DIR, 'send-email.log');

async function appendErrorLog(entry) {
  try {
    await fs.mkdir(LOG_DIR, { recursive: true });
    await fs.appendFile(LOG_FILE, JSON.stringify(entry) + '\n', 'utf8');
  } catch (_) {
    /* ignore file logging errors in serverless */
  }
}

// ---------- express app ----------
const app = express();

app.use(cors({ origin: true }));
app.use(express.json({ limit: '200kb' }));
app.use(rateLimit({ windowMs: 60_000, max: 30 }));

// HEALTH / TEST
app.get('/api/test', async (req, res, next) => {
  try {
    res.json({ ok: true, message: 'Hello from LeadFire Backend!' });
  } catch (err) {
    next(err);
  }
});

// SEND EMAIL (company)
app.post('/api/send-email', async (req, res) => {
  const startedAt = Date.now();
  try {
    const { to, fromEmail, code } = req.body || {};
    const toAddress = to || fromEmail || process.env.SMTP_USER;
    if (!toAddress) {
      return res.status(400).json({ error: "Missing recipient: provide 'to' or 'fromEmail'." });
    }
    console.error('asfasd', to)
    await sendVerificationEmail(to, code, 'LeadfireCompanyPasswordEmail.html');
    return res.json({ data: 'res', ok: true, messageId: 'success' });
  } catch (err) {
    await appendErrorLog({
      ts: new Date().toISOString(),
      route: '/api/send-email',
      durationMs: Date.now() - startedAt,
      error: { message: err?.message, name: err?.name, stack: err?.stack },
    });
    return res.status(500).json({ error: err });
  }
});

// SEND EMAIL (agent)
app.post('/api/send-email-agent', async (req, res) => {
  const startedAt = Date.now();
  try {
    const { to, fromEmail, code } = req.body || {};
    const toAddress = to || fromEmail || process.env.SMTP_USER;
    if (!toAddress) return res.status(400).json({ error: 'Missing recipient' });

    await sendVerificationEmail(toAddress, code, 'LeadfireAgentPasswordEmail.html');
    return res.json({ ok: true, messageId: 'success' });
  } catch (err) {
    await appendErrorLog({
      ts: new Date().toISOString(),
      route: '/api/send-email-agent',
      durationMs: Date.now() - startedAt,
      error: { message: err?.message, name: err?.name, stack: err?.stack },
    });
    return res.status(500).json({ error: err });
  }
});

// CONFIRMATION MAIL (password)
app.post('/api/confirmation-mail-password', async (req, res) => {
  const startedAt = Date.now();
  try {
    const { to, fromEmail, code } = req.body || {};
    const toAddress = to || fromEmail || process.env.SMTP_USER;
    if (!toAddress) return res.status(400).json({ error: 'Missing recipient' });

    await sendVerificationEmail(toAddress, code, 'LeadfireConfirmation.html');
    return res.json({ ok: true, messageId: 'success' });
  } catch (err) {
    await appendErrorLog({
      ts: new Date().toISOString(),
      route: '/api/confirmation-mail-password',
      durationMs: Date.now() - startedAt,
      error: { message: err?.message, name: err?.name, stack: err?.stack },
    });
    return res.status(500).json({ error: 'Failed to send email' });
  }
});

// global error handler
app.use((err, _req, res, _next) => {
  console.error('API error:', err);
  res.status(err.status || 500).json({
    ok: false,
    error: { message: err?.message || 'Something went wrong' },
  });
});

app.listen(4000, () => {
  console.log(`Example app listening on port 4000`)
})

// IMPORTANT: no app.listen() in Cloud Functions
// exports.api = onRequest({ region: 'us-central1' }, app);
