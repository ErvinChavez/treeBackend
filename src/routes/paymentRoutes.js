const express = require("express");
const router = express.Router();

const { stripeWebhook } = require("../controllers/paymentController");

router.post("/webhook", express.raw({ type: "application/json" }), stripeWebhook);

module.exports = router;
