require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { errorHandler } = require('./middleware/errorHandler');
const roomRoutes = require('./routes/roomRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const aboutRoutes = require('./routes/aboutRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// --------------- Middleware ---------------

// CORS - allow Vite dev server
app.use(
  cors({
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --------------- Routes ---------------

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    message: 'TENZAL Luxury Resort API is running',
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/about', aboutRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/bookings', bookingRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found.',
  });
});

// Global error handler (must be last)
app.use(errorHandler);

// --------------- Start Server ---------------

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`TENZAL Luxury Resort API running on http://localhost:${PORT}`);
  });
}

module.exports = app;
