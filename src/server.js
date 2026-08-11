//server
const express = require('express');
//handle file paths
const path = require('path');
//GraphQL endpoint handler (spec-compliant, actively maintained replacement for express-graphql)
const { createHandler } = require('graphql-http/lib/use/express');
//allow frontend to connect
const cors = require('cors');
//sercurity layer
const helmet = require('helmet');
//prevent abuse/spam
const rateLimit = require('express-rate-limit');


//load .env for development
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const sequelize = require('./config/db');

//auth middleware
const { getAdminFromToken } = require('./middleware/authMiddleware');

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
  "https://chaveztree.com",
  "https://www.chaveztree.com",
  "http://localhost:3000",
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`Not allowed by CORS: ${origin}`));
    },
    credentials: true,
  })
);

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
//NOTE: app.all (not app.use) — the GraphQL over HTTP spec that graphql-http follows
//requires handling both GET and POST requests on this route.
app.all(
  '/graphql',
  createHandler({
    schema,
    context: async (req) => {
      let admin = null;

      //req.raw is the underlying Express request (graphql-http wraps it)
      const authHeader = req.raw.headers.authorization;

      if (authHeader) {
        const token = authHeader.split(' ')[1];

        try {
          admin = await getAdminFromToken(token);
        } catch (err) {
          admin = null;
        }
      }

      return { admin };
    },
  })
);

//Dev-only GraphQL IDE (express-graphql used to bundle this via graphiql:true;
//graphql-http is spec-only and intentionally ships no UI, so we mount Ruru ourselves)
if (process.env.NODE_ENV !== 'production') {
  const { ruruHTML } = require('ruru/server');

  app.get('/graphiql', (req, res) => {
    res.type('html');
    res.end(ruruHTML({ endpoint: '/graphql' }));
  });
}

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
    return sequelize.sync(); //dev only: { alter: true }
  })
  .then(() => {
    console.log('All models synced to DB');
    
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('Error starting server:', err);
  });