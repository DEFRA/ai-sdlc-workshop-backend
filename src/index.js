const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const morgan = require('morgan');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const { initializeDatabase } = require('./database');

const healthRoutes = require('./routes/health');
const registrationsRoutes = require('./routes/registrations');

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Simple request logging
app.use(morgan('dev'));

// Swagger setup
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Workshop Backend API',
      version: '1.0.0',
      description: 'Workshop Backend API',
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: 'Development server',
      },
    ],
  },
  apis: ['./src/routes/*.js'], // Path to the API docs
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// API versioning setup
const apiV1Router = express.Router();
app.use('/api/v1', apiV1Router);

// Register routes with the versioned router
apiV1Router.use('/health', healthRoutes);
apiV1Router.use('/registrations', registrationsRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the Simple API Service' });
});

// Initialize database and start server
initializeDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Swagger documentation available at http://localhost:${PORT}/api-docs`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  }); 