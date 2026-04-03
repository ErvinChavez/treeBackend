const {
    GraphQLObjectType,
    GraphQLString
} = require("graphql");

const EmployeeType = new GraphQLObjectType({
    name: 'Employee',
    fields: () => ({
        id: { type: GraphQLString },
        name: { type: GraphQLString },
        email: { type: GraphQLString},
        phone: { type: GraphQLString},
    }),
});

module.exports = EmployeeType;