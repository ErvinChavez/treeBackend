const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

/**
 * Client model
 * Stores customer contact information and account relationships
 */
const Client = sequelize.define('Client', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    phone: { type: DataTypes.STRING, allowNull: false},
}, { timestamps: true });

module.exports = Client;