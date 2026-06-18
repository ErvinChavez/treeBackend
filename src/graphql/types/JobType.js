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

//DB models
const Client = require("../../models/Client");
const Feedback = require("../../models/Feedback");
const JobPhoto = require("../../models/JobPhoto");

/**
 * Job GraphQL type
 * Represents the core business workflow entity
 * Includes relationships to services, employees, feedback, and media
 */
const JobType = new GraphQLObjectType({
  name: "Job",

  //wrapped in a function to avoid circular dependency issues
  fields: () => ({
    id: { type: GraphQLString },
    status: { type: GraphQLString },
    createdAt: { type: GraphQLString },
    scheduledDate: { type: GraphQLString },

    //job location details
    street: { type: GraphQLString },
    city: { type: GraphQLString },
    state: { type: GraphQLString },
    zip: { type: GraphQLString },

    totalAmount: { type: GraphQLFloat },

    clientId: { type: GraphQLString },

    //track if review email sent
    reviewRequested: { type: GraphQLBoolean },

    /**
     * Many-to-many relationship:
     * Job to/from Services
     */
    services: {
      type: new GraphQLList(ServiceType),

      resolve(parent) {
        return parent.getServices();
      },
    },

    /**
     * One-to-one relationship:
     * Job to/from Feedback
     */
    feedback: {
      type: FeedbackType,

      resolve(parent) {
        return Feedback.findOne({ where: { jobId: parent.id } });
      },
    },

    /**
     * Job photo gallery
     * Returns only image URLs for frontend rendering
     */
    photos: {
      type: new GraphQLList(GraphQLString),

      async resolve(parent) {
        const photos = await JobPhoto.findAll({
          where: { jobId: parent.id },
          order: [["createdAt", "ASC"]],
        });

        return photos.map((p) => p.url);
      },
    },

    /**
     * Many-to-many relationship:
     * Job to/from Employees
     */
    employees: {
      type: new GraphQLList(EmployeeType),

      resolve(parent) {
        return parent.getEmployees();
      },
    },

    /**
     * Many-to-one relationship:
     * Job to/from Client
     */
    client: {
      type: require("./ClientType"),

      resolve(parent) {
        return Client.findByPk(parent.clientId);
      },
    },
  }),
});

module.exports = JobType;
