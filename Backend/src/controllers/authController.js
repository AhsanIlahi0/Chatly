const User = require('../models/User');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Check if user exists (explicitly requesting password since we set select: false)
        const user = await User.findOne({ email }).select('+password');
        if (!user) return res.status(400).json({ error: "Invalid credentials" });

        // 2. Validate password
        const isMatch = await user.matchPassword(password);
        if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

        // 3. Flip status to online in the database
        user.status = 'online';
        await user.save();

        // 4. Generate JWT token
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        // 5. Send back details—your frontend now has access to user._id!
        return res.status(200).json({
            token,
            user: {
                id: user._id,
                name: user.name,
                avatar: user.avatar,
                status: user.status
            }
        });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};