const { GraphQLObjectType } = require("graphql");

const adminMutations = require("./adminMutations");
const serviceMutations = require("./serviceMutations");
const jobMutations = require("./jobMutations");
const reviewMutations = require("./reviewMutations");
const employeeMutations = require("./employeeMutations");
const photoMutations = require("./photoMutations");
const paymentMutations = require("./paymentMutations");

const Mutation = new GraphQLObjectType({
    name: "Mutation",
    fields: {
        ...adminMutations,
        ...serviceMutations,
        ...jobMutations,
        ...reviewMutations,
        ...employeeMutations,
        ...photoMutations,
        ...paymentMutations,
    },
});

module.exports = Mutation;