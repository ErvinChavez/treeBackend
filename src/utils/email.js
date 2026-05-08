const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Sends transactional email
 * Used for review requests, notifications, and internal alerts
 */
async function sendEmail(to, subject, html) {
  try {
    console.log("EMAIL ATTEMPT:", {
      to,
    });

    const data = await resend.emails.send({
      from: "Chavez Tree Service <onboarding@resend.dev>",
      to,
      subject,
      html,
    });

    console.log("Email sent:", data);
    return data;

  } catch (err) {
    console.error("Email error:", err);
    throw new Error("failed to send email");
  }
}

module.exports = sendEmail;
