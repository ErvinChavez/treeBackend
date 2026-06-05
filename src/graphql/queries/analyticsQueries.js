const { GraphQLFloat } = require("graphql");

const Feedback = require("../../models/Feedback");

const analyticsQueries = {
    averageRating: {
        type: GraphQLFloat,
        
        async resolve(parent, args, context) {
            if (!context.admin) throw new Error("Unauthorized");

            const feedbacks = await Feedback.findAll();
            if (feedbacks.length === 0) return 0;

            const total = feedbacks.reduce((sum, f) => sum + f.rating, 0);
            return total / feedbacks.length;
        },
    },
};

module.exports = analyticsQueries;