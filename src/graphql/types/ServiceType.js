const {
    GraphQLObjectType,
    GraphQLString,
} = require("graphql");

const ServiceType = new GraphQLObjectType({
    name: 'Service',
    fields: () => ({
        id: { type: GraphQLString},
        name: { type: GraphQLString},
        description: { type: GraphQLString},
    }),
});

module.exports = ServiceType;