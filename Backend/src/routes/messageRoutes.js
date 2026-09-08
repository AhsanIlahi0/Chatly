// Backend/src/routes/messageRoutes.js
const express = require('express');
const router = express.Router();
const {
    getChatHistory,
    getConversationSummaries,
    deleteMessage,
    clearChat
} = require("../controllers/messageController");
router.get("/summary/:myId", getConversationSummaries);
// This defines the URL endpoint. The ':myId' and ':partnerId' are variable placeholders
router.get('/:myId/:partnerId', getChatHistory);
router.delete('/clear/:myId/:partnerId', clearChat);
router.delete('/:messageId', deleteMessage);

module.exports = router;