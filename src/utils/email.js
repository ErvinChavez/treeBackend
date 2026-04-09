require('dotenv').config();
// utils/email.js
const nodemailer = require("nodemailer");

const { EMAIL_USER, EMAIL_PASS } = process.env;

// Setup email transporter
const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
  logger: true,
  debug: true,
});

async function sendEmail(to, subject, text) {
  try {
    await transporter.sendMail({
      from: EMAIL_USER,
      to,
      subject,
      text,
    });
    console.log("Email sent to", to);
  } catch (err) {
    console.error("Email error:", err);
  }
}

module.exports = sendEmail;
