// Backend/src/routes/messageRoutes.js
const express = require('express');
const router = express.Router();
const { getChatHistory, deleteMessage } = require('../controllers/messageController');

// This defines the URL endpoint. The ':myId' and ':partnerId' are variable placeholders
router.get('/:myId/:partnerId', getChatHistory);
router.delete('/:messageId', deleteMessage);

module.exports = router;