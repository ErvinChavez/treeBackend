const nodemailer = require("nodemailer");

const { EMAIL_USER, EMAIL_PASS } = process.env;

// Setup email transporter
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

// verify connection
transporter.verify((error) => {
  if (error) {
    console.error("Email transporter failed:", error);
  } else {
    console.log("Email transporter ready");
  }
});

async function sendEmail(to, subject, html) {
  try {

    console.log("EMAIL ATTEMPT:", {
      to,
      user: process.env.EMAIL_USER,
    });

    await transporter.sendMail({
      from: EMAIL_USER,
      to,
      subject,
      html,
    });
    console.log("Email sent to", to);
  } catch (err) {
    console.error("Email error:", err);
    throw err;
  }
}

module.exports = sendEmail;
