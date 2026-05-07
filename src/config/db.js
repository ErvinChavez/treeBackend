// PostgreSQL connection using Sequelize ORM
// Loads environment variables for secure config
const { Sequelize } = require('sequelize');
require('dotenv').config();

// Create reusable DB connection instance
const sequelize = new Sequelize(
    process.env.DATABASE_URL, {
        dialect: 'postgres',
        //disable SQL logs in production
        logging: false,
        dialectOptions: {
            ssl: {
                //force SSL usage to encrypt DB traffic for (Supabase/Render)
                require: true,
                //accept SSL certificate
                rejectUnauthorized: false,
            }
        }
    }
);
module.exports = sequelize;