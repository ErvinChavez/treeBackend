const { GraphQLObjectType } = require("graphql");

const analyticsQueries = require("./analyticsQueries");
const clientQueries = require("./clientQueries");

const RootQuery = new GraphQLObjectType({
  name: "RootQueryType",

  fields: () => ({
    ...analyticsQueries,
    ...clientQueries,
  }),
});
