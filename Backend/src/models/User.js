const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide a display name'],
        trim: true,
        maxlength: [50, 'Name cannot exceed 50 characters']
    },
    email: {
        type: String,
        required: [true, 'Please provide an email address'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please provide a valid email address'
        ]
    },
    password: {
        type: String,
        required: [true, 'Please provide a secure password'],
        minlength: [6, 'Password must be at least 6 characters long'],
        select: false // Automatically excludes password from API responses/queries for security
    },
    avatar: {
        type: String,
        default: 'default_avatar.png' // Fallback image asset or path string
    },
    status: {
        type: String,
        enum: ['online', 'offline'],
        default: 'offline'
    },
    about: {
        type: String,
        default: 'No profile description provided.',
        maxlength: [160, 'Bio cannot exceed 160 characters']
    }
}, { timestamps: true }); // Automatically adds `createdAt` (joined date) and `updatedAt`

// --- PRE-SAVE PASSWORD HASHING HOOK ---
UserSchema.pre('save', async function() {
    // Only hash the password if it's new or being updated
    if (!this.isModified('password')) return;

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    } catch (error) {
        // In async hooks, simply throw the error instead of calling next(error)
        throw error; 
    }
});

// --- HELPER METHOD: VERIFY PASSWORDS ---
UserSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
