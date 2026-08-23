//GraphQL core types
const {
    GraphQLObjectType,
    GraphQLString,
    GraphQLBoolean
} = require("graphql");

/**
 * Employee GraphQL type
 * Represents employee contact and identification data
 */
const EmployeeType = new GraphQLObjectType({
    name: 'Employee',
    
    //wrapped in a function for consistency and future relationship expansion
    fields: () => ({
        id: { type: GraphQLString },
        name: { type: GraphQLString },
        email: { type: GraphQLString},
        phone: { type: GraphQLString},
        active: { type: GraphQLBoolean },
    }),
});

module.exports = EmployeeType;