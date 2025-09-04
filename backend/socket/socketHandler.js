const { Server } = require('socket.io');





let ioInstance = null;
const getSocketIO = () => {
    return ioInstance;
};

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
  ioInstance = io;
  const onlineUsers = new Map();
  const userSockets = new Map();

  // Socket.IO connection handling
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);
    
    // Handle user authentication/registration for presence tracking
    socket.on('user_authenticated', (userData) => {
      const { eclipseId, username } = userData;
      
      // Store user info on socket
      socket.eclipseId = eclipseId;
      socket.username = username;
      
      // Track the user as online
      onlineUsers.set(eclipseId, {
        socketId: socket.id,
        username,
        status: 'online',
        lastSeen: new Date()
      });
      
      // Map socket to user
      userSockets.set(socket.id, eclipseId);
      console.log(`User authenticated: ${username} (${eclipseId})`);
      socket.broadcast.emit('user_status_update', {
        eclipseId,
        username,
        status: 'online',
        timestamp: new Date()
      });
      const onlineUsersList = Array.from(onlineUsers.entries()).map(([id, data]) => ({
        eclipseId: id,
        username: data.username,
        status: data.status,
        lastSeen: data.lastSeen
      }));
      
      socket.emit('online_users_list', onlineUsersList);
    });

    // Handle user joining a room
    socket.on('join_room', (roomId) => {
      socket.join(roomId);
      console.log(`User ${socket.id} joined room: ${roomId}`);
    });

    // Handle private message
    socket.on('private_message', (data) => {
      const { roomId, message, senderId, recipientId } = data;
      
      // Update sender's last activity
      updateUserActivity(senderId);
      
      socket.to(roomId).emit('receive_message', {
        message,
        senderId,
        recipientId,
        timestamp: new Date()
      });
    });

    // Handle manual status changes (online, away, busy, etc.)
    socket.on('change_status', (newStatus) => {
      const eclipseId = socket.eclipseId;
      
      if (eclipseId && onlineUsers.has(eclipseId)) {
        const userData = onlineUsers.get(eclipseId);
        userData.status = newStatus;
        userData.lastSeen = new Date();
        onlineUsers.set(eclipseId, userData);
        socket.broadcast.emit('user_status_update', {
          eclipseId,
          username: userData.username,
          status: newStatus,
          timestamp: new Date()
        });
        
        console.log(`User ${userData.username} changed status to: ${newStatus}`);
      }
    });
    socket.on('ping', () => {
      const eclipseId = socket.eclipseId;
      updateUserActivity(eclipseId);
      socket.emit('pong'); // Respond to client
    });
    socket.on('typing_start', (data) => {
      const { recipientEclipseId } = data;
      const roomId = generateRoomId(socket.eclipseId, recipientEclipseId);
      
      socket.to(roomId).emit('user_typing', {
        eclipseId: socket.eclipseId,
        username: socket.username,
        isTyping: true
      });
      updateUserActivity(socket.eclipseId);
    });

    socket.on('typing_stop', (data) => {
      const { recipientEclipseId } = data;
      const roomId = generateRoomId(socket.eclipseId, recipientEclipseId);
      
      socket.to(roomId).emit('user_typing', {
        eclipseId: socket.eclipseId,
        username: socket.username,
        isTyping: false
      });
    });
    socket.on('user_activity', () => {
      updateUserActivity(socket.eclipseId);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      const eclipseId = userSockets.get(socket.id);
      
      if (eclipseId) {
        const userData = onlineUsers.get(eclipseId);
        
        if (userData) {
          console.log(`User disconnected: ${userData.username} (${eclipseId})`);
          onlineUsers.delete(eclipseId);
          userSockets.delete(socket.id);
          socket.broadcast.emit('user_status_update', {
            eclipseId,
            username: userData.username,
            status: 'offline',
            timestamp: new Date()
          });
        }
      } else {
        console.log(`User disconnected: ${socket.id} (unauthenticated)`);
      }
    });
  });

  // Helper function to update user's last activity
  function updateUserActivity(eclipseId) {
    if (eclipseId && onlineUsers.has(eclipseId)) {
      const userData = onlineUsers.get(eclipseId);
      userData.lastSeen = new Date();
      if (userData.status === 'away' || userData.status === 'idle') {
        userData.status = 'online';
        // Broadcast status change
        io.emit('user_status_update', {
          eclipseId,
          username: userData.username,
          status: 'online',
          timestamp: new Date()
        });
      }
      
      onlineUsers.set(eclipseId, userData);
    }
  }
  setInterval(() => {
    const now = new Date();
    const idleThreshold = 5 * 60 * 1000;
    const awayThreshold = 15 * 60 * 1000;
    
    onlineUsers.forEach((userData, eclipseId) => {
      const timeSinceActivity = now - userData.lastSeen;
      let newStatus = userData.status;
      
      if (timeSinceActivity > awayThreshold && userData.status !== 'away') {
        newStatus = 'away';
      } else if (timeSinceActivity > idleThreshold && userData.status === 'online') {
        newStatus = 'idle';
      }
      
      if (newStatus !== userData.status) {
        userData.status = newStatus;
        onlineUsers.set(eclipseId, userData);
        io.emit('user_status_update', {
          eclipseId,
          username: userData.username,
          status: newStatus,
          timestamp: new Date()
        });
        
        console.log(`User ${userData.username} automatically changed to: ${newStatus}`);
      }
    });
  }, 60000);

  // Expose method to get online users (useful for REST API endpoints)
  io.getOnlineUsers = () => {
    return Array.from(onlineUsers.entries()).map(([id, data]) => ({
      eclipseId: id,
      username: data.username,
      status: data.status,
      lastSeen: data.lastSeen
    }));
  };

  return io;
};

// Helper function to generate consistent room IDs using eclipseIds
function generateRoomId(eclipseId1, eclipseId2) {
  return [eclipseId1, eclipseId2].sort().join('_');
}

module.exports = { initializeSocket, getSocketIO };