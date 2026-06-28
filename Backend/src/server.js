// Backend/src/server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const chatSocket = require('./sockets/chatSocket');
const messageRoutes = require('./routes/messageRoutes');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const friendRoutes = require('./routes/friendRoutes');

require('dotenv').config();

const app = express();
app.use(cors()); // Enable CORS for all routes
app.use(express.json());
const server = http.createServer(app); // Connect Express app into an HTTP server instance
// Initialize Socket.io with CORS rules allowing your React frontend port access
// Inside your Backend file where Socket.io is initialized
const io = require('socket.io')(server, {
    cors: {
        origin: "http://localhost:5173", // Your frontend URL
        methods: ["GET", "POST"]
    },
    // 🛠️ ADD THIS LINE (Raises the limit to 20MB, adjust as needed)
    maxHttpBufferSize: 2e7
});
app.use('/api/messages', messageRoutes);
app.use('/api/auth', authRoutes);

// Pass the configured io instance to our modular socket layout script
chatSocket(io);

// Friend requests need to push real-time events too, so they get the
// same `io` instance plus the shared online-users presence map.
app.use('/api/friends', friendRoutes(io, chatSocket.onlineUsers));

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/chatly')
    .then(() => {
        console.log('📦 Connected to MongoDB successfully!');
    })
    .catch((err) => console.error('❌ MongoDB Connection Error:', err));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server processing on port ${PORT}`));