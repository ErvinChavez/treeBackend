//import graphQLschema
const { GraphQLSchema } = require('graphql');

//import of all READ operations, used to FETCH data
const RootQuery = require("./graphql/queries/RootQuery");
//import to WRITE operations, used to change data
const Mutation = require("./graphql/mutations/Mutation");

//export the full graphQL API structure
module.exports = new GraphQLSchema({
    //all readable entry points
    query: RootQuery,
    //all writable entry points
    mutation: Mutation,
});