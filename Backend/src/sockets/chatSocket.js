const Message = require('../models/Message');
const User = require('../models/User');


const chatSocket = (io) => {
    const onlineUsers = new Map(); // Tracks { userId: socketId }

    const emitMessageStatusUpdate = (messageIds, status, partnerId, recipientId) => {
        const payload = {
            messageIds,
            status,
            partnerId,
            recipientId
        };

        if (partnerId && onlineUsers.has(partnerId)) {
            io.to(onlineUsers.get(partnerId)).emit('messageStatusUpdated', payload);
        }
    };

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
                        username: userDetails.username,
                        unread: 0
                    });
                }
            } catch (err) {
                console.error(err);
            }
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
                    file: file,
                    status: 'sent'
                });

                const payload = {
                    id: newMessage._id.toString(),
                    senderId,
                    receiverId,
                    text,
                    file,
                    time: newMessage.createdAt,
                    status: newMessage.status
                };

                // Send the saved message back to the sender so the UI can keep the database id.
                io.to(socket.id).emit('receiveMessage', payload);

                // 3. Emit it live to the receiver exactly like before
                const targetSocketId = onlineUsers.get(receiverId);
                if (targetSocketId) {
                    io.to(targetSocketId).emit('receiveMessage', {
                        ...payload
                    });

                    await Message.updateOne({ _id: newMessage._id }, { status: 'delivered' });
                    emitMessageStatusUpdate([newMessage._id.toString()], 'delivered', senderId, receiverId);
                }
            } catch (err) {
                console.error("Error saving message with file asset:", err);
            }
        });

        socket.on('markMessagesRead', async ({ readerId, partnerId }) => {
            if (!readerId || !partnerId) return;

            try {
                const unreadMessages = await Message.find({
                    sender: partnerId,
                    receiver: readerId,
                    status: { $ne: 'read' }
                }).select('_id');

                if (!unreadMessages.length) return;

                const messageIds = unreadMessages.map((message) => message._id.toString());

                await Message.updateMany(
                    { _id: { $in: messageIds } },
                    { $set: { status: 'read' } }
                );

                emitMessageStatusUpdate(messageIds, 'read', partnerId, readerId);
            } catch (err) {
                console.error('Error marking messages as read:', err);
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
        // Inside Backend/src/sockets/chatSocket.js
        // Look for your module.exports = (io) => { io.on('connection', (socket) => { ... }) }

        // 🚀 ADD THIS LISTENER INSIDE THE CONNECTION BLOCK:
        socket.on('updateAvatar', (payload) => {
            // payload = { userId: "...", avatarUrl: "..." }
            // Broadcast it out to all other active tabs instantly
            socket.broadcast.emit('userAvatarChanged', payload);
        });
    });
};

module.exports = chatSocket;
