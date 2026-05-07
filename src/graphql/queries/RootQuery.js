const {
  //create graphQL object structure
  GraphQLObjectType,
  //array of items
  GraphQLList,
  //scalar types: string. integer, true/false
  GraphQLString,
  GraphQLInt,
  GraphQLFloat
} = require("graphql");

//fields each object contains
const ClientType = require("../types/ClientType");
const JobType = require("../types/JobType");
const ServiceType = require("../types/ServiceType");
const EmployeeType = require("../types/EmployeeType");

//imports used for sequelize DB queries
const Client = require("../../models/Client");
const Job = require("../../models/Job");
const Service = require("../../models/Service");
const Feedback = require("../../models/Feedback");

//create the root query layer
const RootQuery = new GraphQLObjectType({
  //internal GraphQL naming
  name: "RootQueryType",
  //fields: every graphQL query endpoint
  fields: () => ({
    //allows frontend to request all clients
    clients: {
      //and array of clienttype objects
      type: new GraphQLList(ClientType),
      //DB fetch data logic for all clients that include the job
      resolve() {
        //loads with associated jobs
        return Client.findAll({ include: Job });
      },
    },
    //return all jobs
    jobs: {
      type: new GraphQLList(JobType),
      //DB fetch data logic for all jobs
      resolve() {
        return Job.findAll();
      },
    },
    //return all services
    services: {
      type: new GraphQLList(ServiceType),
      //DB fetch data logic for all services
      resolve() {
        return Service.findAll();
      },
    },
    //return all employees
    employees: {
      type: new GraphQLList(EmployeeType),
      //DB fetch data logic to return all employees if admin
      resolve(parent, args, context) {
        //check JWT-auth if admin first
        if (!context.admin) throw new Error("Unauthorized");
        return require("../../models/Employee").findAll();
      },
    },
    //return the number of jobs
    totalJobs: {
      //a single number
      type: GraphQLInt,
      //DB fetch data logic to return number of jobs if admin
      resolve(parent, args, context) {
        //check JWT-auth if admin first
        if (!context.admin) throw new Error("Unauthorized");
        //return the count of total jobs
        return Job.count();
      },
    },
    //Return an array of status summary objects
    jobsByStatus: {
      //response will be an array
      type: new GraphQLList(
        //defines the shape of the objects inside the array
        new GraphQLObjectType({
          //internal name for the specific data type
          name: "JobsByStatus",
          //the data keys inside each object
          fields: {
            status: { type: GraphQLString },
            count: { type: GraphQLInt },
          },
        })
      ),
      async resolve(parent, args, context) {
        //auth if admin
        if (!context.admin) throw new Error("Unauthorized");
        //workflow sates
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
          //push to result object
          result.push({ status, count });
        }
        //return the result status
        return result;
      },
    },
    //total clients
    totalClients: {
      type: GraphQLInt,
      resolve(parent, args, context) {
        //auth admin
        if (!context.admin) throw new Error("Unauthorized");
        //return count
        return Client.count();
      },
    },
    //average rating
    averageRating: {
      type: GraphQLFloat,
      async resolve(parent, args, context) {
        //auth admin
        if (!context.admin) throw new Error("Unauthorized");
        //get all reviews
        const feedbacks = await Feedback.findAll();
        //if none return 0
        if (feedbacks.length === 0) return 0;
        //calculate average
        const total = feedbacks.reduce((sum, f) => sum + f.rating, 0);
        return total / feedbacks.length;
      },
    },
  }),
});

module.exports = RootQuery;