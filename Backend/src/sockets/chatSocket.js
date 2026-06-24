const Message = require('../models/Message');

const chatSocket = (io) => {
    const onlineUsers = new Map(); // Tracks { userId: socketId }

    io.on('connection', (socket) => {

        socket.on('registerUser', (userId) => {
            onlineUsers.set(userId, socket.id);
            io.emit('userStatusChanged', { userId, status: 'online' });
        });

        // 🛠️ SAVE & EMIT REAL-TIME INTERACTION
        socket.on('sendMessage', async (messageData) => {
            const { senderId, receiverId, text } = messageData;

            try {
                // 1. Commit the message directly to the MongoDB cluster
                const newMessage = await Message.create({
                    sender: senderId,
                    receiver: receiverId,
                    text: text
                });

                const targetSocketId = onlineUsers.get(receiverId);

                // 2. Forward the complete payload down the socket pipe to the recipient
                if (targetSocketId) {
                    io.to(targetSocketId).emit('receiveMessage', {
                        id: newMessage._id, // Pass real database generated ID
                        senderId,
                        text,
                        time: newMessage.createdAt
                    });
                }
            } catch (err) {
                console.error("Socket failed to process message entry:", err);
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