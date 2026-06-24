const User = require('../models/User');

exports.getAllOtherUsers = async (req, res) => {
    try {
        const myId = req.user.id; // Populated by your JWT auth middleware

        // Find all users except the currently logged-in user
        const users = await User.find({ _id: { $ne: myId } }).select('-password');
        
        return res.status(200).json(users);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};