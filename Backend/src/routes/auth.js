// Backend/src/routes/auth.js
const express = require('express');
const router = express.Router();
const User = require('../models/User'); // Path to your schema file
const { OAuth2Client } = require('google-auth-library');
const dns = require('dns').promises;
const { Resend } = require('resend');

// Initialize Google OAuth2 Client
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// 🚀 Initialize Resend with your API Key
const resend = new Resend(process.env.RESEND_API_KEY);

// 🚀 In-memory storage for pending registrations (holds signup data until OTP is verified)
const tempUsers = new Map();

// 🚀 GOOGLE OAUTH SIGN-IN & SIGN-UP ROUTE
router.post('/google-login', async (req, res) => {
    try {
        const { idToken } = req.body;

        if (!idToken) {
            return res.status(400).json({ error: "Missing Google ID Token" });
        }

        // Verify the token with Google
        const ticket = await client.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        
        // 🔒 Added "email_verified" from Google's payload structure
        const { email, name, picture, email_verified } = payload;

        // 🔒 Security verification gate check
        if (!email_verified) {
            return res.status(401).json({ error: "Google account email is not verified" });
        }

        // Find user by email (case-insensitive check)
        let user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            // 🆕 USER REGISTRATION FLOW
            const randomPassword = Math.random().toString(36).slice(-16); // Safe random password

            user = await User.create({
                name: name.trim(),
                email: email.toLowerCase().trim(),
                password: randomPassword, 
                avatar: picture || 'default_avatar.png',
                status: 'online'
            });

            // 🚀 SOCKET BROADCAST: Pop the new user onto everyone's sidebar immediately!
            const io = req.app.get('io');
            if (io) {
                io.emit('newUserAdded', {
                    user: {
                        id: user._id,
                        name: user.name,
                        avatar: user.avatar,
                        status: user.status,
                        unread: 0
                    }
                });
            }
            console.log(`[Google OAuth] Registered and logged in new user: ${email}`);
        } else {
            // 🔄 EXISTING USER LOGIN FLOW
            user.status = 'online';
            if (picture && (user.avatar === 'default_avatar.png' || !user.avatar)) {
                user.avatar = picture; // Sync avatar photo if it's the default
            }
            await user.save();
            console.log(`[Google OAuth] Logged in existing user: ${email}`);
        }

        // Strip password for security
        const userResponse = user.toObject();
        delete userResponse.password;

        return res.status(200).json(userResponse);

    } catch (error) {
        console.error("Google Auth execution failed:", error);
        return res.status(500).json({ error: "Google Authentication Failed" });
    }
});

