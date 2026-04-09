// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');

router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // 1. Check for empty fields
        if (!username || !email || !password) {
            return res.status(400).json({ success: false, message: "All fields are required." });
        }

        // 2. Strict Password Rules
        if (password.length < 6 || !/[A-Z]/.test(password)) {
            return res.status(400).json({
                success: false,
                message: "Password must be 6+ chars with an uppercase letter."
            });
        }

        const newUser = new User({ username, email, password });
        await newUser.save();

        // CREATE SESSION AUTOMATICALLY AFTER SIGNUP
        req.session.userId = newUser._id.toString();
        req.session.username = newUser.username;

        res.status(201).json({
            success: true,
            message: "Account created & logged in!",
            user: { id: newUser._id, username: newUser.username, email: newUser.email }
        });

    } catch (err) {
        if (err.code === 11000) {
            const field = Object.keys(err.keyValue)[0];
            return res.status(400).json({
                success: false,
                message: `That ${field} is already registered.`
            });
        }
        res.status(400).json({ success: false, message: err.message });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: "Email and password are required." });
        }

        // 1. Explicitly fetch the password hash
        const user = await User.findOne({ email }).select('+password');
        
        if (!user) {
            return res.status(400).json({ success: false, message: "Invalid email or password." });
        }

        // 2. Log this in your terminal to make sure 'user.password' isn't undefined
        console.log("User found, comparing passwords...");

        // 3. Compare using the method we defined in User.js
        const isMatch = await user.comparePassword(password);
        
        if (!isMatch) {
            return res.status(400).json({ success: false, message: "Invalid email or password." });
        }
        // Save user to session
        req.session.userId = user._id.toString();
        req.session.username = user.username;

        // 4. Success!
        res.status(200).json({
            success: true,
            message: "Login successful!",
            user: { id: user._id, username: user.username, email: user.email } 
        });

    } catch (err) {
        console.error("Login Error:", err);
        res.status(500).json({ success: false, message: "Server error." });
    }
});

// backend/routes/auth.js
router.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) return res.status(500).json({ success: false, message: "Logout failed" });
        res.clearCookie('connect.sid');
        return res.status(200).json({ success: true }); // Must send this!
    });
});

// GET /api/auth/me - Check if user is logged in (for navbar)
router.get('/me', (req, res) => {
    if (req.session.userId) {
        res.json({
        isAuthenticated: true,
        user: {
            id: req.session.userId,
            username: req.session.username
        }
        });
    } else {
        res.status(401).json({ isAuthenticated: false });
    }
});

module.exports = router;