const nodemailer = require("nodemailer");

const { EMAIL_USER, EMAIL_PASS } = process.env;

// Setup email transporter
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  family: 4,
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

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
