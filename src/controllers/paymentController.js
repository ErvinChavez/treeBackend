const { stripe } = require("../services/paymentService");
const Job = require("../models/Job");
const Payment = require("../models/Payment");
const { applyBalanceToJob } = require("../services/jobService");

exports.stripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    console.error("Stripe webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (
      event.type === "checkout.session.completed" ||
      event.type === "checkout.session.async_payment_succeeded"
    ) {
      const session = event.data.object;

      if (session.payment_status === "paid") {
        const jobId = session.metadata?.jobId;
        const job = jobId ? await Job.findByPk(jobId) : null;

        if (!job) {
          console.warn(
            `Stripe webhook: no job found for checkout session ${session.id} (metadata.jobId=${jobId})`,
          );
        } else {
          const alreadyLogged = await Payment.findOne({
            where: { stripeCheckoutSessionId: session.id },
          });

          if (!alreadyLogged) {
            await Payment.create({
              jobId: job.id,
              method: "card",
              amount: session.amount_total != null ? session.amount_total / 100 : 0,
              note: "Paid via Stripe",
              stripePaymentIntentId: session.payment_intent || null,
              stripeCheckoutSessionId: session.id,
            });

            await applyBalanceToJob(job);
            await job.save();
          }
        }
      }
    }

    if (event.type === "checkout.session.async_payment_failed") {
      const session = event.data.object;
      console.warn(`Stripe async payment failed for checkout session ${session.id}`);
    }

    res.json({ received: true });
  } catch (err) {
    console.error("Error handling Stripe webhook event:", err);
    res.status(500).json({ error: "Webhook handler failed" });
  }
};
