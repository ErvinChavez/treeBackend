const { GraphQLObjectType } = require("graphql");

const adminMutations = require("./adminMutations");
const serviceMutations = require("./serviceMutations");

const Mutation = new GraphQLObjectType({
    name: "Mutation",
    fields: {
        ...adminMutations,
        ...serviceMutations
    },
});

module.exports = Mutation;