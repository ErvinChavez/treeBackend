const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Job = require('./Job');

/**
 * JobPhoto model
 * Stores uploaded media assets linked to a job
 * Supports visual tracking of work progress
 */
const JobPhoto = sequelize.define('JobPhoto', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    url: { type: DataTypes.STRING, allowNull: false },
}, { timestamps: true });

module.exports = JobPhoto;