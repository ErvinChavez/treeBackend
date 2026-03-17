const { Sequelize } = require('sequelize');
require('dotenv').config(); //Load .env

//Connect to PostgreSQL
const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASS,
    {
        host: process.env.DB_HOST,
        dialect: 'postgres',
        logging: console.log, //Set to false when deployment.
    }
);

module.exports = sequelize;