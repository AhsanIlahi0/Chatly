// Backend/src/server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const chatSocket = require('./sockets/chatSocket');
const messageRoutes = require('./routes/messageRoutes');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors()); // Enable CORS for all routes
const server = http.createServer(app); // Connect Express app into an HTTP server instance

// Initialize Socket.io with CORS rules allowing your React frontend port access
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173", // Your default Vite React dev port
        methods: ["GET", "POST"]
    }
});
app.use('/api/messages', messageRoutes);

// Pass the configured io instance to our modular socket layout script
chatSocket(io);
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/chatly')
    .then(() => console.log('📦 Connected to MongoDB successfully!'))
    .catch((err) => console.error('❌ MongoDB Connection Error:', err));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server processing on port ${PORT}`));