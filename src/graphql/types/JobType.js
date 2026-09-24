//GraphQL core types
const {
  GraphQLObjectType,
  GraphQLString,
  GraphQLBoolean,
  GraphQLList,
  GraphQLFloat,
} = require("graphql");

//graphQl related types
const ServiceType = require("./ServiceType");
const FeedbackType = require("./FeedbackType");
const EmployeeType = require("./EmployeeType");
const JobPhotoType = require("./JobPhotoType");
const PaymentType = require("./PaymentType");

//DB models
const Client = require("../../models/Client");
const Feedback = require("../../models/Feedback");
const JobPhoto = require("../../models/JobPhoto");
const Payment = require("../../models/Payment");

//shared services
const { getJobBalance } = require("../../services/jobService");

/* Job GraphQL type */
const JobType = new GraphQLObjectType({
  name: "Job",

  fields: () => ({
    id: { type: GraphQLString },
    status: { type: GraphQLString },
    createdAt: { type: GraphQLString },
    scheduledDate: { type: GraphQLString },

    //job location details
    street: {
      type: GraphQLString,
      resolve: (parent, args, context) => (context.admin ? parent.street : null),
    },
    city: {
      type: GraphQLString,
      resolve: (parent, args, context) => (context.admin ? parent.city : null),
    },
    state: {
      type: GraphQLString,
      resolve: (parent, args, context) => (context.admin ? parent.state : null),
    },
    zip: {
      type: GraphQLString,
      resolve: (parent, args, context) => (context.admin ? parent.zip : null),
    },

    totalAmount: {
      type: GraphQLFloat,
      resolve: (parent, args, context) => (context.admin ? parent.totalAmount : null),
    },

    clientId: { type: GraphQLString },

    reviewRequested: { type: GraphQLBoolean },

    paymentRequested: { type: GraphQLBoolean },
    paidAt: { type: GraphQLString },

    quoteSent: { type: GraphQLBoolean },
    quoteSentAt: { type: GraphQLString },

    paymentLink: {
      type: GraphQLString,
      resolve: (parent, args, context) => {
        if (!context.admin || !parent.payToken) return null;
        const base = (process.env.FRONTEND_URL || "http://localhost:3000").replace(/\/$/, "");
        return `${base}/pay?token=${parent.payToken}`;
      },
    },

    amountPaid: {
      type: GraphQLFloat,
      resolve: async (parent, args, context) => {
        if (!context.admin) return null;
        const { amountPaid } = await getJobBalance(parent);
        return amountPaid;
      },
    },

    balanceRemaining: {
      type: GraphQLFloat,
      resolve: async (parent, args, context) => {
        if (!context.admin) return null;
        const { balanceRemaining } = await getJobBalance(parent);
        return balanceRemaining;
      },
    },

    payments: {
      type: new GraphQLList(PaymentType),
      resolve: (parent, args, context) => {
        if (!context.admin) return [];
        return Payment.findAll({
          where: { jobId: parent.id },
          order: [["createdAt", "ASC"]],
        });
      },
    },

    services: {
      type: new GraphQLList(ServiceType),

      resolve(parent) {
        return parent.getServices();
      },
    },

    feedback: {
      type: FeedbackType,

      resolve(parent) {
        return Feedback.findOne({ where: { jobId: parent.id } });
      },
    },

    photos: {
      type: new GraphQLList(JobPhotoType),

      async resolve(parent) {
        return JobPhoto.findAll({
          where: { jobId: parent.id },
          order: [["createdAt", "ASC"]],
        });
      },
    },

    employees: {
      type: new GraphQLList(EmployeeType),

      resolve(parent) {
        return parent.getEmployees();
      },
    },

    client: {
      type: require("./ClientType"),

      resolve(parent, args, context) {
        if (!context.admin) return null;
        return Client.findByPk(parent.clientId);
      },
    },
  }),
});

module.exports = JobType;