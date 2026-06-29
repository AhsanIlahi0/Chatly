const express = require('express');
const router = express.Router();
const User = require('../models/User'); // Ensure this path is correct

router.post('/send-request', async (req, res) => {
    const { senderId, receiverId } = req.body;
    try {
        // Push "requested" to sender
        await User.findByIdAndUpdate(senderId, {
            $push: { friends: { recipient: receiverId, status: 'requested' } }
        });
        // Push "pending" to receiver
        await User.findByIdAndUpdate(receiverId, {
            $push: { friends: { recipient: senderId, status: 'pending' } }
        });
        res.status(200).json({ success: true, message: "Request sent successfully!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
router.post('/accept-request', async (req, res) => {
    const { userId, requesterId } = req.body; // userId is the one accepting
    try {
        // Update user's status to accepted
        await User.updateOne(
            { _id: userId, "friends.recipient": requesterId },
            { $set: { "friends.$.status": 'accepted' } }
        );
        // Update the original sender's status to accepted
        await User.updateOne(
            { _id: requesterId, "friends.recipient": userId },
            { $set: { "friends.$.status": 'accepted' } }
        );
        res.status(200).json({ success: true, message: "Friend request accepted!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});