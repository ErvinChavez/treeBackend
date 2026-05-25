const { GraphQLObjectType } = require("graphql");

const adminMutations = require("./adminMutations");
const serviceMutations = require("./serviceMutations");
const jobMutations = require("./jobMutations");

const Mutation = new GraphQLObjectType({
    name: "Mutation",
    fields: {
        ...adminMutations,
        ...serviceMutations,
        ...jobMutations,
    },
});

module.exports = Mutation;