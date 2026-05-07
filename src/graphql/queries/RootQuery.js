//GraphQL core types
const {
  GraphQLObjectType,
  GraphQLList,
  GraphQLString,
  GraphQLInt,
  GraphQLFloat
} = require("graphql");

//graphQl return types
const ClientType = require("../types/ClientType");
const JobType = require("../types/JobType");
const ServiceType = require("../types/ServiceType");
const EmployeeType = require("../types/EmployeeType");

//DB models
const Client = require("../../models/Client");
const Job = require("../../models/Job");
const Service = require("../../models/Service");
const Feedback = require("../../models/Feedback");

/**
 * RootQuery defines all read-only GraphQL endpoints
 * This layer handles data fetching, aggregation, and admin analytics
 */
const RootQuery = new GraphQLObjectType({
  name: "RootQueryType",
  
  fields: () => ({

    //core entities

    clients: {
      type: new GraphQLList(ClientType),
      resolve() {
        //loads with associated jobs
        return Client.findAll({ include: Job });
      },
    },
    
    jobs: {
      type: new GraphQLList(JobType),
      resolve() {
        return Job.findAll();
      },
    },
   
    services: {
      type: new GraphQLList(ServiceType),
      resolve() {
        return Service.findAll();
      },
    },
    
    employees: {
      type: new GraphQLList(EmployeeType),
      resolve(parent, args, context) {
        if (!context.admin) throw new Error("Unauthorized");
        return require("../../models/Employee").findAll();
      },
    },
    

    totalJobs: {
      type: GraphQLInt,
      resolve(parent, args, context) {
        if (!context.admin) throw new Error("Unauthorized");
        return Job.count();
      },
    },
    
    jobsByStatus: {
      type: new GraphQLList(
        new GraphQLObjectType({
          name: "JobsByStatus",
          fields: {
            status: { type: GraphQLString },
            count: { type: GraphQLInt },
          },
        })
      ),
      async resolve(parent, args, context) {
        if (!context.admin) throw new Error("Unauthorized");
        
        //workflow states for status of job
        const statuses = [
          "pending_quote",
          "quote_scheduled",
          "scheduled",
          "in_progress",
          "completed",
          "paid",
          "cancelled",
        ];

        const result = [];

        //count jobs per status
        for (const status of statuses) {
          const count = await Job.count({ where: { status } });
          result.push({ status, count });
        }
        
        return result;
      },
    },
    //total clients
    totalClients: {
      type: GraphQLInt,
      resolve(parent, args, context) {
        if (!context.admin) throw new Error("Unauthorized");
        return Client.count();
      },
    },
    
    averageRating: {
      type: GraphQLFloat,
      async resolve(parent, args, context) {
        if (!context.admin) throw new Error("Unauthorized");
       
        const feedbacks = await Feedback.findAll();
        if (feedbacks.length === 0) return 0;
        
        const total = feedbacks.reduce((sum, f) => sum + f.rating, 0);
        return total / feedbacks.length;
      },
    },
  }),
});

module.exports = RootQuery;