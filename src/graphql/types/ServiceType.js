//GraphQL core types
const {
    GraphQLObjectType,
    GraphQLString,
} = require("graphql");

/**
 * Service GraphQL type
 * Represents services offered by the business
 */
const ServiceType = new GraphQLObjectType({
    name: 'Service',

    //wrapped in a function for consistency and future relationship expansion
    fields: () => ({
        id: { type: GraphQLString},
        name: { type: GraphQLString},
        description: { type: GraphQLString},
    }),
});

module.exports = ServiceType;