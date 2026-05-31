const nodemailer = require('nodemailer');

const sendResetEmail = async (to, token) => {
  const appUrl = process.env.APP_URL || 'http://localhost:3000';
  const resetLink = `${appUrl}/reset-password?token=${token}`;

  // If SMTP is configured, send an email. Otherwise just log the link.
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const from = process.env.FROM_EMAIL || process.env.SMTP_USER;

    await transporter.sendMail({
      from,
      to,
      subject: 'Password reset instructions',
      text: `You've requested a password reset. Use the following token to reset your password: ${token}`,
      html: `<p>You requested a password reset.</p><p>Use the following token to reset your password: ${token}</p><p>If you didn't request this, ignore this email.</p>`,
    });
    return;
  }

};

module.exports = sendResetEmail;
