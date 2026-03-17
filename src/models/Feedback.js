const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Job = require('./Job');

const Feedback = sequelize.define('Feedback', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    rating: { type: DataTypes.INTEGER, allowNull: false }, // 1-5
    comment: { type: DataTypes.TEXT, allowNull: true },
}, { timestamps: true });

//Relation: Feedback belongs to Job
Feedback.belongsTo(Job, { foreignKey: 'jobId' });
Job.hasOne(Feedback, { foreignKey: 'jobId' });

module.exports = Feedback;
