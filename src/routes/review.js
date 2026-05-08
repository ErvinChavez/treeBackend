const express = require("express");
const Feedback = require("../models/Feedback");
const Job = require("../models/Job");

const router = express.Router();

// POST /review
router.post("/", express.json(), async (req, res) => {
  const { jobId, rating, comment } = req.body;

  if (!jobId || !rating) return res.status(400).json({ error: "Missing jobId or rating" });

  const job = await Job.findByPk(jobId);
  if (!job) return res.status(404).json({ error: "Job not found" });

  const feedback = await Feedback.findOne({ where: { jobId: job.id } });
  if (!feedback) return res.status(404).json({ error: "Feedback record not found" });

  feedback.rating = parseInt(rating);
  feedback.comment = comment || "";
  // feedback.googleReviewLink = null;

  await feedback.save();

  return res.json({ success: true, message: "Thank you for your feedback!" });
});

module.exports = router;