const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, "Please provide a username"],
        trim: true
    },
    email: {
        type: String,
        required: [true, "Please provide an email"],
        unique: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            "Please provide a valid email"
        ]
    },
    password: {
        type: String,
        required: [true, "Please add a password"],
        minlength: 6,
        select: false // prevents the password from being sent back in API calls by default
    },
    watchlist: {
        type: Array,
        default: [] // always starts as [] and not 'undefined'
    },
    searchHistory: {
        type: [{
            query: { type: String, trim: true },
            timestamp: { type: Date, default: Date.now }
        }],
        default: [] // empty array
    },
    // Track last login for security/analytics
    lastLogin: {
        type: Date,
        default: null
    },
    
    // Also add your profile defaults while we are here!
    profile: {
        bio: { type: String, default: "" },
        avatarUrl: { type: String, default: "https://i.postimg.cc/zvS2kWVk/user.jpg" },
        joinDate: { type: Date, default: Date.now }
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Hash password before saving
UserSchema.pre('save', async function() {
    if (!this.isModified('password')) return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
UserSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);