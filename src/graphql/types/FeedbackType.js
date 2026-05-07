//shape of API object
const {
    //graphQL object structure
    GraphQLObjectType,
    //string fields
    GraphQLString,
    //integer fields
    GraphQLInt
} = require("graphql");
//create new feedback API object
const FeedbackType = new GraphQLObjectType({
    //GraphQl schema name
    name: 'Feedback',
    //function wrapped for future updates
    fields: () => ({
        id: { type: GraphQLString },
        rating: { type: GraphQLInt },
        comment: { type: GraphQLString },
        jobId: { type: GraphQLString },
        googleReviewLink: { type: GraphQLString }, 
    }),
});

module.exports = FeedbackType;