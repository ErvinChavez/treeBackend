//GraphQL core types
const {
    GraphQLObjectType,
    GraphQLString,
    GraphQLInt
} = require("graphql");

/**
 * Feedback GraphQL type
 * Represents customer review and rating data
 */
const FeedbackType = new GraphQLObjectType({
    name: 'Feedback',
    
    //wrapped in a function for consistency and future relationship expansion
    fields: () => ({
        id: { type: GraphQLString },
        rating: { type: GraphQLInt },
        comment: { type: GraphQLString },
        jobId: { type: GraphQLString },
        googleReviewLink: { type: GraphQLString }, 
    }),
});

module.exports = FeedbackType;