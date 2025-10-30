// utils/emailService.js
const nodemailer = require('nodemailer');
const fs = require('fs').promises;
const path = require('path');
const Handlebars = require('handlebars');
const dotenv = require('dotenv');
// If you’re on Firebase Functions v2, prefer the built-in logger:
let logger;
try { logger = require('firebase-functions/logger'); } catch { logger = console; }

dotenv.config();

// Create the transporter once (module scope)
let transporter;
function getTransporter() {
    if (transporter) return transporter;
    console.log('asfasdf', process.env.SMTP_HOST)
    try {
        transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT || 587),
            secure: false,               // you set this to true; keep it aligned with your SMTP port (465 usually)
            requireTLS: true,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
            // tls: { rejectUnauthorized: true },
        });
        return transporter;
    } catch (err) {
        logger.error('Failed to create SMTP transporter', sanitizeErr(err));
        throw new Error('Email transport initialization failed');
    }
}

// Optional: verify transporter once (useful to fail fast on bad creds/host)
async function verifyTransporter() {
    try {
        await getTransporter().verify();
    } catch (err) {
        logger.error('SMTP transporter verification failed', sanitizeErr(err));
        throw new Error('Email transport verification failed');
    }
}

// Mask secrets before logging
function sanitizeErr(err) {
    const e = {
        message: err?.message,
        name: err?.name,
        code: err?.code,
        stack: err?.stack,
    };
    // remove any accidental auth data
    return e;
}

async function sendMail({ to, subject, text, html }) {
    try {
        // Ensure transporter is ready (verify once if you like)
        // await verifyTransporter(); // uncomment to hard-verify SMTP on each cold start

        const info = await getTransporter().sendMail({
            from: process.env.SMTP_USER,
            to,
            subject,
            text,
            html,
            envelope: {
                from: 'welcome@leadfirepro.net', // mailbox that exists on your domain
                to
            },
            replyTo: 'welcome@leadfirepro.net'
        });

        logger.info('Email sent', {
            to,
            messageId: info?.messageId,
            accepted: info?.accepted,
            rejected: info?.rejected,
            response: info?.response,
        });
        console.log(info)
        return info;
    } catch (err) {
        logger.error('sendMail failed', {
            to,
            subject,
            err: sanitizeErr(err),
        });
        // Re-throw a clean error for the API layer
        throw new Error('SMTP send failed');
    }
}

async function renderTemplate(templateFile, vars = {}) {
    try {
        const fullPath = path.join(__dirname, templateFile); // templates live next to this file
        const source = await fs.readFile(fullPath, 'utf-8');
        const template = Handlebars.compile(source);
        return template(vars);
    } catch (err) {
        logger.error('renderTemplate failed', {
            templateFile,
            vars: Object.keys(vars || {}),
            err: sanitizeErr(err),
        });
        throw new Error(`Template render failed: ${templateFile}`);
    }
}

/**
 * Send a verification email using an HTML template.
 */
async function sendVerificationEmail(to, code, templateFile) {
    try {
        if (!to) throw new Error('Missing recipient');
        if (!code) throw new Error('Missing code');
        if (!templateFile) throw new Error('Missing templateFile');

        const subject = 'Verify Your Email';
        const vars = { userPassword: code, userEmail: to };

        // const html = await renderTemplate(templateFile, vars);
        const text = `Your verification code is: ${code}`;
        return await sendMail({ to, subject, text, html: "<h3>asdfd</h3>" });
    } catch (err) {
        logger.error('sendVerificationEmail failed', {
            to,
            templateFile,
            err: sanitizeErr(err),
        });
        throw new Error('Verification email failed');
    }
}

module.exports = {
    sendVerificationEmail,
    // export helpers if you want to unit test:
    _private: { getTransporter, verifyTransporter, renderTemplate, sendMail },
};
