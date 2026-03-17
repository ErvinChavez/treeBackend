const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Job = require('./Job');

const JobPhoto = sequelize.define('JobPhoto', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    url: { type: DataTypes.STRING, allowNull: false },
    type: { type: DataTypes.ENUM('before', 'after'), allowNull: false },
}, { timestamps: true });

//Relation: JobPhoto belongs to Job
JobPhoto.belongsTo(Job, { foreignKey: 'jobId' });
Job.hasMany(JobPhoto, { foreignKey: 'jobId' });

module.exports = JobPhoto;