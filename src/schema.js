//import graphQLschema
const { GraphQLSchema } = require('graphql');

//READ operations, used to fetch data
const RootQuery = require("./graphql/queries/RootQuery");
//WRITE operations, used to change data
const Mutation = require("./graphql/mutations");

//export the full graphQL API structure
module.exports = new GraphQLSchema({
    //all readable entry points
    query: RootQuery,
    //all writable entry points
    mutation: Mutation,
});