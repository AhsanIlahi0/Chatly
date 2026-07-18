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
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email address']
    },
    password: {
        type: String,
        required: [true, 'Please provide a secure password'],
        minlength: [6, 'Password must be at least 6 characters long'],
        select: false
    },
    username: {
        type: String,
        unique: true,
        sparse: true,        // allows null while enforcing uniqueness when set
        trim: true,
        lowercase: true,
        match: [/^[a-z0-9_]{3,20}$/, 'Username must be 3-20 characters (letters, numbers, underscores)']
    },
    visibility: {
        type: String,
        enum: ['public', 'private'],
        default: null        // null = onboarding not complete yet
    },
    avatar: {
        type: String,
        default: 'default_avatar.png'
    },
    status: {
        type: String,
        enum: ['online', 'offline', 'away'],
        default: 'offline'
    },
    about: {
        type: String,
        default: 'No profile description provided.',
        maxlength: [160, 'Bio cannot exceed 160 characters']
    },
    // Embedded friend relationships
    // Sender side: { recipient: B._id, status: 'requested' }
    // Receiver side: { recipient: A._id, status: 'pending' }
    // Accepted:     both sides status = 'accepted'
    friends: [{
        recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        status: {
            type: String,
            enum: ['requested', 'pending', 'accepted', 'rejected'],
            default: 'pending'
        }
    }]
}, { timestamps: true });

UserSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    } catch (error) {
        throw error;
    }
});

UserSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);