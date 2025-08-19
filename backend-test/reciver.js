const { io } = require("socket.io-client");

const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4OWMyYTU4NDNlMzcyMmQ1N2RlYjhlMiIsImlhdCI6MTc1NTA2NTAwNSwiZXhwIjoxNzU1MTUxNDA1fQ.Jaqjqebmr3q8-kyZVlsdS4_BMBNfH7gvUtR5rfQQ0Cw";
const receiverId = "XQINDXMG"; 

// First test without auth to see if basic connection works
const socket = io("http://localhost:5001", {
    // Temporarily remove auth to test basic connection
    auth: { token: `Bearer ${token}` }
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