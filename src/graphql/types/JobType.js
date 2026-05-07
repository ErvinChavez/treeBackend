//shape of API object
const {
  //graphQL object structure
  GraphQLObjectType,
  //string, true/false fields
  GraphQLString,
  GraphQLBoolean,
  //array/list
  GraphQLList,
} = require("graphql");

//import related graphQL types
const ServiceType = require("./ServiceType");
const FeedbackType = require("./FeedbackType");
const EmployeeType = require("./EmployeeType");
const ClientType = require("./ClientType");

//import used models
const Client = require("../../models/Client");
const Feedback = require("../../models/Feedback");
const JobPhoto = require("../../models/JobPhoto");

//create graphQL of job
const JobType = new GraphQLObjectType({
  //GraphQL schema name
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
    //track if review email sent
    reviewRequested: { type: GraphQLBoolean },

    //job can have many services
    services: {
      //return array of services
      type: new GraphQLList(ServiceType),
      //fetch the DB data for services
      resolve(parent) {
        return parent.getServices();
      }
    },
    
    //job has one feedback
    feedback: {
      type: FeedbackType,
      //fetch DB data review for the job
      resolve(parent) {
        return Feedback.findOne({ where: { jobId: parent.id } });
      }
    },

    //job can have multiple images
    photos: {
      //return an array of image URLs
      type: new GraphQLList(GraphQLString),
      //fetch DB data photos for the job
      async resolve(parent) {
        const photos = await JobPhoto.findAll({
          where: { jobId: parent.id }
        });
        //extract only the url
        return photos.map(p => p.url);
      }
    },

    //job can have many-to-many employees
    employees: {
      //return an array of employees
      type: new GraphQLList(EmployeeType),
      //fetch DB data of the employees for the job
      resolve(parent) {
        return parent.getEmployees();
      }
    },

    //job has a client
    client: {
      //job belongs to this client
      type: ClientType,
      //fetch DB data of client
      resolve(parent) {
        return Client.findByPk(parent.clientId);
      }
    }
  }),
});

module.exports = JobType;