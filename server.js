//basic server setup
const express = require('express');
const cors = require('cors');
const helmet =  require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config(); //Load .env variables

const sequelize = require('./src/config/db'); //DB connection

//Create Express app
const app = express();

//Middleware
app.use(helmet()); //Security headers
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

//Test Database Connection
sequelize.authenticate()
  .then(() => console.log('PostgreSQL connected successfully!'))
  .catch(err => console.log('DB connection error:', err));

//Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});