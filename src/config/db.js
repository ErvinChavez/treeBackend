//import sequelize(ORM style, can use JS for SQL writing)
const { Sequelize } = require('sequelize');
//Load .env
require('dotenv').config();

//Connect to PostgreSQL
const sequelize = new Sequelize(
    process.env.DATABASE_URL, {
        //using postgreSQL
        dialect: 'postgres',
        //disable SQL logs in console
        logging: false,
        //extra postgreSQL connnection settings
        dialectOptions: {
            //enables encrypted DB connection
            ssl: {
                //force SSL usage to encrypt DB traffic
                require: true,
                //accept SSL certificate even if not fully verified
                rejectUnauthorized: false,
            }
        }
    }
);
//make DB coneection reusable everywhere
module.exports = sequelize;