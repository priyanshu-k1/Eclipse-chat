const express = require('express');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const http = require('http');
require('dotenv').config();

// Import routes and database
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes'); 
const orbitRoutes = require('./routes/orbitRoutes');
const {initializeSocket} = require('./socket/socketHandler');
const readStatusRoutes = require('./routes/readStatusRoutes');


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


// Initialize Socket.IO
const io = initializeSocket(server);
app.set('io', io);

// API Routes
app.get('/', (req, res) => {
  res.json({
    message: 'Messaging App API',
    status: 'running',
    timestamp: new Date()
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes); 
app.use('/api/orbits', orbitRoutes);
app.use('/api/messages/read-status', readStatusRoutes);
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