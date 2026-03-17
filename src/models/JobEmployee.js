const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Job = require('.Job');
const Employee = require('./Employee');

const JobEmployee = sequelize.define('JobEmployee', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
}, { timestamps: true });

//Many-to-Many
Job.belongsToMany(Employee, { through: JobEmployee, foreignKey: 'jobId' });
Employee.belongsToMany(Job, { through: JobEmployee, foreignKey: 'employeeId' });

module.exports = JobEmployee;