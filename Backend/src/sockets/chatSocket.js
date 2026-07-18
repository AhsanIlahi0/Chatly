const Message = require('../models/Message');
const User = require('../models/User');

// Accept both io and app so we can share onlineUsers via app.set
const chatSocket = (io, app) => {
    const onlineUsers = new Map(); // userId → socketId

    // Make onlineUsers available to HTTP route handlers (friend routes need it for notifications)
    if (app) app.set('onlineUsers', onlineUsers);

    const broadcastUserStatus = async (userId, status) => {
        if (!userId) return;
        try { await User.findByIdAndUpdate(userId, { status }); }
        catch (err) { console.error('Failed to persist user status:', err); }
        io.emit('userStatusChanged', { userId, status });
    };

    const emitMessageStatusUpdate = (messageIds, status, partnerId) => {
        const payload = { messageIds, status, partnerId };
        if (partnerId && onlineUsers.has(partnerId)) {
            io.to(onlineUsers.get(partnerId)).emit('messageStatusUpdated', payload);
        }
    };

    io.on('connection', (socket) => {

        socket.on('registerUser', async (userId) => {
            onlineUsers.set(userId, socket.id);
            await broadcastUserStatus(userId, 'online');
        });

        socket.on('sendMessage', async (messageData) => {
            const { senderId, receiverId, text, file } = messageData;
            try {
                const newMessage = await Message.create({
                    sender: senderId,
                    receiver: receiverId,
                    text,
                    file,
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

                // Echo back to sender so UI gets the DB id
                io.to(socket.id).emit('receiveMessage', payload);

                // Deliver to receiver if online
                const targetSocketId = onlineUsers.get(receiverId);
                if (targetSocketId) {
                    io.to(targetSocketId).emit('receiveMessage', payload);
                    await Message.updateOne({ _id: newMessage._id }, { status: 'delivered' });
                    emitMessageStatusUpdate([newMessage._id.toString()], 'delivered', senderId);
                }
            } catch (err) {
                console.error('Error saving message:', err);
            }
        });

        socket.on('markMessagesRead', async ({ readerId, partnerId }) => {
            if (!readerId || !partnerId) return;
            try {
                const unread = await Message.find({
                    sender: partnerId,
                    receiver: readerId,
                    status: { $ne: 'read' }
                }).select('_id');

                if (!unread.length) return;

                const ids = unread.map(m => m._id.toString());
                await Message.updateMany({ _id: { $in: ids } }, { $set: { status: 'read' } });
                emitMessageStatusUpdate(ids, 'read', partnerId);
            } catch (err) {
                console.error('Error marking messages read:', err);
            }
        });

        socket.on('updateAvatar', (payload) => {
            socket.broadcast.emit('userAvatarChanged', payload);
        });

        socket.on('disconnect', () => {
            for (let [userId, socketId] of onlineUsers.entries()) {
                if (socketId === socket.id) {
                    onlineUsers.delete(userId);
                    broadcastUserStatus(userId, 'offline');
                    break;
                }
            }
        });
    });
};

module.exports = chatSocket;