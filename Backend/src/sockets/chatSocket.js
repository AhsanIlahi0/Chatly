const Message = require('../models/Message');

const chatSocket = (io) => {
    const onlineUsers = new Map(); // Tracks { userId: socketId }

    io.on('connection', (socket) => {

        socket.on('registerUser', (userId) => {
            onlineUsers.set(userId, socket.id);
            io.emit('userStatusChanged', { userId, status: 'online' });
            
        });

        // 🛠️ SAVE & EMIT REAL-TIME INTERACTION
        // Inside Backend/src/sockets/chatSocket.js
        // Inside your Backend socket file
        socket.on('sendMessage', async (messageData) => {
            // 1. Destructure the file field from the incoming message data
            const { senderId, receiverId, text, file } = messageData;

            try {
                // 2. Insert it cleanly into your Mongoose save statement
                const newMessage = await Message.create({
                    sender: senderId,
                    receiver: receiverId,
                    text: text,
                    file: file // 👈 ENSURE THIS LINE IS ACTIVE
                });

                // 3. Emit it live to the receiver exactly like before
                const targetSocketId = onlineUsers.get(receiverId);
                if (targetSocketId) {
                    io.to(targetSocketId).emit('receiveMessage', {
                        id: newMessage._id,
                        senderId,
                        receiverId,
                        text,
                        file, // Send it out to the active listener
                        time: newMessage.createdAt
                    });
                }
            } catch (err) {
                console.error("Error saving message with file asset:", err);
            }
        });
        // 3. Handle sudden disconnections
        socket.on('disconnect', () => {

            // Find and prune the disconnected user from our online tracking map
            for (let [userId, socketId] of onlineUsers.entries()) {
                if (socketId === socket.id) {
                    onlineUsers.delete(userId);
                    io.emit('userStatusChanged', { userId, status: 'offline' });
                    console.log(`❌ User ${userId} disconnected`);

                    break;
                }
            }
        });
    });
};

module.exports = chatSocket;