const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
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
    text: {
        type: String,
        trim: true
        // 🛠️ REMOVED: required: true (Allows users to send standalone files/images)
    },
    file: {
        url: { 
            type: String, 
            trim: true 
        }, // Stores the Base64 string or cloud storage URL
        name: { 
            type: String, 
            trim: true 
        }, // e.g., "screenshot.png" or "document.pdf"
        type: { 
            type: String, 
            trim: true 
        }  // e.g., "image/png" or "application/pdf"
    },
    status: {
        type: String,
        enum: ['sent', 'delivered', 'read'],
        default: 'read'
    }
}, { timestamps: true }); // Automatically injects `createdAt` and `updatedAt` field timestamps

// CRITICAL: Index the fields to ensure your database stays lightning-fast even with millions of messages
MessageSchema.index({ sender: 1, receiver: 1, createdAt: -1 });

module.exports = mongoose.model('Message', MessageSchema);
