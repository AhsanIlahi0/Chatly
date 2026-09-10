const mongoose = require('mongoose');

const AiMessageSchema = new mongoose.Schema({
    clientId: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['user', 'assistant'],
        required: true
    },
    text: {
        type: String,
        required: true,
        trim: true,
        maxlength: 8000
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, { _id: false });

const AiConversationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
        index: true
    },
    messages: {
        type: [AiMessageSchema],
        default: []
    }
}, { timestamps: true });

module.exports = mongoose.model('AiConversation', AiConversationSchema);
