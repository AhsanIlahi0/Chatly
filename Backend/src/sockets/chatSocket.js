const Message = require('../models/Message');
const User = require('../models/User');

// Tracks { userId: socketId } for everyone currently connected.
// Exported so other modules (like friendRoutes) can notify a specific
// user in real time without needing their own socket bookkeeping.
const onlineUsers = new Map();

const chatSocket = (io) => {

    io.on('connection', (socket) => {

        socket.on("registerUser", async (userId) => {
            onlineUsers.set(userId, socket.id);

            // 🚀 FETCH USER INFO AND BROADCAST PRESENCE
            try {
                const userDetails = await User.findById(userId);
                if (userDetails) {
                    // Tell every single active socket client that a new user went live
                    socket.broadcast.emit("userStatusChanged", {
                        id: userDetails._id,
                        name: userDetails.name,
                        status: 'online'
                    });
                }
            } catch (err) {
                console.error(err);
            }
        });

        // 🛠️ SAVE & EMIT REAL-TIME INTERACTION
        socket.on('sendMessage', async (messageData) => {
            const { senderId, receiverId, text, file } = messageData;

            try {
                const newMessage = await Message.create({
                    sender: senderId,
                    receiver: receiverId,
                    text: text,
                    file: file
                });

                const targetSocketId = onlineUsers.get(receiverId);
                if (targetSocketId) {
                    io.to(targetSocketId).emit('receiveMessage', {
                        id: newMessage._id,
                        senderId,
                        receiverId,
                        text,
                        file,
                        time: newMessage.createdAt
                    });
                }
            } catch (err) {
                console.error("Error saving message with file asset:", err);
            }
        });

        // 3. Handle sudden disconnections
        socket.on('disconnect', () => {
            for (let [userId, socketId] of onlineUsers.entries()) {
                if (socketId === socket.id) {
                    onlineUsers.delete(userId);
                    io.emit('userStatusChanged', { id: userId, status: 'offline' });
                    console.log(`❌ User ${userId} disconnected`);
                    break;
                }
            }
        });

        // 🚀 Broadcast live avatar updates
        socket.on('updateAvatar', (payload) => {
            socket.broadcast.emit('userAvatarChanged', payload);
        });
    });
};

module.exports = chatSocket;
module.exports.onlineUsers = onlineUsers;
