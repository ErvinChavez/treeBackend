//GraphQL core types
const {
  GraphQLObjectType,
  GraphQLString,
  GraphQLList
} = require("graphql");

const JobType = require("./JobType");

/**
 * Client GraphQL type
 * Represents customer data and related job records
 */
const ClientType = new GraphQLObjectType({
  name: "Client",
  
  // wrapped in a function to prevent circular dependency issues
  fields: () => ({
    id: { type: GraphQLString },
    name: { type: GraphQLString },
    email: { type: GraphQLString },
    phone: { type: GraphQLString },

    //client can have many jobs(one-to-many)
    jobs: { type: new GraphQLList(require("./JobType")) },
  }),
});

module.exports = ClientType;