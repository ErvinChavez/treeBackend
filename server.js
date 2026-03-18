//basic server setup
const express = require('express');
const { graphqlHTTP } = require('express-graphql');
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
const JobEmployee = require('./src/models/JobEmployee');

//GraphQl Schema
const schema = require('./src/schema'); // updated Graphql

//Create Express App Init
const app = express();

//Middleware
app.use(helmet({contentSecurityPolicy: false,})); //Security headers Turn to false for testing on graphiql
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

//Start Server + DB Sync + Seed
const PORT = process.env.PORT || 5000;

//Test Database Connection
sequelize.authenticate()
  .then(() => {
    console.log('PostgreSQL connected successfully!');

    return sequelize.sync({ force: true }); //Temporary: good for development Change to alter: true for deployment
})
  .then(async () => {
    console.log('All models synced to DB');

    //Seed Services
    const count = await Service.count();

    if (count === 0) {
        await Service.bulkCreate([
            {
                name: 'Tree Removal',
                description: 'Safe and professional removal of hazardous or unwanted trees.'
            },
            {
                name: 'Emergency Tree Service',
                description: '24/7 emergency response for fallen or dangerous trees.'
            },
            {
                name: 'Tree Trimming / Pruning',
                description: 'Improve tree health, safety, and appearance with expert trimming.'
            },
            {
                name: 'Stump Grinding',
                description: 'Remove unsightly tree stumps quickly and efficiently'
            },
            {
                name: 'Land Clearing', 
                description: 'Clear land for construction, landscaping, or property maintenance.'
            }
        ]);

        console.log('Services seeded!');
    } else {
        console.log('Services already exist, skipping seed.');
    }
    //Start Server
    app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Error starting server:', err)
  });