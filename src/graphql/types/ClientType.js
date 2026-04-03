const {
  GraphQLObjectType,
  GraphQLString,
  GraphQLList
} = require("graphql");

const JobType = require("./JobType");

const ClientType = new GraphQLObjectType({
  name: "Client",
  fields: () => ({
    id: { type: GraphQLString },
    name: { type: GraphQLString },
    email: { type: GraphQLString },
    phone: { type: GraphQLString },
    jobs: { type: new GraphQLList(JobType) },
  }),
});

module.exports = ClientType;