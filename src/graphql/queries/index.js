const { GraphQLObjectType } = require("graphql");

const analyticsQueries = require("./analyticsQueries");
const clientQueries = require("./clientQueries");
const employeeQueries = require("./employeeQueries");
const jobQueries = require("./jobQueries");

const RootQuery = new GraphQLObjectType({
  name: "RootQueryType",

  fields: () => ({
    ...analyticsQueries,
    ...clientQueries,
    ...employeeQueries,
    ...jobQueries,
  }),
});
