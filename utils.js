// utils/emailService.js

const nodemailer = require('nodemailer');
const fs = require('fs').promises;
const path = require('path');
const Handlebars = require('handlebars');
const dotenv = require('dotenv');

dotenv.config();

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 465),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    }
});

async function sendMail({ to, subject, text, html }) {
    const info = await transporter.sendMail({
        from: process.env.SMTP_FROM,
        to,
        subject,
        text,
        html
    });

    return info;
}

async function renderTemplate(templateFile, vars = {}) {
    const fullPath = path.join(__dirname, "..", "Backend_leadfire", templateFile);
    const source = await fs.readFile(fullPath, 'utf-8');
    const template = Handlebars.compile(source);
    return template(vars);
}

/**
 * Send a verification code using any HTML template.
 */
async function sendVerificationEmail(
    email,
    code,
    templateFile
) {
    const subject = "Verify Your Email";
    const vars = {
        userPassword: code,
        userEmail: email,
    };

    const html = await renderTemplate(templateFile, vars);
    const text = `Your verification code is: ${code}`;
    return sendMail({ to: email, subject, text, html });
}

module.exports = { sendVerificationEmail };