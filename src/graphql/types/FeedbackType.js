const {
    GraphQLObjectType,
    GraphQLString,
    GraphQLInt
} = require("graphql");

const FeedbackType = new GraphQLObjectType({
    name: 'Feedback',
    fields: () => ({
        id: { type: GraphQLString },
        rating: { type: GraphQLInt },
        comment: { type: GraphQLString },
        jobId: { type: GraphQLString },
        googleReviewLink: { type: GraphQLString }, 
    }),
});

module.exports = FeedbackType;