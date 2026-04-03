const {
  GraphQLObjectType,
  GraphQLString,
  GraphQLList
} = require("graphql");

const ServiceType = require("./ServiceType");
const FeedbackType = require("./FeedbackType");
const EmployeeType = require("./EmployeeType");
const ClientType = require("./ClientType");

const Client = require("../../models/Client");
const Feedback = require("../../models/Feedback");
const JobPhoto = require("../../models/JobPhoto");

const JobType = new GraphQLObjectType({
  name: "Job",
  fields: () => ({
    id: { type: GraphQLString },
    status: { type: GraphQLString },
    createdAt: { type: GraphQLString },
    scheduledDate: { type: GraphQLString },
    street: { type: GraphQLString },
    city: { type: GraphQLString },
    state: { type: GraphQLString },
    zip: { type: GraphQLString },
    clientId: { type: GraphQLString },

    services: {
      type: new GraphQLList(ServiceType),
      resolve(parent) {
        return parent.getServices();
      }
    },

    feedback: {
      type: FeedbackType,
      resolve(parent) {
        return Feedback.findOne({ where: { jobId: parent.id } });
      }
    },

    photos: {
      type: new GraphQLList(GraphQLString),
      async resolve(parent) {
        const photos = await JobPhoto.findAll({
          where: { jobId: parent.id }
        });
        return photos.map(p => p.url);
      }
    },

    employees: {
      type: new GraphQLList(EmployeeType),
      resolve(parent) {
        return parent.getEmployees();
      }
    },

    client: {
      type: require("./ClientType"),
      resolve(parent) {
        return Client.findByPk(parent.clientId);
      }
    }
  }),
});

module.exports = JobType;