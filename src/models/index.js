const sequelize = require('../config/db');

/**
 * Centralized database export
 * Provides a single entry point for DB connections and future models expansion
 */
const db = {
    sequelize,
};

module.exports = db;