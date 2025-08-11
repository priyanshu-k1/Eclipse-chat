const express = require('express');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

// Import routes and database
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');

// Initialize Express app and HTTP server
const app = express();
const server = http.createServer(app);

// Environment variables
const PORT = process.env.PORT || 5001;

// middleware 
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

// Socket.IO configuration
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);
  socket.on('join_room', (roomId) => {   // Handle user joining a room (for private messaging)
    socket.join(roomId);
    console.log(`User ${socket.id} joined room: ${roomId}`);
  });

  // Handle private message
  socket.on('private_message', (data) => {
    const { roomId, message, senderId, recipientId } = data;
    
    // Emit message to specific room
    socket.to(roomId).emit('receive_message', {
      message,
      senderId,
      recipientId,
      timestamp: new Date()
    });
  });

  // Handle typing indicators
  socket.on('typing_start', (data) => {
    socket.to(data.roomId).emit('user_typing', {
      userId: data.userId,
      isTyping: true
    });
  });

  socket.on('typing_stop', (data) => {
    socket.to(data.roomId).emit('user_typing', {
      userId: data.userId,
      isTyping: false
    });
  });

  // Handle user status updates
  socket.on('user_status', (status) => {
    socket.broadcast.emit('user_status_update', {
      userId: socket.userId,
      status
    });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    if (socket.userId) {
      socket.broadcast.emit('user_status_update', {
        userId: socket.userId,
        status: 'offline'
      });
    }
  });
});

// API Routes
app.get('/', (req, res) => {
  res.json({
    message: 'Messaging App API',
    status: 'running',
    timestamp: new Date()
  });
});

app.use('/api/auth', authRoutes);

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