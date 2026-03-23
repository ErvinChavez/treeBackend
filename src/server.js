//basic server setup
const express = require('express');
const { graphqlHTTP } = require('express-graphql');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const helmet =  require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config(); //Load .env variables

//Database
const sequelize = require('./config/db'); //DB connection

//Import models
const Client = require('./models/Client');
const Job = require('./models/Job');
const Employee = require('./models/Employee');
const Service = require('./models/Service');
const JobPhoto = require('./models/JobPhoto');
const Feedback = require('./models/Feedback');
const JobService = require('./models/JobService');
const JobEmployee = require('./models/JobEmployee');


//GraphQl Schema
const schema = require('./schema'); // updated Graphql

//Routes
const uploadRoutes = require('./routes/uploadRoutes');

//Create Express App 
const app = express();

//Middleware
app.use(helmet({contentSecurityPolicy: false})); //Security headers Turn to false for testing on graphiql
app.use(cors()); //Allow cross-origin requests
app.use(express.json()); // Parse JSON bodies
app.use(rateLimit({//Rate limiting (basic, 15 min window)
    windowMs: 15 * 60 * 1000, //15 minutes
    max: 100 //limit each IP to 100 requests per window
}));

//Mount uploads route
app.use('/api/upload', uploadRoutes);

//serve static files from uploads folder
app.use('/uploads', express.static('src/uploads'));

//Test route
app.get('/', ( req, res,) => {
    res.send('Chavez Tree Service backend is running!');
});

//Start Server + DB Sync + Seed
const PORT = process.env.PORT || 5000;

//Test Database Connection
sequelize
  .authenticate()
  .then(() => {
    console.log('PostgreSQL connected successfully!');
    return sequelize.sync(); //Temporary: good for development Change to alter: true for deployment
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

    //GraphQL endpoint
    app.use('/graphql', graphqlHTTP((req) => {
        let admin = null;
        const authHeader = req.headers.authorization;
        if (authHeader) {
            const token = authHeader.split(' ')[1];
            try {
                admin = jwt.verify(token, process.env.JWT_SECRET);
            } catch (err) {
                admin = null;
            }
        }
        return {
            schema,
            context: { admin }, //available in all resolvers
            graphiql: true,
        };
    }));

    //Start Server
    app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    });
  })

  .catch(err => {
    console.error('Error starting server:', err)
  });