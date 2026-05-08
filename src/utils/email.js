const nodemailer = require("nodemailer");

const { EMAIL_USER, EMAIL_PASS } = process.env;

/**
 * Email transporter configuration
 * Uses SMTP (Gmail) for sending transactional emails
 */
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  // family:4, //Forces IPv4 usage
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});


/**
 * Sends transactional email
 * Used for review requests, notifications, and internal alerts
 */
async function sendEmail(to, subject, html) {
  try {
    await transporter.sendMail({
      from: EMAIL_USER,
      to,
      subject,
      html,
    });

  } catch (err) {
    console.error("Email error:", err);
    throw err;
  }
}

module.exports = sendEmail;
