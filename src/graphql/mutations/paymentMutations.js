const {
  GraphQLNonNull,
  GraphQLInt,
  GraphQLFloat,
  GraphQLBoolean,
  GraphQLString,
  GraphQLObjectType,
} = require("graphql");

//security
const crypto = require("crypto");

//DB models
const Job = require("../../models/Job");
const Client = require("../../models/Client");
const Payment = require("../../models/Payment");

//shared services
const { sendEmail } = require("../../utils/email");
const { createCheckoutSessionForBalance } = require("../../services/paymentService");
const {
  PAYMENT_METHODS,
  getJobBalance,
  applyBalanceToJob,
} = require("../../services/jobService");

//graphql types
const JobType = require("../types/JobType");
const PaymentType = require("../types/PaymentType");

/* Result of manually recording a payment against a job */
const RecordPaymentResultType = new GraphQLObjectType({
  name: "RecordPaymentResult",
  fields: () => ({
    payment: { type: PaymentType },
    job: { type: JobType },
  }),
});

/* Result of requesting a Stripe Checkout session from the public /pay page */
const CreateCheckoutSessionResultType = new GraphQLObjectType({
  name: "CreateCheckoutSessionResult",
  fields: () => ({
    checkoutUrl: { type: GraphQLString },
  }),
});

