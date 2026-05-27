/**
 * utils/mailer.js
 *
 * Nodemailer transport with WEDOS SMTP (primary) and Gmail SMTP (fallback).
**/

import nodemailer from "nodemailer";

const wedosTransporter = nodemailer.createTransport({
  host: "wes1-smtp.wedos.net",
  port: 465,
  secure: true, // SSL
  auth: {
    user: process.env.WEDOS_USER,
    pass: process.env.WEDOS_PASS,
  },
});

const gmailTransporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

/**
 * Send an email, trying WEDOS first and falling back to Gmail on failure.
 * @param {Object} opts
 * @param {string} opts.to
 * @param {string} opts.subject
 * @param {string} opts.html
 */
export async function sendMail({ to, subject, html }) {
  const wedosFrom =
    process.env.WEDOS_FROM || `"Monabu" <${process.env.WEDOS_USER}>`;
  const gmailFrom =
    process.env.GMAIL_FROM || `"Monabu" <${process.env.GMAIL_USER}>`;

  try {
    await wedosTransporter.sendMail({
      from: wedosFrom,
      to,
      subject,
      html,
    });
  } catch (primaryErr) {
    console.error(
      "[mailer] WEDOS transport failed, falling back to Gmail:",
      primaryErr.message,
    );
    try {
      await gmailTransporter.sendMail({
        from: gmailFrom,
        to,
        subject,
        html,
      });
    } catch (fallbackErr) {
      console.error(
        "[mailer] Gmail fallback also failed:",
        fallbackErr.message,
      );
      throw new Error(
        `Both mail transports failed. Primary: ${primaryErr.message} | Fallback: ${fallbackErr.message}`,
      );
    }
  }
}

/**
 * Send an email verification link.
 * @param {string} to - recipient email
 * @param {string} token - raw verification token
 */
export async function sendVerificationEmail(to, token) {
  const base = process.env.CLIENT_URL || "https://monabu.eu";
  const link = `${base}/verify-email?token=${token}`;

  await sendMail({
    to,
    subject: "Verify your Monabu account",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;color:#111">
        <h2 style="margin-bottom:8px">Welcome to Monabu 👋</h2>
        <p style="color:#444;margin-bottom:24px">
          Please verify your email address to activate your account.
        </p>
        <a href="${link}"
           style="display:inline-block;background:#6366f1;color:#fff;
                  padding:12px 24px;border-radius:8px;text-decoration:none;
                  font-weight:600;font-size:15px">
          Verify Email
        </a>
        <p style="margin-top:24px;color:#888;font-size:13px">
          This link expires in 24 hours. If you didn't create an account,
          you can safely ignore this email.
        </p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
        <p style="color:#aaa;font-size:12px">
          Or copy this link into your browser:<br/>
          <span style="color:#6366f1">${link}</span>
        </p>
      </div>
    `,
  });
}

/**
 * Send a resend-verification email (same template, different subject line).
 * @param {string} to
 * @param {string} token
 */
export async function sendResendVerificationEmail(to, token) {
  const base = process.env.CLIENT_URL || "https://monabu.eu";
  const link = `${base}/verify-email?token=${token}`;

  await sendMail({
    to,
    subject: "Your new Monabu verification link",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;color:#111">
        <h2 style="margin-bottom:8px">New verification link</h2>
        <p style="color:#444;margin-bottom:24px">
          Here's your new verification link. The previous one has been invalidated.
        </p>
        <a href="${link}"
           style="display:inline-block;background:#6366f1;color:#fff;
                  padding:12px 24px;border-radius:8px;text-decoration:none;
                  font-weight:600;font-size:15px">
          Verify Email
        </a>
        <p style="margin-top:24px;color:#888;font-size:13px">
          This link expires in 24 hours.
        </p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
        <p style="color:#aaa;font-size:12px">
          Or copy this link into your browser:<br/>
          <span style="color:#6366f1">${link}</span>
        </p>
      </div>
    `,
  });
}

/**
 * Send a password-reset link.
 * @param {string} to - recipient email
 * @param {string} token - raw reset token
 */
export async function sendPasswordResetEmail(to, token) {
  const base = process.env.CLIENT_URL || "https://monabu.eu";
  const link = `${base}/reset-password?token=${token}`;

  await sendMail({
    to,
    subject: "Reset your Monabu password",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;color:#111">
        <h2 style="margin-bottom:8px">Reset your password</h2>
        <p style="color:#444;margin-bottom:24px">
          We received a request to reset your password. Click the button below
          to choose a new one.
        </p>
        <a href="${link}"
           style="display:inline-block;background:#6366f1;color:#fff;
                  padding:12px 24px;border-radius:8px;text-decoration:none;
                  font-weight:600;font-size:15px">
          Reset Password
        </a>
        <p style="margin-top:24px;color:#888;font-size:13px">
          This link expires in <strong>15 minutes</strong>. If you didn't
          request a password reset, you can safely ignore this email — your
          password won't change.
        </p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
        <p style="color:#aaa;font-size:12px">
          Or copy this link into your browser:<br/>
          <span style="color:#6366f1">${link}</span>
        </p>
      </div>
    `,
  });
}
