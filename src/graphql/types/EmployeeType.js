//shape of API object
const {
    //graphQL object structure
    GraphQLObjectType,
    //string fields
    GraphQLString
} = require("graphql");

//create new employee API object
const EmployeeType = new GraphQLObjectType({
    //graphQL schema
    name: 'Employee',
    //use function wrapper incase of future updates
    fields: () => ({
        id: { type: GraphQLString },
        name: { type: GraphQLString },
        email: { type: GraphQLString},
        phone: { type: GraphQLString},
    }),
});

module.exports = EmployeeType;