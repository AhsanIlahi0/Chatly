const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const chatSocket = require('./sockets/chatSocket');
const messageRoutes = require('./routes/messageRoutes');
const authRoutes = require('./routes/auth');
const friendRoutes = require('./routes/friendRoutes');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

const ALLOWED_ORIGINS = [
    'http://localhost:5173',
    'https://chatly-gamma-ten.vercel.app',
    'https://chat-ly.dev',
    'https://www.chat-ly.dev'
];

const isAllowedOrigin = (origin) => (
    !origin
    || ALLOWED_ORIGINS.includes(origin)
    || /^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin)
);

app.use(cors({ origin: isAllowedOrigin, credentials: true }));
app.use(express.json());

const io = new Server(server, {
    cors: { origin: isAllowedOrigin, methods: ['GET', 'POST'] },
    maxHttpBufferSize: 2e7
});

app.set('io', io);
chatSocket(io, app);  // pass app so socket can access onlineUsers via app.get('onlineUsers')

app.use('/api/messages', messageRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/friends', friendRoutes);

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('✅ MongoDB connected');
        server.listen(PORT,"0.0.0.0", () => console.log(`🚀 Server running on port ${PORT}`));
    })
    .catch((err) => console.error('❌ MongoDB connection failed:', err));

app.get('/', (req, res) => res.send('Chatly backend is live.'));