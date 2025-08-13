const { io } = require("socket.io-client");

const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4OWMxZTY0MmZhYWIyYWRjZDM4ZWNlNiIsImlhdCI6MTc1NTA2MTg5MiwiZXhwIjoxNzU1MTQ4MjkyfQ.tXE4gxHmFL3XxPnrnz7N6uiwUCnHpOo5Hez3m9n3MMQ";
const receiverId = "SJU0J5UY"; 

// First test without auth to see if basic connection works
const socket = io("http://localhost:5001", {
    // Temporarily remove auth to test basic connection
    // auth: { token: `Bearer ${token}` }
});

socket.on("connect", () => {
    console.log("Receiver connected:", socket.id);
    
    // Join personal room for receiving messages
    const personalRoom = `user_${receiverId}`;
    socket.emit("join_room", personalRoom);
    console.log(`Joined personal room: ${personalRoom}`);
});

socket.on("receive_message", (msg) => {
    console.log("📩 Message received:", msg);
    console.log("Content:", msg.content);
    console.log("From:", msg.sender.displayName || msg.sender.username);
    console.log("Timestamp:", msg.timestamp);
});

socket.on("user_typing", (data) => {
    console.log(`${data.username} is ${data.isTyping ? 'typing...' : 'stopped typing'}`);
});

socket.on("connect_error", (error) => {
    console.error("Connection error:", error.message);
});

socket.on("disconnect", (reason) => {
    console.log("Receiver disconnected. Reason:", reason);
});