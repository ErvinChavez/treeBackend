//GraphQL core types
const {
  GraphQLObjectType,
  GraphQLString,
  GraphQLInt,
  GraphQLBoolean,
  GraphQLNonNull,
  GraphQLList,
} = require("graphql");

//security/utilities
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

//DB models
const Admin = require("../../models/Admin");
const Client = require("../../models/Client");
const Job = require("../../models/Job");
const Service = require("../../models/Service");
const Feedback = require("../../models/Feedback");
const Employee = require("../../models/Employee");

//shared services
const sendEmail = require("../../utils/email");
const { generateToken } = require("../../services/authService");
const { isValidStatusChange } = require("../../services/jobService");

//graphQl return types
const JobType = require("../types/JobType");
const FeedbackType = require("../types/FeedbackType");
const EmployeeType = require("../types/EmployeeType");
const ServiceType = require("../types/ServiceType");

/**
 * Root GraphQL Mutation layer
 * Handles authentication, business workflows, and database writes
 */
const Mutation = new GraphQLObjectType({
  name: "Mutation",
  fields: {
    //admin auth
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
        //prevent duplicate admin accounts
        const existing = await Admin.findOne({ where: { email: args.email } });
        if (existing) throw new Error("Admin already exists");

        //hash passwords before storing
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
    //services
    createService: {
      type: ServiceType,
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
      type: ServiceType,
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

        //create actual work request
        const job = await Job.create({
          clientId: client.id,
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

        //must follow the work flow process, prevents jumping status
        if (!isValidStatusChange(job.status, args.newStatus)) {
          throw new Error(`Invalid status transition`);
        }
        
        job.status = args.newStatus;
        await job.save();

        return job;
      },
    },

    //review system
    sendReviewRequest: {
      type: GraphQLBoolean,
      args: {
        jobId: { type: new GraphQLNonNull(GraphQLInt) },
      },
      async resolve(parent, args, context) {
        if (!context.admin) throw new Error("Unauthorized");
        
        const job = await Job.findByPk(args.jobId);
        if (!job) throw new Error("Job not found");
        
        if (job.reviewRequested) {
          throw new Error("Review already requested");
        }
        
        const client = await Client.findByPk(job.clientId);
        if (!client || !client.email) {
          throw new Error("Client email not found");
        }
        //email validation
        if (!client.email.includes("@")) {
          throw new Error("Invalid email");
        }

      const token = crypto.randomBytes(32).toString("hex");
    
      const frontendBase = process.env.FRONTEND_URL
        ? `${process.env.FRONTEND_URL}/review`
        : "http://localhost:3000/review";

   
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
      await sendEmail(
        client.email,
        "How did we do? Rate Chavez Tree Service",
        emailHtml
      );    
      
      
      job.reviewToken = token;
      job.reviewRequested = true;
      await job.save();

      return true;
    
    } catch (err) {
      console.error("Email failed:", err);
      throw new Error("Failed to send review email");
    }
      },
    },
   
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

        try {
          const feedback = await Feedback.create({
            jobId: job.id,
            rating: args.rating,
            comment: args.comment || "",
          });
          //if rating less then 4 send feedback to business email
          if (args.rating < 4) {
            try {
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

    //admin-auth can create/delete employees
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

    //admin-auth assign employees to job(many-to-many)
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