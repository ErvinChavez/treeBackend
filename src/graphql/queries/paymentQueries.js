const {
  GraphQLNonNull,
  GraphQLString,
  GraphQLBoolean,
  GraphQLFloat,
  GraphQLObjectType,
} = require("graphql");

const Job = require("../../models/Job");
const Client = require("../../models/Client");
const { retrieveCheckoutSession } = require("../../services/paymentService");
const { getJobBalance } = require("../../services/jobService");

/* Public payment confirmation, sourced directly from Stripe */
const PaymentStatusType = new GraphQLObjectType({
  name: "PaymentStatus",
  fields: {
    paid: { type: GraphQLBoolean },
    amountTotal: { type: GraphQLFloat },
    jobId: { type: GraphQLString },
  },
});

/* Public invoice summary for the /pay page — no admin-only fields */
const JobPaymentInfoType = new GraphQLObjectType({
  name: "JobPaymentInfo",
  fields: {
    jobId: { type: GraphQLString },
    clientName: { type: GraphQLString },
    serviceAddress: { type: GraphQLString },
    totalAmount: { type: GraphQLFloat },
    amountPaid: { type: GraphQLFloat },
    balanceRemaining: { type: GraphQLFloat },
    paid: { type: GraphQLBoolean },
  },
});

const paymentQueries = {
  paymentStatus: {
    type: PaymentStatusType,
    args: {
      sessionId: { type: new GraphQLNonNull(GraphQLString) },
    },
    async resolve(parent, args) {
      let session;

      try {
        session = await retrieveCheckoutSession(args.sessionId);
      } catch (err) {
        throw new Error("Payment session not found");
      }

      return {
        paid: session.payment_status === "paid",
        amountTotal: session.amount_total != null ? session.amount_total / 100 : null,
        jobId: session.metadata?.jobId || null,
      };
    },
  },

  jobPaymentInfo: {
    type: JobPaymentInfoType,
    args: {
      token: { type: new GraphQLNonNull(GraphQLString) },
    },
    async resolve(parent, args) {
      const job = await Job.findOne({ where: { payToken: args.token } });
      if (!job) throw new Error("Invalid or expired payment link");

      const client = await Client.findByPk(job.clientId);
      const { amountPaid, balanceRemaining } = await getJobBalance(job);

      return {
        jobId: String(job.id),
        clientName: client?.name || "",
        serviceAddress: `${job.street}, ${job.city}, ${job.state} ${job.zip}`,
        totalAmount: Number(job.totalAmount || 0),
        amountPaid,
        balanceRemaining,
        paid: job.status === "paid",
      };
    },
  },
};

module.exports = paymentQueries;
