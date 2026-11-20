const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const db = require('./config/db');
const foodRoutes = require('./routes/food.routes');

const app = express();

// Security and request parsing middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Server health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'TENZAL Luxury Resort - Food Ordering API',
    module: 'Food Ordering (22CIS0328)',
    timestamp: new Date().toISOString(),
  });
});

// Database health check endpoint
app.get('/api/db-health', async (req, res) => {
  try {
    const result = await db.query('SELECT 1 AS connected, NOW() AS db_time;');
    res.status(200).json({
      status: 'ok',
      database: 'connected',
      driver: 'PostgreSQL (pg)',
      db_time: result.rows[0].db_time,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      database: 'disconnected',
      message: 'Database health check failed',
      timestamp: new Date().toISOString(),
    });
  }
});

// Food Ordering API routes
app.use('/api/food', foodRoutes);

module.exports = app;
