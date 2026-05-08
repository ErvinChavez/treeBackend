const nodemailer = require("nodemailer");

const { EMAIL_USER, EMAIL_PASS } = process.env;

// Setup email transporter
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  family:4,
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

//error finding
transporter.verify((error, success) => {
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

    const info = await transporter.sendMail({
      from: `"Chavez Tree Service" <${EMAIL_USER}>`,
      to,
      subject,
      html,
    });

    console.log("STEP 2: after sendMAil", info);

    return info;

  } catch (err) {
    console.error("EMAIL FULL ERROR:");
    console.error(err); // IMPORTANT (not just message)
    throw err;
  }
}

// async function sendEmail(to, subject, html) {
//   try {
//     await transporter.sendMail({
//       from: EMAIL_USER,
//       to,
//       subject,
//       html,
//     });

//   } catch (err) {
//     console.error("Email error:", err);
//     throw err;
//   }
// }

module.exports = sendEmail;
