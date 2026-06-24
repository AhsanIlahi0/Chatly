// Backend/src/controllers/messageController.js
const Message = require('../models/Message');

exports.getChatHistory = async (req, res) => {
    try {
        const { myId, partnerId } = req.params;

        // Find messages where (I sent it to them) OR (They sent it to me)
        const history = await Message.find({
            $or: [
                { sender: myId, receiver: partnerId },
                { sender: partnerId, receiver: myId }
            ]
        }).sort({ createdAt: 1 }); // Sort chronologically so old messages are at the top

        return res.status(200).json(history);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};