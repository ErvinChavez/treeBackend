//shape of the API object
const {
  //an object structure
  GraphQLObjectType,
  //string fields
  GraphQLString,
  //arrays/lists
  GraphQLList
} = require("graphql");

//import related type
const JobType = require("./JobType");
//graphQl of a cleint
const ClientType = new GraphQLObjectType({
  //graphQl schema name
  name: "Client",
  //value function wrapped to allow loading from client and job first
  fields: () => ({
    id: { type: GraphQLString },
    name: { type: GraphQLString },
    email: { type: GraphQLString },
    phone: { type: GraphQLString },
    //client can have many jobs
    jobs: { type: new GraphQLList(JobType) },
  }),
});

module.exports = ClientType;