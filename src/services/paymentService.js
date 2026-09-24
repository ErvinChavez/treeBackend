const Stripe = require("stripe");


const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

/**
 * Creates a hosted Stripe Checkout Session for a job's outstanding balance.
 * Called on demand from the public /pay page (via the job's payToken), so the
 * amount charged is always whatever is left at the moment the client clicks
 * "Pay Now" — not a stale amount baked in when the invoice email was sent.
 */
async function createCheckoutSessionForBalance(job, client, amount, payToken) {
  const amountInCents = Math.round(Number(amount) * 100);

  if (!Number.isFinite(amountInCents) || amountInCents <= 0) {
    throw new Error("Payment amount must be a positive number");
  }

  const frontendBase = (process.env.FRONTEND_URL || "http://localhost:3000").replace(/\/$/, "");

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    customer_email: client.email,
    line_items: [
      {
        price_data: {
          currency: "usd",
          unit_amount: amountInCents,
          product_data: {
            name: `Chavez Tree Service — Job #${job.id}`,
            description: `${job.street}, ${job.city}, ${job.state} ${job.zip}`,
          },
        },
        quantity: 1,
      },
    ],
    metadata: {
      jobId: String(job.id),
    },
    success_url: `${frontendBase}/pay/success?session_id={CHECKOUT_SESSION_ID}&token=${payToken}`,
    cancel_url: `${frontendBase}/pay?token=${payToken}&cancelled=1`,
  });

  return session;
}

/**
 * Retrieves a Checkout Session directly from Stripe.
 * Used by the public payment-status query so the success page can confirm
 * a payment without exposing any internal job data.
 */
async function retrieveCheckoutSession(sessionId) {
  return stripe.checkout.sessions.retrieve(sessionId);
}

module.exports = {
  stripe,
  createCheckoutSessionForBalance,
  retrieveCheckoutSession,
};
