//server
const express = require('express');
//GraphQL endpoint handler
const { graphqlHTTP } = require('express-graphql');
//allow frontend to connect
const cors = require('cors');
//sercurity layer
const helmet = require('helmet');
//prevent abuse/spam
const rateLimit = require('express-rate-limit');
//handle file paths
const path = require('path');
//load .env for development
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}
// database connection
const sequelize = require('./config/db');
// Import models to register with sequelize
const Client = require('./models/Client');
const Job = require('./models/Job');
const Employee = require('./models/Employee');
const Service = require('./models/Service');
const JobPhoto = require('./models/JobPhoto');
const Feedback = require('./models/Feedback');
const JobService = require('./models/JobService');
const JobEmployee = require('./models/JobEmployee');
// entire graphQL schema
const schema = require('./schema');

// REST endpoints(for uploads and reviews)
const reviewRoutes = require('./routes/review');
const uploadRoutes = require('./routes/uploadRoutes');

//handles JWT authentication
const { getAdminFromToken, protect } = require('./middleware/authMiddleware'); // JWT auth for uploads

//create the app
const app = express();

//what rules must browser follow to load site
//run this for every request
app.use(
  helmet({
    //CSP only load resoures from approved places
    contentSecurityPolicy: {
      //the actual rules
      directives: {
        //fallback rule
        //only allow from same origin/domain
        defaultSrc: ["'self'"],

        //which files/scripts are allowed to run
        scriptSrc: [
          //own domain 
          "'self'",
          //allow inline JS 
          "'unsafe-inline'", //react and Next.js injected inline codes
          "'unsafe-eval'",    // needed for dev tools / GraphiQL
        ],

        //control which css/styles are allowed
        styleSrc: [
          //own files
          "'self'",
          //allow inline styles
          "'unsafe-inline'",
          //allow styles from any https
          "https:",
        ],
        
        //which image sources are allowed
        imgSrc: [
          //from same backend/domain
          "'self'",
          //allow Base64 inlines images
          "data:",
          //allow from any https sites
          "https:",
          //for development only
          "http://localhost:5000", // allow images from backend (Later to supabase Storage)
          "http://localhost:3000", // allow images from frontend (Later to supabase Storage)
        ],

        //URLS frontend, JS can connect to
        connectSrc: ["'self'"],
      },
    },
    //disable strict browser policies
    crossOriginEmbedderPolicy: false,
  })
);

//allow only my frontend to talk to backend
const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:3000"
];
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

//read incoming request data
app.use(express.urlencoded({ extended: true })); // needed to read POST form data
app.use(express.json({ limit: '5mb' })); // limit JSON payloads

//prevent spam/brute-force attacks
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 min
    max: 100, // limit each IP
  })
);

//Serve static files from uploads (this is for locally only, in development)
//(will change to Supabase Storage for deployment)
app.use('/uploads', express.static(path.join(__dirname, 'uploads'),{
  setHeaders: (res, path, stat) => {
    //allow for images to load on frontend
    res.setHeader('Access-Control-Allow-Origin', '*');      // allow any origin
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin'); // allow cross-origin access
  }
  }));

//file uploads routes
app.use('/api/upload', uploadRoutes);
//review system route
app.use("/review", reviewRoutes);


// Test route (health check)
app.get('/', (req, res) => {
  res.send('Chavez Tree Service backend is running!');
});

//graphQL endpoint(put evething together)
app.use(
  '/graphql',
  graphqlHTTP(async (req) => {
    let admin = null;
    //check if token exist
    const authHeader = req.headers.authorization;
    //if token does exist
    if (authHeader) {
      //get the bearer token
      const token = authHeader.split(' ')[1];
      try {
        //decode user/admin from JWT
        admin = await getAdminFromToken(token);
      } catch (err) {
        //if not, admin is still null and no access
        admin = null;
      }
    }
    return {
      schema,
      //available in all resolvers
      context: { admin }, 
      //GraphiQL enabled in dev but diasble in production
      graphiql: process.env.NODE_ENV !== 'production',
    };
  })
);

// Global error handler (keep it for unexpected errors)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal Server Error' });
});

// Start server
const PORT = process.env.PORT || 5000;

sequelize
  //test DB connection
  .authenticate()
  .then(() => {
    console.log('PostgreSQL connected successfully!');
    //create tables if missing
    return sequelize.sync(); // Change to sequelize.sync({ alter: true }) // for dev only
  })
  .then(() => {
    console.log('All models synced to DB');
    //start server
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('Error starting server:', err);
  });