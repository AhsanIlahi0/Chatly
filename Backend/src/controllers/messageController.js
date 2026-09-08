// Backend/src/controllers/messageController.js
const Message = require('../models/Message');

exports.getChatHistory = async (req, res) => {
    try {
        const { myId, partnerId } = req.params;

        const history = await Message.find({
            $or: [
                { sender: myId, receiver: partnerId },
                { sender: partnerId, receiver: myId }
            ]
        }).sort({ createdAt: 1 });

        const visibleHistory = history.filter((msg) =>
            !msg.hiddenFor?.some((hiddenUserId) => String(hiddenUserId) === String(myId))
        );

        return res.status(200).json(visibleHistory);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
exports.getConversationSummaries = async (req, res) => {
    try {
        const { myId } = req.params;

        const messages = await Message.find({
            $or: [
                { sender: myId },
                { receiver: myId }
            ]
        }).sort({ createdAt: -1 });

        const visibleMessages = messages.filter((msg) =>
            !msg.hiddenFor?.some((hiddenUserId) => String(hiddenUserId) === String(myId))
        );

        const summaries = {};

        for (const msg of visibleMessages) {
            const partnerId =
                String(msg.sender) === String(myId)
                    ? String(msg.receiver)
                    : String(msg.sender);

            if (summaries[partnerId]) continue;

            summaries[partnerId] = {
                text: msg.text,
                file: msg.file,
                createdAt: msg.createdAt,
                status: msg.status,
                sender: msg.sender,
                receiver: msg.receiver
            };
        }

        return res.status(200).json(summaries);
    } catch (err) {
        return res.status(500).json({
            error: err.message
        });
    }
};

exports.deleteMessage = async (req, res) => {
    try {
        const { messageId } = req.params;
        const { requesterId } = req.body;

        if (!messageId || !requesterId) {
            return res.status(400).json({ error: 'messageId and requesterId are required' });
        }

        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({ error: 'Message not found' });
        }

        if (String(message.sender) !== String(requesterId)) {
            return res.status(403).json({ error: 'You can only delete your own messages' });
        }

        await Message.deleteOne({ _id: messageId });

        const io = req.app.get('io');
        if (io) {
            io.emit('messageDeleted', {
                messageId: messageId.toString(),
                senderId: message.sender.toString(),
                receiverId: message.receiver.toString()
            });
        }

        return res.status(200).json({ success: true, messageId: messageId.toString() });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

exports.clearChat = async (req, res) => {
    try {
        const { myId, partnerId } = req.params;

        if (!myId || !partnerId) {
            return res.status(400).json({ error: 'myId and partnerId are required' });
        }

        const result = await Message.updateMany(
            {
                $or: [
                    { sender: myId, receiver: partnerId },
                    { sender: partnerId, receiver: myId }
                ]
            },
            {
                $addToSet: { hiddenFor: myId }
            },
            { multi: true }
        );

        const io = req.app.get('io');
        if (io) {
            io.emit('chatCleared', {
                userId: myId,
                partnerId,
                modifiedCount: result.modifiedCount || 0
            });
        }

        return res.status(200).json({
            success: true,
            modifiedCount: result.modifiedCount || 0
        });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};