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
        args: {
            jobId: { type: new GraphQLNonNull(GraphQLInt) },
        },
        async resolve(parent, args, context) {
            if (!context.admin) throw new Error("Unauthorized");

            const job = await Job.findByPk(args.jobId);
            if (!job) throw new Error("Job not found");

            if (job.reviewRequested) {
                throw new Error("Review Already Requested");
            }


            const client = await Client.findByPk(job.clientId);
            if (!client || !client.email) {
                throw new Error("Client email not found");
            }

            if (!client.email.includes("@")) {
                throw new Error("Invalid Email");
            }

            const token = crypto.randomBytes(32).toString("hex");

            const frontendBase = process.env.FRONTEND_URL
                ? `${process.env.FRONTEND_URL}/review`
                : "http://localhost:3000/review";

            const emailHtml = `
                <p>Hi ${client.name}, thanks for using Chavez Tree Service!</p>
                <p>How would you rate your experience?</p>

                <p>
                    <a href="${frontendBase}?token=${token}&rating=5">⭐️⭐️⭐️⭐️⭐️</a><br/>
                    <a href="${frontendBase}?token=${token}&rating=4">⭐️⭐️⭐️⭐️</a><br/>
                    <a href="${frontendBase}?token=${token}&rating=3">⭐️⭐️⭐️</a><br/>
                    <a href="${frontendBase}?token=${token}&rating=2">⭐️⭐️</a><br/>
                    <a href="${frontendBase}?token=${token}&rating=1">⭐️</a>
                </p>

                <p>We appreciate your feedback!</p>
            `;

            try {
                await sendEmail(
                    client.email,
                    "How was your experience with Chavez Tree Service?",
                    emailHtml
                );

                job.reviewToken = token;
                job.reviewRequested = true;
                await job.save();

                return true;
            } catch (err) {
                console.error("Email failed:", err);
                throw new Error("Failed to send review email");
            }
        },
    },

    submitFeedback: {
        type: FeedbackType,
        args: {
            token: { type: new GraphQLNonNull(GraphQLString) },
            rating: { type: new GraphQLNonNull(GraphQLInt)},
            comment: { type: GraphQLString},
        },
        async resolve(parent, args) {
            const job = await Job.findOne({
                where: { reviewToken: args.token},
            });

            if (!job || job.status !== "completed" || !job.reviewRequested) {
                throw new Error("Invalid or Expired Review Link")
            }
            if (args.rating < 1 || args.rating > 5 ) {
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
                            `
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
        }
        
    }
};
module.exports = reviewMutations;