const paymentMutations = {
  recordPayment: {
    type: RecordPaymentResultType,
    args: {
      jobId: { type: new GraphQLNonNull(GraphQLInt) },
      method: { type: new GraphQLNonNull(GraphQLString) },
      amount: { type: new GraphQLNonNull(GraphQLFloat) },
      note: { type: GraphQLString },
    },
    async resolve(parent, args, context) {
      if (!context.admin) throw new Error("Unauthorized");

      const job = await Job.findByPk(args.jobId);
      if (!job) throw new Error("Job not found");

      if (!PAYMENT_METHODS.includes(args.method)) {
        throw new Error(`Invalid payment method. Must be one of: ${PAYMENT_METHODS.join(", ")}`);
      }

      if (!(Number(args.amount) > 0)) {
        throw new Error("Payment amount must be greater than zero");
      }

      const payment = await Payment.create({
        jobId: job.id,
        method: args.method,
        amount: Number(args.amount),
        note: args.note || null,
      });

      await applyBalanceToJob(job);
      await job.save();

      return { payment, job };
    },
  },

  sendReceiptEmail: {
    type: JobType,
    args: {
      jobId: { type: new GraphQLNonNull(GraphQLInt) },
    },
    async resolve(parent, args, context) {
      if (!context.admin) throw new Error("Unauthorized");

      const job = await Job.findByPk(args.jobId);
      if (!job) throw new Error("Job not found");

      if (job.status !== "completed" && job.status !== "paid") {
        throw new Error("Jobs must be completed before sending a receipt");
      }

      if (job.totalAmount === null || job.totalAmount === undefined) {
        throw new Error("A job total is required before sending a receipt");
      }

      const client = await Client.findByPk(job.clientId);
      if (!client || !client.email || !client.email.includes("@")) {
        throw new Error("A valid client email is required");
      }

      if (!job.payToken) {
        job.payToken = crypto.randomBytes(32).toString("hex");
      }

      //review token: fresh each send, matching the one-time-use review flow
      const reviewToken = crypto.randomBytes(32).toString("hex");
      job.reviewToken = reviewToken;
      job.reviewRequested = true;
      job.paymentRequested = true;
      await job.save();

      const { amountPaid, balanceRemaining } = await getJobBalance(job);

      const frontendBase = (process.env.FRONTEND_URL || "http://localhost:3000").replace(/\/$/, "");
      const reviewBase = `${frontendBase}/review`;
      const payUrl = `${frontendBase}/pay?token=${job.payToken}`;

      const formattedTotal = Number(job.totalAmount).toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
      });
      const formattedPaid = Number(amountPaid).toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
      });
      const formattedBalance = Number(balanceRemaining).toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
      });

      const paymentBusinessNumber = process.env.PAYMENT_CONTACT_NUMBER || "404-886-1996";

      const balanceSectionHtml =
        balanceRemaining > 0
          ? `
            <h3>Amount Due</h3>
            <p><strong>Total:</strong> ${formattedTotal}</p>
            ${amountPaid > 0 ? `<p><strong>Already Paid:</strong> ${formattedPaid}</p>` : ""}
            <p><strong>Balance Due:</strong> ${formattedBalance}</p>

            <p style="margin: 24px 0;">
              <a
                href="${payUrl}"
                style="background:#15803d;color:#ffffff;padding:12px 22px;border-radius:6px;text-decoration:none;font-weight:bold;display:inline-block;"
              >
                Pay Online
              </a>
            </p>

            <p style="font-size: 13px; color: #555;">
              Other ways to pay: Zelle, Venmo, or Cash App to <strong>${paymentBusinessNumber}</strong>, or check/cash in person.
            </p>
          `
          : `
            <h3>Receipt</h3>
            <p><strong>Total:</strong> ${formattedTotal}</p>
            <p style="color:#15803d;"><strong>Paid in full — thank you!</strong></p>
          `;

      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #222;">
          <h2>Chavez Tree Service</h2>

          <p>Hi ${client.name},</p>

          <p>Thank you for choosing Chavez Tree Service. Your job has been completed.</p>

          <hr />

          <p><strong>Job ID:</strong> ${job.id}</p>
          <p><strong>Service Address:</strong><br/>
            ${job.street}<br/>
            ${job.city}, ${job.state} ${job.zip}
          </p>

          <hr />

          ${balanceSectionHtml}

          <hr />

          <p>We'd really appreciate your feedback. How would you rate your experience?</p>

          <p style="font-size: 20px; line-height: 1.8;">
            <a href="${reviewBase}?token=${reviewToken}&rating=5">⭐️⭐️⭐️⭐️⭐️</a><br/>
            <a href="${reviewBase}?token=${reviewToken}&rating=4">⭐️⭐️⭐️⭐️</a><br/>
            <a href="${reviewBase}?token=${reviewToken}&rating=3">⭐️⭐️⭐️</a><br/>
            <a href="${reviewBase}?token=${reviewToken}&rating=2">⭐️⭐️</a><br/>
            <a href="${reviewBase}?token=${reviewToken}&rating=1">⭐️</a>
          </p>

          <p>We appreciate your business!</p>

          <p>Chavez Tree Service</p>
        </div>
      `;

      try {
        await sendEmail(
          client.email,
          `Receipt for Job #${job.id} — Chavez Tree Service`,
          emailHtml,
        );
      } catch (err) {
        console.error(`Receipt email failed for job #${job.id}:`, err);
        throw new Error("Failed to send the receipt email. Please try again.");
      }

      return job;
    },
  },

  createCheckoutSessionForToken: {
    type: CreateCheckoutSessionResultType,
    args: {
      token: { type: new GraphQLNonNull(GraphQLString) },
    },
    async resolve(parent, args) {
      const job = await Job.findOne({ where: { payToken: args.token } });
      if (!job) throw new Error("Invalid or expired payment link");

      if (job.status === "paid") {
        throw new Error("This invoice has already been paid in full");
      }

      if (job.status !== "completed") {
        throw new Error("This job isn't ready for payment yet");
      }

      const { balanceRemaining } = await getJobBalance(job);

      if (balanceRemaining <= 0) {
        await applyBalanceToJob(job);
        await job.save();
        throw new Error("This invoice has already been paid in full");
      }

      const client = await Client.findByPk(job.clientId);
      if (!client || !client.email) {
        throw new Error("Client information is missing for this job");
      }

      let session;
      try {
        session = await createCheckoutSessionForBalance(
          job,
          client,
          balanceRemaining,
          job.payToken,
        );
      } catch (err) {
        console.error(`Stripe checkout session creation failed for job #${job.id}:`, err);
        throw new Error("Failed to start payment. Please try again.");
      }

      return { checkoutUrl: session.url };
    },
  },
};

module.exports = paymentMutations;
