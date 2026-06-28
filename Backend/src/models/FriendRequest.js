const mongoose = require('mongoose');

// One document per "Person A asked Person B to be friends" event.
// We keep sent/declined requests deletable so people can re-send later,
// while accepted ones stick around forever as the source of truth for
// "who is on whose chat list".
const FriendRequestSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'declined'],
        default: 'pending'
    }
}, { timestamps: true });

// Stop the same person from spamming duplicate requests at the same target.
FriendRequestSchema.index({ sender: 1, receiver: 1 }, { unique: true });

// Fast lookups for "show me everything pending for/by this user".
FriendRequestSchema.index({ receiver: 1, status: 1 });
FriendRequestSchema.index({ sender: 1, status: 1 });

module.exports = mongoose.model('FriendRequest', FriendRequestSchema);
