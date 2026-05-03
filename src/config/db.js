const { Sequelize } = require('sequelize');
require('dotenv').config(); //Load .env

//Connect to PostgreSQL
const sequelize = new Sequelize(
    process.env.DATABASE_URL, {
        dialect: 'postgres',
        logging: false,
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false,
            }
        }
    }
);

module.exports = sequelize;