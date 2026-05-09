//server
const express = require('express');
//handle file paths
const path = require('path');
//GraphQL endpoint handler
const { graphqlHTTP } = require('express-graphql');
//allow frontend to connect
const cors = require('cors');
//sercurity layer
const helmet = require('helmet');
//prevent abuse/spam
const rateLimit = require('express-rate-limit');
const { getAdminFromToken } = require('./middleware/authMiddleware');

//load .env for development
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const sequelize = require('./config/db');
//load db,models, associations
require('./models');

// entire graphQL schema
const schema = require('./schema');
// REST endpoints(for uploads and reviews)
const uploadRoutes = require('./routes/uploadRoutes');

const app = express();

app.set('trust proxy', 1);

//helmet config to enforce safe content loading policies for broswer
app.use(
  helmet({
    //CSP only load resoures from approved places
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],

        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          "'unsafe-eval'",
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
          "http://localhost:5000",
          "http://localhost:3000",
        ],

        connectSrc: ["'self'"],
      },
    },

    crossOriginEmbedderPolicy: false,
  })
);

//restricts frontend access to trusted origins only
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
    standardHeaders: true,
    legacyHeaders: false,
  })
);

//Serve static files from uploads (development only)
//(Supabase Storage for deployment)
app.use('/uploads', express.static(path.join(__dirname, 'uploads'),{
  setHeaders: (res, path, stat) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  }
  }));

//REST endpoints
app.use('/api/upload', uploadRoutes);


// Test route (health check)
app.get('/', (req, res) => {
  res.send('Chavez Tree Service backend is running!');
});

//graphQL endpoint(put everything together)
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
      context: { admin }, 
      graphiql: process.env.NODE_ENV !== 'production',
    };
  })
);

// Global error handler (keep it for unexpected errors)
app.use((err, req, res, next) => {
  console.error(err.stack);

  res.status(500).json({ message: 'Internal Server Error' });
});

/**
 * Server bootstrap
 * - DB connection
 * - model sync
 * - API startup
 */
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