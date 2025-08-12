const express = require('express');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const http = require('http');
require('dotenv').config();

// Import routes and database
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const initializeSocket = require('./socket/socketHandler');

// Initialize Express app and HTTP server
const app = express();
const server = http.createServer(app);

// Environment variables
const PORT = process.env.PORT || 5001;

// Middleware 
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100, 
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Initialize Socket.IO
const io = initializeSocket(server);

// API Routes
app.get('/', (req, res) => {
  res.json({
    message: 'Messaging App API',
    status: 'running',
    timestamp: new Date()
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/messages', require('./routes/messageRoutes'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});



// Database connection and server startup
const startServer = async () => {
  try {
    await connectDB();
    console.log('Database connected successfully');
    server.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`Socket.IO enabled for real-time messaging`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

// Start the server
startServer();