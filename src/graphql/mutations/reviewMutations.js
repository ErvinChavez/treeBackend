const {
  GraphQLNonNull,
  GraphQLInt,
  GraphQLString,
} = require("graphql");

//DB Models
const Job = require("../../models/Job");
const Feedback = require("../../models/Feedback");

//shared services
const { sendEmail } = require("../../utils/email");

//graphql types
const FeedbackType = require("../types/FeedbackType");

const reviewMutations = {
  submitFeedback: {
    type: FeedbackType,
    args: {
      token: { type: new GraphQLNonNull(GraphQLString) },
      rating: { type: new GraphQLNonNull(GraphQLInt) },
      comment: { type: GraphQLString },
    },
    async resolve(parent, args) {
      const job = await Job.findOne({
        where: { reviewToken: args.token },
      });

      const jobIsReviewable = job && (job.status === "completed" || job.status === "paid");

      if (!jobIsReviewable || !job.reviewRequested) {
        throw new Error("Invalid or Expired Review Link");
      }
      if (args.rating < 1 || args.rating > 5) {
        throw new Error("Invalid Rating");
      }
      const existing = await Feedback.findOne({
        where: { jobId: job.id },
      });

      if (existing) {
        throw new Error("Feedback Already Submitted");
      }

      try {
        const feedback = await Feedback.create({
          jobId: job.id,
          rating: args.rating,
          comment: args.comment || "",
        });
        if (args.rating < 4) {
          try {
            await sendEmail(
              process.env.REVIEW_EMAIL,
              `Low Rating Feedback - Job #${job.id}`,
              `
                                <h2>New Low Rating Feedback</h2>
                                <p><strong>Job ID:</strong> ${job.id}</p>
                                <p><strong>Rating:</strong> ${args.rating}</p>
                                <p><strong>Comment:</strong></p>
                                <p>${args.comment || "No comment provided"}</p>
                            `,
            );
          } catch (emailErr) {
            console.error("Email failed:", emailErr);
          }
        }
        job.reviewToken = null;
        await job.save();

        return feedback;
      } catch (err) {
        if (err.name === "SequelizeUniqueConstraintError") {
          throw new Error("Feedback Already Submitted");
        }

        console.log("Submit Feedback Error:", err);
        throw new Error("Failed to Submit Feedback");
      }
    },
  },
};
module.exports = reviewMutations;
