const { Server } = require('socket.io');

const initializeSocket = (server) => {
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
    
    // Handle user joining a room (for private messaging)
    socket.on('join_room', (roomId) => {
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

    // Handle typing indicators using eclipseIds
    socket.on('typing_start', async (data) => {
      const { recipientEclipseId } = data;
      const recipient = await findUserByEclipseId(recipientEclipseId);
      
      if (recipient) {
        const roomId = generateRoomId(socket.eclipseId, recipientEclipseId);
        socket.to(roomId).emit('user_typing', {
          eclipseId: socket.eclipseId,
          username: socket.user.username,
          isTyping: true
        });
      }
    });

    socket.on('typing_stop', async (data) => {
      const { recipientEclipseId } = data;
      const recipient = await findUserByEclipseId(recipientEclipseId);
      
      if (recipient) {
        const roomId = generateRoomId(socket.eclipseId, recipientEclipseId);
        socket.to(roomId).emit('user_typing', {
          eclipseId: socket.eclipseId,
          username: socket.user.username,
          isTyping: false
        });
      }
    });

    // Handle user status updates
    socket.on('user_status', (status) => {
      socket.broadcast.emit('user_status_update', {
        eclipseId: socket.eclipseId,
        username: socket.user.username,
        status
      });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user.eclipseId} (${socket.id})`);
      socket.broadcast.emit('user_status_update', {
        eclipseId: socket.eclipseId,
        username: socket.user.username,
        status: 'offline'
      });
    });
  });

  return io;
};

// Helper function to generate consistent room IDs using eclipseIds
function generateRoomId(eclipseId1, eclipseId2) {
  return [eclipseId1, eclipseId2].sort().join('_');
}

module.exports = initializeSocket;