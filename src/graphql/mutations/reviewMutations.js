const {
  GraphQLNonNull,
  GraphQLBoolean,
  GraphQLInt,
  GraphQLString,
} = require("graphql");

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

      if (job.status !== "completed") {
        throw new Error("Jobs must be completed before sending review request");
      }

      if (job.totalAmount === null || job.totalAmount === undefined) {
        throw new Error("Job total amount is required before sending receipt");
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

      const formattedTotal = Number(job.totalAmount).toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
      });

      const emailHtml = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #222;">
                    <h2>Chavez Tree Service</h2>

                    <p>Hi ${client.name},</p>

                    <p>Thank you for choosing Chavez Tree Service. Your job has been completed.</p>

                    <hr />

                    <h3>Receipt</h3>

                    <p><strong>Job ID:</strong> ${job.id}</p>
                    <p><strong>Service Address:</strong><br/>
                        ${job.street}<br/>
                        ${job.city}, ${job.state} ${job.zip}
                    </p>

                    <p><strong>Total Amount:</strong> ${formattedTotal}</p>

                    <hr />

                    <p>We’d really appreciate your feedback. How would you rate your experience?</p>

                    <p style="font-size: 20px; line-height: 1.8;">
                        <a href="${frontendBase}?token=${token}&rating=5">⭐️⭐️⭐️⭐️⭐️</a><br/>
                        <a href="${frontendBase}?token=${token}&rating=4">⭐️⭐️⭐️⭐️</a><br/>
                        <a href="${frontendBase}?token=${token}&rating=3">⭐️⭐️⭐️</a><br/>
                        <a href="${frontendBase}?token=${token}&rating=2">⭐️⭐️</a><br/>
                        <a href="${frontendBase}?token=${token}&rating=1">⭐️</a>
                    </p>

                    <p>We appreciate your business!</p>

                    <p>
                        Chavez Tree Service
                    </p>
                </div>
            `;

      try {
        await sendEmail(
          client.email,
          `Receipt and review request for Job #${job.id}`,
          emailHtml,
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
      rating: { type: new GraphQLNonNull(GraphQLInt) },
      comment: { type: GraphQLString },
    },
    async resolve(parent, args) {
      const job = await Job.findOne({
        where: { reviewToken: args.token },
      });

      if (!job || job.status !== "completed" || !job.reviewRequested) {
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
