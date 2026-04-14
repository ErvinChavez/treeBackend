const {
  GraphQLObjectType,
  GraphQLString,
  GraphQLNonNull,
  GraphQLInt,
  GraphQLList,
  GraphQLBoolean
} = require("graphql");

const bcrypt = require("bcryptjs");

const Admin = require("../../models/Admin");
const Client = require("../../models/Client");
const Job = require("../../models/Job");
const Service = require("../../models/Service");
const Feedback = require("../../models/Feedback");
const Employee = require("../../models/Employee");

const sendEmail = require("../../utils/email");
const { generateToken } = require("../../services/authService");
const { isValidStatusChange } = require("../../services/jobService");

const JobType = require("../types/JobType");
const FeedbackType = require("../types/FeedbackType");
const EmployeeType = require("../types/EmployeeType");

//Mutations
const Mutation = new GraphQLObjectType({
  name: "Mutation",
  fields: {

    registerAdmin: {
      type: GraphQLString,
      args: {
        email: { type: new GraphQLNonNull(GraphQLString) },
        password: { type: new GraphQLNonNull(GraphQLString) },
      },
      async resolve(parent, args) {
        const existing = await Admin.findOne({ where: { email: args.email } });
        if (existing) throw new Error("Admin already exists");

        const hashedPassword = await bcrypt.hash(args.password, 10);

        await Admin.create({
          email: args.email,
          password: hashedPassword,
        });

        return "Admin registered successfully";
      },
    },

    loginAdmin: {
      type: GraphQLString,
      args: {
        email: { type: new GraphQLNonNull(GraphQLString) },
        password: { type: new GraphQLNonNull(GraphQLString) },
      },
      async resolve(parent, args) {
        const admin = await Admin.findOne({ where: { email: args.email } });
        if (!admin) throw new Error("Invalid credentials");

        const isMatch = await bcrypt.compare(args.password, admin.password);
        if (!isMatch) throw new Error("Invalid credentials");

        return generateToken(admin);
      },
    },

    createService: {
      type: require("../types/ServiceType"),
      args: {
        name: { type: new GraphQLNonNull(GraphQLString) },
        description: { type: GraphQLString },
      },
      async resolve(parent, args, context) {
      if (!context.admin) throw new Error("Unauthorized");

      return Service.create({
        name: args.name,
        description: args.description,
      });
      },
    },

    updateService: {
      type: require("../types/ServiceType"),
      args: {
        id: { type: new GraphQLNonNull(GraphQLInt) },
        name: { type: GraphQLString },
        description: { type: GraphQLString },
      },
      async resolve(parent, args, context) {
      if (!context.admin) throw new Error("Unauthorized");

      const service = await Service.findByPk(args.id);
      if (!service) throw new Error("Service not found");

      if (args.name) service.name = args.name;
      if (args.description) service.description = args.description;

      await service.save();
      return service;
      },
    },

    deleteService: {
      type: GraphQLString,
      args: {
        id: { type: new GraphQLNonNull(GraphQLInt) },
      },
      async resolve(parent, args, context) {
      if (!context.admin) throw new Error("Unauthorized");

      const service = await Service.findByPk(args.id);
      if (!service) throw new Error("Service not found");

      await service.destroy();
      return "Service deleted successfully";
      },
    },

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
      },

      async resolve(parent, args) {
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

        const job = await Job.create({
          clientId: client.id,
          status: "pending_quote",
          street: args.street,
          city: args.city,
          state: args.state,
          zip: args.zip,
        });

        if (args.serviceIds?.length > 0) {
          const services = await Service.findAll({
            where: { id: args.serviceIds },
          });
          await job.addServices(services);
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

        if (!isValidStatusChange(job.status, args.newStatus)) {
          throw new Error(`Invalid status transition`);
        }

        job.status = args.newStatus;
        await job.save();

        return job;
      },
    },

    sendReviewRequest: {
      type: GraphQLBoolean,
      args: {
        jobId: { type: new GraphQLNonNull(GraphQLInt) },
      },
      async resolve(parent, args, context) {
    if (!context.admin) throw new Error("Unauthorized");

    const job = await Job.findByPk(args.jobId);
    if (!job) throw new Error("Job not found");

    // Prevent duplicate requests
    if (job.reviewRequested) {
      return false;
    }

    const client = await Client.findByPk(job.clientId);
    if (!client || !client.email) {
      throw new Error("Client email not found");
    }

    if (!client.email.includes("@")) {
    throw new Error("Invalid email");
}

    const frontendBase = process.env.FRONTEND_URL
  ? `${process.env.FRONTEND_URL}/review`
  : "http://localhost:3000/review";

    const emailHtml = `
      <p>Hi ${client.name}, thanks for using Chavez Tree Service!</p>
      <p>How would you rate your experience?</p>

      <p>
        <a href="${frontendBase}?jobId=${job.id}&rating=5">⭐️⭐️⭐️⭐️⭐️</a><br/>
        <a href="${frontendBase}?jobId=${job.id}&rating=4">⭐️⭐️⭐️⭐️</a><br/>
        <a href="${frontendBase}?jobId=${job.id}&rating=3">⭐️⭐️⭐️</a><br/>
        <a href="${frontendBase}?jobId=${job.id}&rating=2">⭐️⭐️</a><br/>
        <a href="${frontendBase}?jobId=${job.id}&rating=1">⭐️</a>
      </p>

      <p>We appreciate your feedback!</p>
    `;

    console.log("📧 Sending review email to:", client.email);

    try {
      await sendEmail(
        client.email,
        "How did we do? Rate Chavez Tree Service",
          emailHtml
      );
    } catch (err) {
      console.error("Email failed but continuing:", err.message);
    }

    // Mark as sent
    job.reviewRequested = true;
    await job.save();

    return true;
      },
    },

    submitFeedback: {
      type: FeedbackType,
      args: {
        jobId: { type: new GraphQLNonNull(GraphQLInt) },
        rating: { type: new GraphQLNonNull(GraphQLInt) },
        comment: { type: GraphQLString },
      },
      async resolve(parent, args) {
        const job = await Job.findByPk(args.jobId);
        if (!job) throw new Error("Job not found");

        const feedback = await Feedback.findOne({
          where: { jobId: job.id },
        });

        if (!feedback) throw new Error("Feedback record not found");

        feedback.rating = args.rating;
        feedback.comment = args.comment || "";

        if (args.rating >= 4) {
          feedback.googleReviewLink =
            "https://g.page/r/CeBcAA5Lxo0aEBM/review";
        } else {
          feedback.googleReviewLink = null;
        }

        await feedback.save();
        return feedback;
      },
    },

    createEmployee: {
      type: EmployeeType,
      args: {
        name: { type: new GraphQLNonNull(GraphQLString) },
        email: { type: GraphQLString },
        phone: { type: GraphQLString },
      },
      resolve(parent, args, context) {
        if (!context.admin) throw new Error("Unauthorized");

        return Employee.create(args);
      },
    },

    assignEmployeesToJob: {
      type: JobType,
      args: {
        jobId: { type: new GraphQLNonNull(GraphQLInt) },
        employeeIds: { type: new GraphQLList(GraphQLInt) },
      },
      async resolve(parent, args, context) {
        if (!context.admin) throw new Error("Unauthorized");

        const job = await Job.findByPk(args.jobId);
        if (!job) throw new Error("Job not found");

        const employees = await Employee.findAll({
          where: { id: args.employeeIds },
        });

        await job.setEmployees(employees);
        return job;
      },
    },
  },
});

module.exports = Mutation;