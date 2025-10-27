// server.js
require("dotenv").config();
const fs = require("fs").promises;
const path = require("path");
const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const nodemailer = require("nodemailer");
const { sendVerificationEmail } = require("./utils");

const LOG_DIR = path.join(process.cwd(), "logs");
const LOG_FILE = path.join(LOG_DIR, "send-email.log");

async function appendErrorLog(entry) {
  try {
    await fs.mkdir(LOG_DIR, { recursive: true });
    await fs.appendFile(LOG_FILE, JSON.stringify(entry) + "\n", "utf8");
  } catch (logErr) {
    // As a last resort, don't crash—emit to stderr
    res.status(500).json({ error: logErr });


  }
}

const app = express();

// middleware
app.use(cors({ origin: true }));
app.use(express.json({ limit: "200kb" }));
app.use(rateLimit({ windowMs: 60_000, max: 30 }));


app.post("/leadfire-backend/api/send-email", async (req, res) => {
  try {
    const {
      to,
      subject,
      text,
      html,
      fromEmail,
      code,
      expiryMinutes,
      template,
      variables = {},
    } = req.body || {};

    // recipient
    const toAddress = to || fromEmail || process.env.SMTP_USER;
    if (!toAddress) return res.status(400).json({ error: "Missing recipient: provide 'to' or 'fromEmail'." });
    const result = await sendVerificationEmail(to, code, "LeadfireCompanyPasswordEmail.html")
    // console.log(result)
    res.json({ ok: true, messageId: "sucess" });
  } catch (err) {
    const startedAt = Date.now();  // <-- add this line

    // Prepare a safe, useful error log entry
    const entry = {
      ts: new Date().toISOString(),
      route: "/leadfire-backend/api/send-email",
      durationMs: Date.now() - startedAt,
      error: {
        message: err?.message,
        name: err?.name,
        stack: err?.stack,
      },
      // Include minimal request context; avoid full body dumps if it may contain PII
      request: {
        ip: req.ip,
        method: req.method,
        path: req.originalUrl,
        headers: {
          "user-agent": req.get("user-agent"),
          // omit cookies/auth headers
        },
        // Log only non-sensitive fields; redact likely secrets
        body: {
          // subject/template help debugging; redact content
          subject: req.body?.subject,
          template: req.body?.template,
          toProvided: Boolean(req.body?.to),
          fromEmailProvided: Boolean(req.body?.fromEmail),
          // redactions
          code: req.body?.code ? "[REDACTED]" : undefined,
          html: req.body?.html ? "[REDACTED]" : undefined,
          text: req.body?.text ? "[REDACTED]" : undefined,
          variablesKeys: req.body?.variables
            ? Object.keys(req.body.variables)
            : [],
        },
      },
    };

    await appendErrorLog(entry);
    // console.error("send-email error:", err);
    res.status(500).json({ error: "Failed to send email" });
  }
});

app.post("/leadfire-backend/api/send-email-agent", async (req, res) => {
  try {
    const {
      to,
      fromEmail,
      code,
    } = req.body || {};

    // recipient
    const toAddress = to || fromEmail || process.env.SMTP_USER;
    if (!toAddress) return res.status(400).json({ error: "Missing recipient: provide 'to' or 'fromEmail'." });
    const result = await sendVerificationEmail(to, code, 'LeadfireAgentPasswordEmail.html')
    res.json({ ok: true, messageId: "sucess" });
  } catch (err) {
    const startedAt = Date.now();

    const entry = {
      ts: new Date().toISOString(),
      route: "/leadfire-backend/api/send-email-agent",
      durationMs: Date.now() - startedAt,
      error: {
        message: err?.message,
        name: err?.name,
        stack: err?.stack,
      },
      // Include minimal request context; avoid full body dumps if it may contain PII
      request: {
        ip: req.ip,
        method: req.method,
        path: req.originalUrl,
        headers: {
          "user-agent": req.get("user-agent"),
        },
        body: {
          subject: req.body?.subject,
          template: req.body?.template,
          toProvided: Boolean(req.body?.to),
          fromEmailProvided: Boolean(req.body?.fromEmail),
          // redactions
          code: req.body?.code ? "[REDACTED]" : undefined,
          html: req.body?.html ? "[REDACTED]" : undefined,
          text: req.body?.text ? "[REDACTED]" : undefined,
          variablesKeys: req.body?.variables
            ? Object.keys(req.body.variables)
            : [],
        },
      },
    };

    await appendErrorLog(entry);
    // console.error("send-email error:", err);
    res.status(500).json({ error: "Failed to send email" });
  }
});

app.post("/leadfire-backend/api/confirmation-mail-password", async (req, res) => {
  try {
    const {
      to,
      fromEmail,
      code,
    } = req.body || {};

    // recipient
    const toAddress = to || fromEmail || process.env.SMTP_USER;
    if (!toAddress) return res.status(400).json({ error: "Missing recipient: provide 'to' or 'fromEmail'." });
    const result = await sendVerificationEmail(to, code, 'LeadfireConfirmation.html')
    // console.log(result)
    res.json({ ok: true, messageId: "sucess" });
  } catch (err) {
    const startedAt = Date.now();

    const entry = {
      ts: new Date().toISOString(),
      route: "/leadfire-backend/api/send-email-agent",
      durationMs: Date.now() - startedAt,
      error: {
        message: err?.message,
        name: err?.name,
        stack: err?.stack,
      },
      // Include minimal request context; avoid full body dumps if it may contain PII
      request: {
        ip: req.ip,
        method: req.method,
        path: req.originalUrl,
        headers: {
          "user-agent": req.get("user-agent"),
        },
        body: {
          subject: req.body?.subject,
          template: req.body?.template,
          toProvided: Boolean(req.body?.to),
          fromEmailProvided: Boolean(req.body?.fromEmail),
          // redactions
          code: req.body?.code ? "[REDACTED]" : undefined,
          html: req.body?.html ? "[REDACTED]" : undefined,
          text: req.body?.text ? "[REDACTED]" : undefined,
          variablesKeys: req.body?.variables
            ? Object.keys(req.body.variables)
            : [],
        },
      },
    };

    await appendErrorLog(entry);
    console.error("send-email error:", err);
    res.status(500).json({ error: err });
  }
});


const port = Number(process.env.PORT || 4000);
app.listen(port, () => console.log(`API listening on http://localhost:${port}`));
