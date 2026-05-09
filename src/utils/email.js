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

async function sendQuoteNotification(data) {
  return sendEmail(
    process.env.NEW_QUOTE_EMAIL,
    "New Quote Request",
    `
      <h2>New Quote Request</h2>

      <p><b>Name:</b> ${data.clientName}</p>
      <p><b>Phone:</b> ${data.clientPhone}</p>
      <p><b>Email:</b> ${data.clientEmail}</p>

      <p>
        <b>Address:</b>
        ${data.street},
        ${data.city},
        ${data.state}
        ${data.zip}
      </p>

      <p><b>Services:</b> ${data.services.join(", ")}</p>

      <p><b>Job ID:</b> ${data.jobId}</p>
    `
  );
}

module.exports = { sendEmail, sendQuoteNotification};
