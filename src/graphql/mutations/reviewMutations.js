const { GraphQLNonNull, GraphQLBoolean, GraphQLInt, GraphQLString } = require("graphql");

//sercurity
const crypto = require("crypto");

//DB Models
const Job = require("../../models/Job");
const Client = require("../../models/Client");

//shared services
const { sendEmail } = require("../../utils/email");

//graphql types
const FeedbackType = require("../types/FeedbackType");

const reviewMutations = {
    sendReviewRequest: {
        type: GraphQLBoolean,
        arg: {
            jobId: { type: new GraphQLNonNull(GraphQLInt) },
        },
        async resolve(parent, args, context) {
            
        }
    }
};

exports.reviewMutations = reviewMutations;