const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Job = require('./Job');
const Service = require('./Service');

/**
 * Join table: Job to/from Service
 * Represents services selected and assigned to a job
 * Enables flexible job composition (multiple services per job)
 */
const JobService = sequelize.define('JobService', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
}, { timestamps: true });

module.exports = JobService;