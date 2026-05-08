const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

/**
 * Admin model
 * Stores authenticated admin accounts for dashboard access
 */
const Admin = sequelize.define('Admin', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    email: { type: DataTypes.STRING, allowNull:false, unique: true},
    password: { type: DataTypes.STRING, allowNull: false},
}, { timestamps: true });

module.exports = Admin;