const sequelize = require('../config/db');

//Import individual models here later
//const Client = require('./Client');
//const Job = require('.Job');

const db = {
    sequelize,
    //Client,
    //Job,
};

module.exports = db;