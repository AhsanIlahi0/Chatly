const express = require('express');
const router = express.Router();
const User = require('../models/User');

// ── POST /api/friends/send-request ─────────────────────────────────────────
// Sends a friend request from senderId → receiverId
router.post('/send-request', async (req, res) => {
    const { senderId, receiverId } = req.body;
    if (!senderId || !receiverId) return res.status(400).json({ error: 'senderId and receiverId are required' });
    if (senderId === receiverId) return res.status(400).json({ error: 'Cannot send request to yourself' });

    try {
        // Check if a relationship already exists in either direction
        const sender = await User.findById(senderId);
        if (!sender) return res.status(404).json({ error: 'Sender not found' });

        const existing = sender.friends.find(
            f => f.recipient.toString() === receiverId
        );
        if (existing) {
            return res.status(400).json({ error: 'Request already sent', status: existing.status });
        }

        // Sender gets status 'requested'; receiver gets status 'pending'
        await User.findByIdAndUpdate(senderId, {
            $push: { friends: { recipient: receiverId, status: 'requested' } }
        });
        await User.findByIdAndUpdate(receiverId, {
            $push: { friends: { recipient: senderId, status: 'pending' } }
        });

        // Real-time socket notification to receiver
        const io = req.app.get('io');
        const onlineUsers = req.app.get('onlineUsers');
        if (io && onlineUsers) {
            const receiverSocketId = onlineUsers.get(receiverId);
            if (receiverSocketId) {
                const populatedSender = await User.findById(senderId).select('name avatar username');
                io.to(receiverSocketId).emit('friendRequestReceived', {
                    senderId,
                    senderName: populatedSender.name,
                    senderAvatar: populatedSender.avatar,
                    senderUsername: populatedSender.username,
                });
            }
        }

        return res.status(200).json({ success: true, message: 'Request sent successfully' });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// ── POST /api/friends/accept-request ───────────────────────────────────────
router.post('/accept-request', async (req, res) => {
    const { userId, requesterId } = req.body; // userId is the one accepting
    if (!userId || !requesterId) return res.status(400).json({ error: 'userId and requesterId are required' });

    try {
        await User.updateOne(
            { _id: userId, 'friends.recipient': requesterId },
            { $set: { 'friends.$.status': 'accepted' } }
        );
        await User.updateOne(
            { _id: requesterId, 'friends.recipient': userId },
            { $set: { 'friends.$.status': 'accepted' } }
        );

        // Notify the original sender in real-time
        const io = req.app.get('io');
        const onlineUsers = req.app.get('onlineUsers');
        if (io && onlineUsers) {
            const requesterSocketId = onlineUsers.get(requesterId);
            if (requesterSocketId) {
                const accepter = await User.findById(userId).select('name avatar username');
                io.to(requesterSocketId).emit('friendRequestAccepted', {
                    accepterId: userId,
                    accepterName: accepter.name,
                    accepterAvatar: accepter.avatar,
                    accepterUsername: accepter.username,
                });
            }
        }

        return res.status(200).json({ success: true, message: 'Friend request accepted' });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// ── POST /api/friends/reject-request ───────────────────────────────────────
router.post('/reject-request', async (req, res) => {
    const { userId, requesterId } = req.body; // userId is the one rejecting
    if (!userId || !requesterId) return res.status(400).json({ error: 'userId and requesterId are required' });

    try {
        // Remove the entry from both sides cleanly
        await User.updateOne(
            { _id: userId },
            { $pull: { friends: { recipient: requesterId } } }
        );
        await User.updateOne(
            { _id: requesterId },
            { $pull: { friends: { recipient: userId } } }
        );

        return res.status(200).json({ success: true, message: 'Request rejected' });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// ── GET /api/friends/pending/:userId ───────────────────────────────────────
// Returns incoming pending requests (other people who sent YOU a request)
router.get('/pending/:userId', async (req, res) => {
    try {
        const user = await User.findById(req.params.userId)
            .populate('friends.recipient', 'name avatar username status');

        if (!user) return res.status(404).json({ error: 'User not found' });

        const pending = user.friends
            .filter(f => f.status === 'pending')
            .map(f => ({
                requesterId: f.recipient._id,
                name: f.recipient.name,
                avatar: f.recipient.avatar,
                username: f.recipient.username,
                status: f.recipient.status,
            }));

        return res.status(200).json(pending);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// ── GET /api/friends/list/:userId ──────────────────────────────────────────
// Returns all accepted friends
router.get('/list/:userId', async (req, res) => {
    try {
        const user = await User.findById(req.params.userId)
            .populate('friends.recipient', '_id name avatar username status');

        if (!user) return res.status(404).json({ error: 'User not found' });

        const friends = user.friends
            .filter(f => f.status === 'accepted')
            .map(f => ({
                id: f.recipient._id,
                name: f.recipient.name,
                avatar: f.recipient.avatar,
                username: f.recipient.username,
                status: f.recipient.status,
            }));

        return res.status(200).json(friends);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// ── GET /api/friends/status/:myId/:otherId ─────────────────────────────────
// Returns the relationship status between two users
router.get('/status/:myId/:otherId', async (req, res) => {
    try {
        const { myId, otherId } = req.params;
        const me = await User.findById(myId);
        if (!me) return res.status(404).json({ error: 'User not found' });

        const entry = me.friends.find(f => f.recipient.toString() === otherId);
        if (!entry) return res.status(200).json({ status: 'none' });

        return res.status(200).json({ status: entry.status });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

module.exports = router;