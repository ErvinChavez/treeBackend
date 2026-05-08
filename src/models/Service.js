const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

/**
 * Service model
 * Represents available business services that can be assigned to jobs
 * Acts as a catalog for job composition and quoting
 */
const Service = sequelize.define('Service', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
}, { timestamps: true });

module.exports = Service;
