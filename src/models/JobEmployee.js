const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Job = require('./Job');
const Employee = require('./Employee');

/**
 * Join table: Job to/from Employee
 * Implements many-to-many relationship between jobs and employees
 * Tracks workforce assignment for each job
 */
const JobEmployee = sequelize.define('JobEmployee', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
}, { timestamps: true });

module.exports = JobEmployee;