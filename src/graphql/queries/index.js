const { GraphQLObjectType } = require('graphql');

const analyticsQueries = require("./analyticsQueries");

const RootQuery = new GraphQLObjectType({
    name: "RootQueryType",

    fields: () => ({
        ...analyticsQueries,
    })
})