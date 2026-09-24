const {
  GraphQLObjectType,
  GraphQLString,
  GraphQLFloat,
} = require("graphql");

/**
 * Payment GraphQL type
 * One entry in a job's payment log (any method)
 */
const PaymentType = new GraphQLObjectType({
  name: "Payment",

  fields: () => ({
    id: { type: GraphQLString },
    jobId: { type: GraphQLString },
    method: { type: GraphQLString },
    amount: { type: GraphQLFloat },
    note: { type: GraphQLString },
    createdAt: { type: GraphQLString },
  }),
});

module.exports = PaymentType;
