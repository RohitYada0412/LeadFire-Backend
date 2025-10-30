const { onRequest } = require('firebase-functions/v2/https');
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

app.get('/hello', async (req, res, next) => {
  try {
    res.json({ ok: true, message: 'Hello from LeadFire Backend!' });
  } catch (err) {
    next(err);
  }
});

// global error handler
app.use((err, req, res, _next) => {
  console.error('API error:', err);
  res.status(err.status || 500).json({
    ok: false,
    error: { message: err.message || 'Something went wrong' }
  });
});

exports.api = onRequest({ region: 'us-central1' }, app);
