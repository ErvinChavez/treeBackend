const { GraphQLSchema } = require('graphql');

//Root Query
const RootQuery = require("./graphql/queries/RootQuery");
//Mutations
const Mutation = require("./graphql/mutations/Mutation");

module.exports = new GraphQLSchema({
    query: RootQuery,
    mutation: Mutation,
});