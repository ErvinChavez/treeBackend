//Job model with address field
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Client = require('./Client');

const Job = sequelize.define('Job', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    status: {
        type: DataTypes.ENUM('pending_quote', 'quote_scheduled', 'scheduled', 'in_progress', 'completed', 'paid', 'cancelled' ),
        defaultValue: 'pending_quote'
    },
    scheduledDate: { type: DataTypes.DATE, allowNull: true },
    street: { type: DataTypes.STRING, allowNull: false },
    city: { type: DataTypes.STRING, allowNull: false },
    state: { type: DataTypes.STRING, allowNull: false },
    zip: { type: DataTypes.STRING, allowNull: false },
    reviewRequested: { type: DataTypes.BOOLEAN, defaultValue: false, },
    reviewToken: { type: DataTypes.STRING, allowNull: true },
}, { timestamps: true });

//Relation: Job belongs to Client
Job.belongsTo(Client, { foreignKey: 'clientId' });
Client.hasMany(Job, { foreignKey: 'clientId' });

module.exports = Job;
