const {
  GraphQLNonNull,
  GraphQLList,
  GraphQLString,
  GraphQLInt,
  GraphQLFloat,
} = require("graphql");

//DB models
const Client = require("../../models/Client");
const Job = require("../../models/Job");
const Service = require("../../models/Service");

//shared services
const { sendEmail, sendQuoteNotification } = require("../../utils/email");
const { isValidStatusChange, applyBalanceToJob } = require("../../services/jobService");

//a quote can only be emailed before any work has started — once a job is
//scheduled/in progress/done, "quote" no longer applies
const QUOTABLE_STATUSES = ["pending_quote", "quote_scheduled"];

//graphql types
const JobType = require("../types/JobType");

//statuses admin may drop a manually-entered job straight into (e.g. a
//word-of-mouth job being entered after the work is already done)
const ADMIN_ENTRY_STATUSES = [
  "pending_quote",
  "quote_scheduled",
  "scheduled",
  "in_progress",
  "completed",
];

const jobMutations = {
  createQuoteRequest: {
    type: JobType,
    args: {
      clientName: { type: new GraphQLNonNull(GraphQLString) },
      clientEmail: { type: new GraphQLNonNull(GraphQLString) },
      clientPhone: { type: new GraphQLNonNull(GraphQLString) },
      street: { type: new GraphQLNonNull(GraphQLString) },
      city: { type: new GraphQLNonNull(GraphQLString) },
      state: { type: new GraphQLNonNull(GraphQLString) },
      zip: { type: new GraphQLNonNull(GraphQLString) },
      serviceIds: { type: new GraphQLList(GraphQLInt) },
      initialStatus: { type: GraphQLString },
      totalAmount: { type: GraphQLFloat },
    },

    async resolve(parent, args, context) {
      //find existing client by email
      let client = await Client.findOne({
        where: { email: args.clientEmail.toLowerCase() },
      });

      if (!client) {
        client = await Client.create({
          name: args.clientName,
          email: args.clientEmail.toLowerCase(),
          phone: args.clientPhone,
        });
      } else {
        if (args.clientName) client.name = args.clientName;
        if (args.clientPhone) client.phone = args.clientPhone;
        await client.save();
      }

      let initialStatus = "pending_quote";

      if (context.admin && args.initialStatus) {
        if (!ADMIN_ENTRY_STATUSES.includes(args.initialStatus)) {
          throw new Error(`Invalid initial status. Must be one of: ${ADMIN_ENTRY_STATUSES.join(", ")}`);
        }
        initialStatus = args.initialStatus;
      }

      //create work request
      const job = await Job.create({
        clientId: client.id,
        status: initialStatus,
        street: args.street,
        city: args.city,
        state: args.state,
        zip: args.zip,
        totalAmount: context.admin && args.totalAmount !== undefined ? args.totalAmount : null,
      });

      //attach services
      let services = [];

      if (args.serviceIds?.length > 0) {
        services = await Service.findAll({
          where: { id: args.serviceIds },
        });
        await job.setServices(services);
      }

      if (!context.admin) {
        try {
          await sendQuoteNotification({
            clientName: args.clientName,
            clientEmail: args.clientEmail,
            clientPhone: args.clientPhone,
            street: args.street,
            city: args.city,
            state: args.state,
            zip: args.zip,
            jobId: job.id,
            services: services.map((s) => s.name),
          });
        } catch (err) {
          //loud, unmistakable log so this shows up immediately in Render's logs
          console.error(
            `🚨 QUOTE NOTIFICATION EMAIL FAILED for job #${job.id} (client: ${args.clientEmail}). ` +
            `The quote request itself was saved successfully. Check Resend/email config. Error:`,
            err
          );
        }
      }

      return job;
    },
  },

  updateJobStatus: {
    type: JobType,
    args: {
      jobId: { type: new GraphQLNonNull(GraphQLInt) },
      newStatus: { type: new GraphQLNonNull(GraphQLString) },
    },
    async resolve(parent, args, context) {
      if (!context.admin) throw new Error("Unauthorized");

      const job = await Job.findByPk(args.jobId);
      if (!job) throw new Error("Job not found");

      //follow status flow rules
      if (!isValidStatusChange(job.status, args.newStatus)) {
        throw new Error(`Invalid status transition`);
      }

      job.status = args.newStatus;
      await job.save();

      return job;
    },
  },

  updateTotalAmount: {
    type: JobType,
    args: {
      jobId: { type: new GraphQLNonNull(GraphQLInt) },
      totalAmount: { type: new GraphQLNonNull(GraphQLFloat) },
    },

    async resolve(parent, args, context) {
      if (!context.admin) throw new Error("Unauthorized");

      const job = await Job.findByPk(args.jobId);
      if (!job) throw new Error("Job not Found");

      if (args.totalAmount < 0) {
        throw new Error("Total amount cannot be negative");
      }

      job.totalAmount = args.totalAmount;

      await applyBalanceToJob(job);
      await job.save();

      return job;
    },
  },

  sendQuoteEmail: {
    type: JobType,
    args: {
      jobId: { type: new GraphQLNonNull(GraphQLInt) },
    },
    async resolve(parent, args, context) {
      if (!context.admin) throw new Error("Unauthorized");

      const job = await Job.findByPk(args.jobId);
      if (!job) throw new Error("Job not found");

      if (!QUOTABLE_STATUSES.includes(job.status)) {
        throw new Error("Quotes can only be sent before work is scheduled");
      }

      if (job.totalAmount === null || job.totalAmount === undefined) {
        throw new Error("Enter an estimated amount before sending the quote");
      }

      const client = await Client.findByPk(job.clientId);
      if (!client || !client.email || !client.email.includes("@")) {
        throw new Error("A valid client email is required");
      }

      const services = await job.getServices();

      const formattedTotal = Number(job.totalAmount).toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
      });

      const paymentBusinessNumber = process.env.PAYMENT_CONTACT_NUMBER || "404-886-1996";

      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #222;">
          <h2>Chavez Tree Service</h2>

          <p>Hi ${client.name},</p>

          <p>Thanks for reaching out! Here's the estimate for the work you asked about.</p>

          <hr />

          <p><strong>Service Address:</strong><br/>
            ${job.street}<br/>
            ${job.city}, ${job.state} ${job.zip}
          </p>

          ${services.length > 0 ? `<p><strong>Work Requested:</strong> ${services.map((s) => s.name).join(", ")}</p>` : ""}

          <hr />

          <h3>Estimated Cost</h3>
          <p style="font-size: 20px; font-weight: bold;">${formattedTotal}</p>
          <p style="font-size: 13px; color: #555;">
            This is an estimate only — nothing is due, and you're not being billed for anything.
          </p>

          <hr />

          <p>
            Ready to move forward, or have questions? Give us a call at
            <strong>${paymentBusinessNumber}</strong> and we'll get you on the schedule.
          </p>

          <p>Thanks for considering us!</p>

          <p>Chavez Tree Service</p>
        </div>
      `;

      try {
        await sendEmail(
          client.email,
          `Your Estimate from Chavez Tree Service`,
          emailHtml,
        );
      } catch (err) {
        console.error(`Quote email failed for job #${job.id}:`, err);
        throw new Error("Failed to send the quote email. Please try again.");
      }

      job.quoteSent = true;
      job.quoteSentAt = new Date();
      await job.save();

      return job;
    },
  },
};

module.exports = jobMutations;