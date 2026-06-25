// Backend/src/routes/auth.js
const express = require('express');
const router = express.Router();
const User = require('../models/User'); // Path to your schema file

// 🚀 1. SECURE LOGIN ROUTE
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "Please provide both email and password" });
        }

        // Find user and explicitly select the password field (since select: false is on the schema)
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        // Verify password match using your schema method
        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        // Return user info to frontend (excluding password)
        const userResponse = user.toObject();
        delete userResponse.password;

        return res.status(200).json(userResponse);
    } catch (error) {
        console.error("Login endpoint crash:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});
// Backend/src/routes/auth.js

// 🚀 TEMPORARY SIGNUP ROUTE TO CREATE A VALID TEST USER
router.post('/signup', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: "Please provide all required fields (name, email, password)" });
        }

        // Verify if the email address is already taken
        const userExists = await User.findOne({ email: email.toLowerCase() });
        if (userExists) {
            return res.status(400).json({ error: "An account with this email already exists" });
        }

        // Create the user document (the pre-save model hook handles the hashing)
        const newUser = await User.create({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password
        });

        // Convert to plain object to strip out sensitive data safely
        const userResponse = newUser.toObject();
        delete userResponse.password;

        return res.status(201).json(userResponse);
    } catch (error) {
        console.error("Signup validation crashed:", error);
        return res.status(500).json({ error: error.message || "Internal Server Error" });
    }
});
// 🚀 2. SIDEBAR USER LIST ROUTE
router.get('/all-users', async (req, res) => {
    try {
        // Fetch all profiles, but select only properties we need for the sidebar mapping
        const allUsers = await User.find({}, '_id name email avatar status');
        return res.status(200).json(allUsers);
    } catch (error) {
        console.error("Failed to fetch user directory:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

module.exports = router;