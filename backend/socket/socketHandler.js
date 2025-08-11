module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on('join_room', (roomId) => {
      socket.join(roomId);
      console.log(`User ${socket.id} joined room: ${roomId}`);
    });

    socket.on('private_message', ({ roomId, message, senderId, recipientId }) => {
      socket.to(roomId).emit('receive_message', {
        message,
        senderId,
        recipientId,
        timestamp: new Date()
      });
    });

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

    socket.on('user_status', (status) => {
      socket.broadcast.emit('user_status_update', {
        userId: socket.userId,
        status
      });
    });

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
};
