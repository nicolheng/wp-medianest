const express = require('express');
const router = express.Router();
const User = require('../models/User');
const passport = require('passport');


router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // check for empty fields
        if (!username || !email || !password) {
            return res.status(400).json({ success: false, message: "All fields are required." });
        }

        // password rules
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

        // explicitly fetch the password hash
        const user = await User.findOne({ email }).select('+password');
        
        if (!user) {
            return res.status(400).json({ success: false, message: "Invalid email or password." });
        }

        // make sure 'user.password' isn't undefined
        console.log("User found, comparing passwords...");

        // compare using method defined in User.js
        const isMatch = await user.comparePassword(password);
        
        if (!isMatch) {
            return res.status(400).json({ success: false, message: "Invalid email or password." });
        }
        // save user to session
        req.session.userId = user._id.toString();
        req.session.username = user.username;

        // success login
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

router.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) return res.status(500).json({ success: false, message: "Logout failed" });
        res.clearCookie('connect.sid');
        return res.status(200).json({ success: true });
    });
});

// GET /api/auth/me - Check if user is logged in (to update navbar)
// works for email/password AND OAuth
router.get('/me', (req, res) => {
    // passport populates req.user automatically via deserializeUser
    // works for BOTH session types
    const user = req.user || (req.session?.userId ? { _id: req.session.userId, username: req.session.username } : null);
    
    if (user?._id) {
        res.json({
            isAuthenticated: true,
            user: {
                id: user._id.toString(),
                username: user.username
            }
        });
    } else {
        res.status(401).json({ isAuthenticated: false });
    }
});

// Google
router.get('/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback',
    passport.authenticate('google', {
        failureRedirect: '/login.html',
        successRedirect: `${process.env.CLIENT_URL || 'http://localhost:8081'}/index.html`
    })
);

module.exports = router;