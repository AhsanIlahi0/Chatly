// Backend/src/server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const path = require('path'); // Moved up so it can be used below

// Cleaned up dotenv initialization to use pure CommonJS path resolution
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const chatSocket = require('./sockets/chatSocket');
const messageRoutes = require('./routes/messageRoutes');
const cors = require('cors');
const authRoutes = require('./routes/auth');

const app = express();
app.use(cors()); // Enable CORS for all routes
app.use(express.json());
const server = http.createServer(app); 

// Inside your Backend file where Socket.io is initialized
const io = require('socket.io')(server, {
    cors: {
        origin: ["http://localhost:5173", "https://chatly-gamma-ten.vercel.app"],
        methods: ["GET", "POST"]
    },
    maxHttpBufferSize: 2e7
});
app.set('io', io);
app.use('/api/messages', messageRoutes);
app.use('/api/auth', authRoutes);

// Pass the configured io instance to our modular socket layout script
chatSocket(io);

// Add the Nodemailer connection verification test here if you'd like to check it!

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/chatly')
    .then(async () => {
        console.log('📦 Connected to MongoDB successfully!');

        // 🚀 AUTO-SEED TEST USERS FOR POWERSHELL WORKAROUND
        try {
            const User = require('./models/User'); // Double check this path to your User schema file
        } catch (seedErr) {
            console.error("Auto-seeding skipped/failed:", seedErr.message);
        }
    })
    .catch((err) => console.error('❌ MongoDB Connection Error:', err));

app.get('/', (req, res) => {
    res.send('🚀 Chatly Backend is running!');
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server processing on port ${PORT}`));