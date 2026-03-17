//basic server setup
const express = require('express');
const cors = require('cors');
const helmet =  require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config(); //Load .env variables

//Database
const sequelize = require('./src/config/db'); //DB connection

//Import models
const Client = require('./src/models/Client');
const Job = require('./src/models/Job');
const Employee = require('./src/models/Employee');
const Service = require('./src/models/Service');
const JobPhoto = require('./src/models/JobPhoto');
const Feedback = require('./src/models/Feedback');
const JobService = require('./src/models/JobService');
const JobEmployee = require('./src/models/Employee');

//GraphQl
const { graphqlHTTP } = require('express-graphql');
const schema = require('./src/schema'); // updated Graphql

//Create Express app
const app = express();

//Middleware
app.use(helmet()); //Security headers Turn to false for testing on graphiql
app.use(cors()); //Allow cross-origin requests
app.use(express.json()); // Parse JSON bodies
//Rate limiting (basic, 15 min window)
app.use(rateLimit({
    windowMs: 15 * 60 * 1000, //15 minutes
    max: 100 //limit each IP to 100 requests per window
}));

//Test route
app.get('/', ( req, res,) => {
    res.send('Chavez Tree Service backend is running!');
});

//GraphQL endpoint
app.use('/graphql', graphqlHTTP({
    schema,
    graphiql: true, //enable GraphiQL in dev
}));



//Test Database Connection
sequelize.authenticate()
  .then(() => console.log('PostgreSQL connected successfully!'))
  .catch(err => console.log('DB connection error:', err));

//Synce models
sequelize.sync({ alter: true }) //Updates DB tables
  .then(() => console.log('All models synced to DB'))
  .catch(err => console.error('Error syncing models:', err));

//Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});