const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Payment = sequelize.define(
  "Payment",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    jobId: { type: DataTypes.INTEGER, allowNull: false },

    method: {
      type: DataTypes.ENUM("check", "zelle", "venmo", "cashapp", "cash", "card"),
      allowNull: false,
    },

    amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    note: { type: DataTypes.STRING, allowNull: true },

    //set only for payments collected through Stripe Checkout
    stripePaymentIntentId: { type: DataTypes.STRING, allowNull: true },
    stripeCheckoutSessionId: { type: DataTypes.STRING, allowNull: true },
  },
  { timestamps: true },
);

module.exports = Payment;
