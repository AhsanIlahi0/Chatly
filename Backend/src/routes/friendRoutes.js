const express = require('express');
const User = require('../models/User');
const FriendRequest = require('../models/FriendRequest');

// Exported as a factory so server.js can hand us the live `io` instance
// and the shared `onlineUsers` map — that's what lets a friend request
// (and its accept/decline) show up for the other person instantly,
// without them needing to refresh the page.
module.exports = (io, onlineUsers) => {
    const router = express.Router();

    const notifyUser = (userId, event, payload) => {
        const socketId = onlineUsers?.get(String(userId));
        if (socketId) {
            io.to(socketId).emit(event, payload);
        }
    };

    // 📨 PersonA -> PersonB: send a friend request
    router.post('/request', async (req, res) => {
        try {
            const { senderId, receiverId } = req.body;

            if (!senderId || !receiverId) {
                return res.status(400).json({ error: 'senderId and receiverId are required' });
            }
            if (senderId === receiverId) {
                return res.status(400).json({ error: "You can't send a friend request to yourself" });
            }

            const receiverExists = await User.exists({ _id: receiverId });
            if (!receiverExists) {
                return res.status(404).json({ error: 'That user no longer exists' });
            }

            // If the other person already sent ME a pending request, sending
            // one back should just complete the match instead of erroring out.
            const reverseRequest = await FriendRequest.findOne({ sender: receiverId, receiver: senderId });
            if (reverseRequest) {
                if (reverseRequest.status === 'accepted') {
                    return res.status(400).json({ error: 'You are already friends with this user' });
                }

                reverseRequest.status = 'accepted';
                await reverseRequest.save();

                const [senderUser, receiverUser] = await Promise.all([
                    User.findById(senderId).select('-password'),
                    User.findById(receiverId).select('-password')
                ]);

                notifyUser(receiverId, 'friendRequestAccepted', { request: reverseRequest, friend: senderUser });

                return res.status(200).json({
                    success: true,
                    status: 'accepted',
                    message: 'You are now friends!',
                    friend: receiverUser
                });
            }

            const existing = await FriendRequest.findOne({ sender: senderId, receiver: receiverId });
            if (existing) {
                if (existing.status === 'accepted') {
                    return res.status(400).json({ error: 'You are already friends with this user' });
                }
                return res.status(400).json({ error: 'Friend request already sent' });
            }

            const newRequest = await FriendRequest.create({ sender: senderId, receiver: receiverId, status: 'pending' });
            const senderUser = await User.findById(senderId).select('-password');

            notifyUser(receiverId, 'friendRequestReceived', {
                requestId: newRequest._id,
                from: senderUser
            });

            return res.status(201).json({
                success: true,
                status: 'pending',
                message: 'Friend request sent!',
                request: newRequest
            });
        } catch (err) {
            if (err.code === 11000) {
                return res.status(400).json({ error: 'Friend request already sent' });
            }
            console.error('Send friend request failed:', err);
            return res.status(500).json({ error: err.message });
        }
    });

    // ✅ Receiver accepts -> both users now show up in each other's chat list
    router.post('/accept', async (req, res) => {
        try {
            const { requestId, userId } = req.body; // userId = the person accepting

            const request = await FriendRequest.findById(requestId);
            if (!request) return res.status(404).json({ error: 'Friend request not found' });
            if (String(request.receiver) !== String(userId)) {
                return res.status(403).json({ error: 'You are not authorized to accept this request' });
            }
            if (request.status === 'accepted') {
                return res.status(400).json({ error: 'Request already accepted' });
            }

            request.status = 'accepted';
            await request.save();

            const [accepter, requester] = await Promise.all([
                User.findById(request.receiver).select('-password'),
                User.findById(request.sender).select('-password')
            ]);

            // Tell the original sender, in real time, that they have a new friend
            notifyUser(request.sender, 'friendRequestAccepted', { request, friend: accepter });

            return res.status(200).json({ success: true, message: 'Friend request accepted!', friend: requester });
        } catch (err) {
            console.error('Accept friend request failed:', err);
            return res.status(500).json({ error: err.message });
        }
    });

    // ❌ Receiver declines -> request is removed, sender can try again later
    router.post('/decline', async (req, res) => {
        try {
            const { requestId, userId } = req.body; // userId = the person declining

            const request = await FriendRequest.findById(requestId);
            if (!request) return res.status(404).json({ error: 'Friend request not found' });
            if (String(request.receiver) !== String(userId)) {
                return res.status(403).json({ error: 'You are not authorized to decline this request' });
            }

            await FriendRequest.findByIdAndDelete(requestId);

            notifyUser(request.sender, 'friendRequestDeclined', { requestId: String(requestId) });

            return res.status(200).json({ success: true, message: 'Friend request declined' });
        } catch (err) {
            console.error('Decline friend request failed:', err);
            return res.status(500).json({ error: err.message });
        }
    });

    // 🚫 Sender cancels a request before the other person responds
    router.post('/cancel', async (req, res) => {
        try {
            const { requestId, userId } = req.body; // userId = the original sender

            const request = await FriendRequest.findById(requestId);
            if (!request) return res.status(404).json({ error: 'Friend request not found' });
            if (String(request.sender) !== String(userId)) {
                return res.status(403).json({ error: 'You are not authorized to cancel this request' });
            }

            await FriendRequest.findByIdAndDelete(requestId);

            notifyUser(request.receiver, 'friendRequestCancelled', { requestId: String(requestId) });

            return res.status(200).json({ success: true, message: 'Friend request cancelled' });
        } catch (err) {
            console.error('Cancel friend request failed:', err);
            return res.status(500).json({ error: err.message });
        }
    });

    // 📥 Pending requests waiting on MY response
    router.get('/:userId/incoming', async (req, res) => {
        try {
            const { userId } = req.params;
            const requests = await FriendRequest.find({ receiver: userId, status: 'pending' })
                .populate('sender', '-password')
                .sort({ createdAt: -1 });
            return res.status(200).json(requests);
        } catch (err) {
            console.error('Fetch incoming requests failed:', err);
            return res.status(500).json({ error: err.message });
        }
    });

    // 📤 Pending requests I sent that are still awaiting a response
    router.get('/:userId/outgoing', async (req, res) => {
        try {
            const { userId } = req.params;
            const requests = await FriendRequest.find({ sender: userId, status: 'pending' })
                .populate('receiver', '-password')
                .sort({ createdAt: -1 });
            return res.status(200).json(requests);
        } catch (err) {
            console.error('Fetch outgoing requests failed:', err);
            return res.status(500).json({ error: err.message });
        }
    });

    // 🔍 Every other user in the database, tagged with my relationship to them
    // (none / outgoing pending / incoming pending / accepted) so the
    // "Find People" screen can render the right button for each person.
    router.get('/:userId/discover', async (req, res) => {
        try {
            const { userId } = req.params;

            const [allUsers, relations] = await Promise.all([
                User.find({ _id: { $ne: userId } }).select('-password'),
                FriendRequest.find({ $or: [{ sender: userId }, { receiver: userId }] })
            ]);

            const relationMap = new Map();
            relations.forEach(r => {
                const isSender = String(r.sender) === String(userId);
                const otherId = String(isSender ? r.receiver : r.sender);
                relationMap.set(otherId, {
                    requestId: r._id,
                    status: r.status, // pending | accepted | declined
                    direction: isSender ? 'outgoing' : 'incoming'
                });
            });

            const results = allUsers.map(u => ({
                ...u.toObject(),
                relationship: relationMap.get(String(u._id)) || null
            }));

            return res.status(200).json(results);
        } catch (err) {
            console.error('Discover users failed:', err);
            return res.status(500).json({ error: err.message });
        }
    });

    // 👥 My accepted friends — this is what populates the chat sidebar
    router.get('/:userId', async (req, res) => {
        try {
            const { userId } = req.params;
            const accepted = await FriendRequest.find({
                status: 'accepted',
                $or: [{ sender: userId }, { receiver: userId }]
            })
                .populate('sender', '-password')
                .populate('receiver', '-password');

            const friends = accepted
                .filter(r => r.sender && r.receiver) // guard against a deleted user account
                .map(r => {
                    const isSender = String(r.sender._id) === String(userId);
                    return isSender ? r.receiver : r.sender;
                });

            return res.status(200).json(friends);
        } catch (err) {
            console.error('Fetch friends failed:', err);
            return res.status(500).json({ error: err.message });
        }
    });

    return router;
};
