//define shape of GraphQL API
const {
  //creates GraphQL object
  GraphQLObjectType,
  //scalar types: string,number,true/false 
  GraphQLString,
  GraphQLInt,
  GraphQLBoolean,
  //required fields frontend must provide
  GraphQLNonNull,
  //array/list
  GraphQLList,
} = require("graphql");

//password hashing
const bcrypt = require("bcryptjs");
//random token generation security for review links
const crypto = require("crypto");
//DB tables
const Admin = require("../../models/Admin");
const Client = require("../../models/Client");
const Job = require("../../models/Job");
const Service = require("../../models/Service");
const Feedback = require("../../models/Feedback");
const Employee = require("../../models/Employee");
//abstracts email logic for reusable service
const sendEmail = require("../../utils/email");
//JWT logic
const { generateToken } = require("../../services/authService");
//job status 
const { isValidStatusChange } = require("../../services/jobService");
//graphQl return types, what frontend receives back
const JobType = require("../types/JobType");
const FeedbackType = require("../types/FeedbackType");
const EmployeeType = require("../types/EmployeeType");

//main mutation object
const Mutation = new GraphQLObjectType({
  name: "Mutation",
  //every field, a graphQL mutation endpoint
  fields: {
    //admin account creation
    registerAdmin: {
      type: GraphQLString,
      args: {
        email: { type: new GraphQLNonNull(GraphQLString) },
        password: { type: new GraphQLNonNull(GraphQLString) },
      },
      async resolve(parent, args) {
        //block in production, prevent randon admin creation publicly
        if (process.env.NODE_ENV === "production") {
          throw new Error("Admin registration is disabled")
        }
        //prevent duplicate accounts
        const existing = await Admin.findOne({ where: { email: args.email } });
        if (existing) throw new Error("Admin already exists");
        //prevent storing plain passwords
        const hashedPassword = await bcrypt.hash(args.password, 10);

        await Admin.create({
          email: args.email,
          password: hashedPassword,
        });
        return "Admin registered successfully";
      },
    },
    //login admin
    loginAdmin: {
      type: GraphQLString,
      args: {
        email: { type: new GraphQLNonNull(GraphQLString) },
        password: { type: new GraphQLNonNull(GraphQLString) },
      },
      async resolve(parent, args) {
        //find admin by email
        const admin = await Admin.findOne({ where: { email: args.email } });
        if (!admin) throw new Error("Invalid credentials");
        //compare password vs hashed password
        const isMatch = await bcrypt.compare(args.password, admin.password);
        if (!isMatch) throw new Error("Invalid credentials");
        //return auth token to frontend
        return generateToken(admin);
      },
    },
    //protected admin-only mutation
    createService: {
      type: require("../types/ServiceType"),
      args: {
        name: { type: new GraphQLNonNull(GraphQLString) },
        description: { type: GraphQLString },
      },
      async resolve(parent, args, context) {
        //auth check guard system
        if (!context.admin) throw new Error("Unauthorized");
        //simple sequelize insertion 
        return Service.create({
          name: args.name,
          description: args.description,
        });
      },
    },
    //update existing service
    updateService: {
      type: require("../types/ServiceType"),
      args: {
        id: { type: new GraphQLNonNull(GraphQLInt) },
        name: { type: GraphQLString },
        description: { type: GraphQLString },
      },
      async resolve(parent, args, context) {
        //auth check
        if (!context.admin) throw new Error("Unauthorized");
        //find service by primary key
        const service = await Service.findByPk(args.id);
        //throw error to catch if service not found
        if (!service) throw new Error("Service not found");
        //update only provided fields
        if (args.name) service.name = args.name;
        if (args.description) service.description = args.description;
        //save that service
        await service.save();
        //return to frontend
        return service;
      },
    },
    //delete service
    deleteService: {
      type: GraphQLString,
      args: {
        id: { type: new GraphQLNonNull(GraphQLInt) },
      },
      async resolve(parent, args, context) {
        //auth check
        if (!context.admin) throw new Error("Unauthorized");
        //find service by primary key
        const service = await Service.findByPk(args.id);
        //throw error to catch if not found
        if (!service) throw new Error("Service not found");
        //delete that service
        await service.destroy();
        //confirm deletion in frontend
        return "Service deleted successfully";
      },
    },
    //Lead intake pipeline
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
        //find existing client by email
        let client = await Client.findOne({
          where: { email: args.clientEmail.toLowerCase() },
        });
        //if no existing client
        if (!client) {
          //create a new client
          client = await Client.create({
            name: args.clientName,
            email: args.clientEmail.toLowerCase(),
            phone: args.clientPhone,
          });
        } else {
          //if existing, update info
          if (args.clientName) client.name = args.clientName;
          if (args.clientPhone) client.phone = args.clientPhone;
          await client.save();
        }
        //create actual work request
        const job = await Job.create({
          clientId: client.id,
          //start at initial status
          status: "pending_quote",
          street: args.street,
          city: args.city,
          state: args.state,
          zip: args.zip,
        });
        //attach the services
        if (args.serviceIds?.length > 0) {
          const services = await Service.findAll({
            where: { id: args.serviceIds },
          });
          await job.addServices(services);
        }

        return job;
      },
    },
    //update job status work flow
    updateJobStatus: {
      type: JobType,
      args: {
        jobId: { type: new GraphQLNonNull(GraphQLInt) },
        newStatus: { type: new GraphQLNonNull(GraphQLString) },
      },
      async resolve(parent, args, context) {
        if (!context.admin) throw new Error("Unauthorized");
        //find job by primary key
        const job = await Job.findByPk(args.jobId);
        //throw error to catch
        if (!job) throw new Error("Job not found");
        //must follow the work flow process, prevents jumping statuses
        if (!isValidStatusChange(job.status, args.newStatus)) {
          throw new Error(`Invalid status transition`);
        }
        //update to the next status
        job.status = args.newStatus;
        //save it to the job
        await job.save();

        return job;
      },
    },
    //send a review request to job client at completed
    sendReviewRequest: {
      type: GraphQLBoolean,
      args: {
        jobId: { type: new GraphQLNonNull(GraphQLInt) },
      },
      async resolve(parent, args, context) {
        if (!context.admin) throw new Error("Unauthorized");
        //find job by primary key
        const job = await Job.findByPk(args.jobId);
        if (!job) throw new Error("Job not found");
        // Prevent duplicate requests
        if (job.reviewRequested) {
          throw new Error("Review already requested");
        }
        //find client by primary key
        const client = await Client.findByPk(job.clientId);
        //throw error to catch if not client or client email found
        if (!client || !client.email) {
        throw new Error("Client email not found");
        }
        //email validation
        if (!client.email.includes("@")) {
          throw new Error("Invalid email");
        }

    //generate secure token
    const token = crypto.randomBytes(32).toString("hex");
    //create a clickable email review link
    const frontendBase = process.env.FRONTEND_URL
      ? `${process.env.FRONTEND_URL}/review`
      : "http://localhost:3000/review";

    //email template
    const emailHtml = `
      <p>Hi ${client.name}, thanks for using Chavez Tree Service!</p>
      <p>How would you rate your experience?</p>

      <p>
        <a href="${frontendBase}?token=${token}&rating=5">⭐️⭐️⭐️⭐️⭐️</a><br/>
        <a href="${frontendBase}?token=${token}&rating=4">⭐️⭐️⭐️⭐️</a><br/>
        <a href="${frontendBase}?token=${token}&rating=3">⭐️⭐️⭐️</a><br/>
        <a href="${frontendBase}?token=${token}&rating=2">⭐️⭐️</a><br/>
        <a href="${frontendBase}?token=${token}&rating=1">⭐️</a>
      </p>

      <p>We appreciate your feedback!</p>
    `;

    try {
      //send email with, client email, subject, email template
      await sendEmail(
        client.email,
        "How did we do? Rate Chavez Tree Service",
        emailHtml
      );    
      
      //save token to job
      job.reviewToken = token;
      //change reviewRequested to true
      job.reviewRequested = true;
      //save to job
      await job.save();

      return true;
    
    } catch (err) {
      console.error("Email failed:", err);
      throw new Error("Failed to send review email");
    }
      },
    },
    //submission of feedback
    submitFeedback: {
      type: FeedbackType,
      args: {
        token: { type: new GraphQLNonNull(GraphQLString) },
        rating: { type: new GraphQLNonNull(GraphQLInt) },
        comment: { type: GraphQLString },
      },
      async resolve(parent, args) {
        //find review request securely
        const job = await Job.findOne({
          where: { reviewToken: args.token},
        });
        //validate job condition
        if (!job || job.status !== "completed" || !job.reviewRequested) {
          throw new Error("Invalid or expired review link")
        }
        //rating validation
        if (args.rating < 1 || args.rating > 5) {
          throw new Error("Invalid rating");
        }
        //prevent multiple reviews per job
        const existing = await Feedback.findOne({
          where: { jobId: job.id },
        });
      
        if (existing) {
          throw new Error("Feedback already submitted");
        }
        //create the feedback
        try {
          const feedback = await Feedback.create({
            jobId: job.id,
            rating: args.rating,
            comment: args.comment || "",
          });
          //if rating less then 4
          if (args.rating < 4) {
            try {
              //send feedback to business email
              await sendEmail(
                process.env.EMAIL_USER,
                `Low Rating Feedback - Job #${job.id}`,
                `
                  <h2>New Low Rating Feedback</h2>
                  <p><strong>Job ID:</strong> ${job.id}</p>
                  <p><strong>Rating:</strong> ${args.rating}</p>
                  <p><strong>Comment:</strong></p>
                  <p>${args.comment || "No comment provided"}</p>
                ` 
              );
            } catch (emailErr) {
              console.error("Email failed:", emailErr);
            } 
          }

          //invalidate token AFTER successful submission
          job.reviewToken = null;
          await job.save();
          
          return feedback;

        } catch (err) {
          if (err.name === "SequelizeUniqueConstraintError") {
            throw new Error("Feedback already submitted")
          }

          console.log("Submit feedback error:", err );
          throw new Error("Something went wrong submitting feedback");
        }
      },
    },
    //create an employee from admin
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
    //assign employees to job(many-to-many)
    assignEmployeesToJob: {
      type: JobType,
      args: {
        jobId: { type: new GraphQLNonNull(GraphQLInt) },
        employeeIds: { type: new GraphQLList(GraphQLInt) },
      },
      async resolve(parent, args, context) {
        //auth admin
        if (!context.admin) throw new Error("Unauthorized");
        //find job by primary key
        const job = await Job.findByPk(args.jobId);
        //throw error to catch in no job found
        if (!job) throw new Error("Job not found");
        //find employees by primary key
        const employees = await Employee.findAll({
          where: { id: args.employeeIds },
        });
        //add employees to the job
        await job.setEmployees(employees);
        //return the job updated
        return job;
      },
    },
  },
});

module.exports = Mutation;