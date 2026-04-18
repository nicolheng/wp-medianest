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
    password: { type: String, select: false },
    authProvider: {
        type: String,
        enum: ['local', 'google', 'facebook'],
        default: 'local'
    },
    watchlist: {
        movies: { type: [String], default: [] },
        tv: { type: [String], default: [] },
        books: { type: [String], default: [] },
        music: { type: [String], default: [] }
    },
    history: {
        movies: { type: [String], default: [] },
        tv: { type: [String], default: [] },
        books: { type: [String], default: [] },
        music: { type: [String], default: [] }
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
    
    // add your profile defaults
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