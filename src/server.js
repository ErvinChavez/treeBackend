const express = require('express');
const { graphqlHTTP } = require('express-graphql');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

// Database
const sequelize = require('./config/db');

// Import models
const Client = require('./models/Client');
const Job = require('./models/Job');
const Employee = require('./models/Employee');
const Service = require('./models/Service');
const JobPhoto = require('./models/JobPhoto');
const Feedback = require('./models/Feedback');
const JobService = require('./models/JobService');
const JobEmployee = require('./models/JobEmployee');

// GraphQL Schema
const schema = require('./schema');

// Routes
const reviewRoutes = require('./routes/review');
const uploadRoutes = require('./routes/uploadRoutes');
const { getAdminFromToken, protect } = require('./middleware/authMiddleware'); // JWT auth for uploads

// Create Express App
const app = express();

// Middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],

        scriptSrc: [
          "'self'",
          "'unsafe-inline'", // allow Next.js & GraphQL UI
          "'unsafe-eval'",    // needed for dev tools / GraphiQL
        ],

        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          "https:",
        ],

        imgSrc: [
          "'self'",
          "data:",
          "https:",
          "http://localhost:5000", // allow images from backend
          "http://localhost:3000", // allow images from frontend
        ],

        connectSrc: [
          "'self'",
          "http://localhost:5000", // backend
          "http://localhost:3000"  // frontend
        ],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

app.use(cors());
app.use(express.urlencoded({ extended: true })); // needed to read POST form data
app.use(express.json({ limit: '5mb' })); // limit JSON payloads
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 min
    max: 100, // limit each IP
  })
);

// Serve static files from uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads'),{
  setHeaders: (res, path, stat) => {
    res.setHeader('Access-Control-Allow-Origin', '*');      // allow any origin
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin'); // allow cross-origin access
  }
  }));

// Upload route (protected)
app.use('/api/upload', uploadRoutes);
app.use("/review", reviewRoutes);


// Test route
app.get('/', (req, res) => {
  res.send('Chavez Tree Service backend is running!');
});

// GraphQL endpoint
app.use(
  '/graphql',
  graphqlHTTP(async (req) => {
    let admin = null;
    const authHeader = req.headers.authorization;
    if (authHeader) {
      const token = authHeader.split(' ')[1];
      try {
        admin = await getAdminFromToken(token);
      } catch (err) {
        admin = null;
      }
    }
    return {
      schema,
      context: { admin }, // available in all resolvers
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
  .authenticate()
  .then(() => {
    console.log('PostgreSQL connected successfully!');
    return sequelize.sync(); // Change to sequelize.sync({ alter: true }) // for dev only
  })
  .then(() => {
    console.log('All models synced to DB');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('Error starting server:', err);
  });