// 🚀 SECURE LOGIN ROUTE
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "Please provide both email and password" });
        }

        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const userResponse = user.toObject();
        delete userResponse.password;

        return res.status(200).json(userResponse);
    } catch (error) {
        console.error("Login endpoint crash:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

// 🚀 SIGNUP ROUTE (Generates & Sends OTP using Resend HTTPS API)
router.post('/signup', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: "Please provide all required fields" });
        }

        const normalizedEmail = email.toLowerCase().trim();

        // 1. Check if email already exists in MongoDB
        const userExists = await User.findOne({ email: normalizedEmail });
        if (userExists) {
            return res.status(400).json({ error: "An account with this email already exists" });
        }

        // 2. ⚡ DNS MX LOOKUP: Verify the domain actually exists to receive mail
        const domain = normalizedEmail.split('@')[1];
        try {
            const mxRecords = await dns.resolveMx(domain);
            if (!mxRecords || mxRecords.length === 0) {
                return res.status(400).json({ error: "This email domain does not exist or cannot receive mail." });
            }
        } catch (dnsError) {
            console.error(`DNS MX lookup failed for ${domain}:`, dnsError.message);
            return res.status(400).json({ error: "This email domain does not exist." });
        }

        // 3. Generate a 6-digit verification OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // 4. ✉️ Send the email using Resend via secure HTTPS
        try {
            const { data, error } = await resend.emails.send({
                from: 'Chatly <onboarding@resend.dev>', // Free default sandbox sender domain
                to: normalizedEmail,
                subject: 'Your Chatly Verification Code',
                html: `
                    <div style="font-family: sans-serif; padding: 20px; color: #111; max-width: 500px; border: 1px solid #eee; border-radius: 12px;">
                        <h2 style="color: #e11d48;">Welcome to Chatly!</h2>
                        <p>Use the following 6-digit verification code to complete your signup:</p>
                        <h1 style="font-size: 32px; letter-spacing: 5px; color: #e11d48; margin: 20px 0;">${otp}</h1>
                        <p style="font-size: 12px; color: #666;">This code will expire in 10 minutes.</p>
                    </div>
                `
            });

            if (error) {
                console.error("Resend API returned an error:", error);
                return res.status(400).json({ error: "Could not deliver verification email." });
            }

            console.log("OTP Email successfully sent via Resend API. ID:", data.id);
        } catch (mailError) {
            console.error("Resend connection failed:", mailError.message);
            return res.status(400).json({ error: "Mail delivery system temporarily unavailable." });
        }

        // 5. Save registration data + OTP into server memory temporarily (expires in 10 mins)
        tempUsers.set(normalizedEmail, {
            name: name.trim(),
            password,
            otp,
            expiresAt: Date.now() + 10 * 60 * 1000 // 10 minutes
        });

        console.log(`[OTP Dispatched] Target: ${normalizedEmail} | Code: ${otp}`);

        return res.status(200).json({ 
            message: "Verification code sent successfully!", 
            email: normalizedEmail
        });

    } catch (error) {
        console.error("Signup validation crashed:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

// 🚀 NEW: VERIFY OTP ROUTE
router.post('/verify-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ error: "Email and OTP code are required" });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const pendingUser = tempUsers.get(normalizedEmail);

        // 1. Check if signup session exists
        if (!pendingUser) {
            return res.status(400).json({ error: "Signup session expired or not found. Please sign up again." });
        }

        // 2. Check if code has expired
        if (Date.now() > pendingUser.expiresAt) {
            tempUsers.delete(normalizedEmail);
            return res.status(400).json({ error: "Verification code expired. Please sign up again." });
        }

        // 3. Match code (strict string comparison)
        if (String(pendingUser.otp) !== String(otp).trim()) {
            return res.status(400).json({ error: "Incorrect verification code. Please try again." });
        }

        // 4. Create verified user in MongoDB database
        const newUser = await User.create({
            name: pendingUser.name,
            email: normalizedEmail,
            password: pendingUser.password, // Your User model pre-save middleware should handle hashing this
            avatar: 'default_avatar.png',
            status: 'online'
        });

        // Clear the pending registration session from memory
        tempUsers.delete(normalizedEmail);

        // 5. Broadcast to Socket.io to add the user to active lists
        const io = req.app.get('io');
        if (io) {
            io.emit('newUserAdded', {
                user: {
                    id: newUser._id,
                    name: newUser.name,
                    avatar: newUser.avatar,
                    status: newUser.status,
                    unread: 0
                }
            });
        }

        console.log(`[Verified Signup Complete] Created verified user: ${normalizedEmail}`);

        // Strip password for security before sending to frontend
        const userResponse = newUser.toObject();
        delete userResponse.password;

        return res.status(200).json(userResponse);

    } catch (error) {
        console.error("OTP verification endpoint crash:", error);
        return res.status(500).json({ error: "Internal Server Error during verification." });
    }
});

// 🚀 SIDEBAR USER LIST ROUTE
router.get('/all-users', async (req, res) => {
    try {
        const allUsers = await User.find({}, '_id name email avatar status');
        return res.status(200).json(allUsers);
    } catch (error) {
        console.error("Failed to fetch user directory:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

// 🚀 UPDATE AVATAR
router.put('/avatar', async (req, res) => {
    try {
        const { userId, avatarUrl } = req.body;

        if (!userId || !avatarUrl) {
            return res.status(400).json({ error: 'userId and avatarUrl are required' });
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: { avatar: avatarUrl } },
            { new: true }
        ).select('-password');

        if (!updatedUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        return res.status(200).json(updatedUser);
    } catch (error) {
        console.error('Failed to update avatar:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;