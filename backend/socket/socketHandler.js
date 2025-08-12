const { Server } = require('socket.io');

const initializeSocket = (server) => {
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
    socket.on('join_room', (roomId) => {
      socket.join(roomId);
      console.log(`User ${socket.id} joined room: ${roomId}`);
    });
    socket.on('private_message', (data) => {
      const { roomId, message, senderId, recipientId } = data;
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

  return io;
};

module.exports = initializeSocket;