const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Job = require('./Job');
const Service = require('./Service');

const JobService = sequelize.define('JobService', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
}, { timestamps: true });

//Many-to-Many
Job.belongsToMany(Service, { through: JobService, foreignKey: 'jobId' });
Service.belongsToMany(Job, { through: JobService, foreignKey: 'serviceId' });

module.exports = JobService;