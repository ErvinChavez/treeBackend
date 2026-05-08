const sequelize = require('../config/db');

// Load all models
require('./Admin');
require('./Client');
require('./Job');
require('./Employee');
require('./Service');
require('./Feedback');
require('./JobPhoto');
require('./JobService');
require('./JobEmployee');

// Load associations 
const applyAssociations = require('./Associations');
applyAssociations();

/**
 * Centralized database export
 * Provides a single entry point for DB connections and models
 */
const db = {
    sequelize,
};

module.exports = db;