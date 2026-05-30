const User = require('../models/User');

function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const register = async(req, res) => {
    try {
        const { username, email, password } = req.body;

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
}

const login = async(req, res) => {
    try {
        const { email, password } = req.body;

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
}

const logout = (req, res) => {
    req.session.destroy(err => {
        if (err) return res.status(500).json({ success: false, message: "Logout failed" });
        res.clearCookie('connect.sid');
        return res.status(200).json({ success: true });
    });
}

const me = async (req, res) => {
    try {
        return res.json({
            isAuthenticated: true,
            user: {
                id: req.user._id.toString(),
                username: req.user.username,
                email: req.user.email,
                profile: req.user.profile || {},
                badges: req.user.badges || {},
                createdAt: req.user.createdAt
            }
        });
    } catch (err) {
        return res.status(500).json({ isAuthenticated: false, message: 'Failed to fetch current user.' });
    }
}

const profile = async (req, res)=> {
    try {
        const user = req.user;

        const usernameInput = typeof req.body.username === 'string' ? req.body.username.trim() : undefined;
        const emailInput = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : undefined;
        const bioInput = typeof req.body?.profile?.bio === 'string'
            ? req.body.profile.bio.trim()
            : (typeof req.body.bio === 'string' ? req.body.bio.trim() : undefined);

        if (usernameInput !== undefined) {
            if (!usernameInput) {
                return res.status(400).json({ success: false, message: 'Username cannot be empty.' });
            }

            const usernameTaken = await User.findOne({
                _id: { $ne: user._id },
                username: { $regex: `^${escapeRegex(usernameInput)}$`, $options: 'i' }
            }).select('_id');

            if (usernameTaken) {
                return res.status(409).json({
                    success: false,
                    message: 'That username is already taken. Please choose another one.'
                });
            }

            user.username = usernameInput;
            req.session.username = usernameInput;
        }

        if (emailInput !== undefined) {
            if (!emailInput) {
                return res.status(400).json({ success: false, message: 'Email cannot be empty.' });
            }

            const emailTaken = await User.findOne({
                _id: { $ne: user._id },
                email: emailInput
            }).select('_id');

            if (emailTaken) {
                return res.status(409).json({
                    success: false,
                    message: 'That email is already registered to another account.'
                });
            }

            user.email = emailInput;
        }

        if (bioInput !== undefined) {
            user.profile = user.profile || {};
            user.profile.bio = bioInput;
        }

        await user.save();

        return res.json({
            success: true,
            message: 'Profile updated successfully.',
            user: {
                id: user._id.toString(),
                username: user.username,
                email: user.email,
                profile: user.profile || {},
                badges: user.badges || {},
                createdAt: user.createdAt
            }
        });
    } catch (err) {
        if (err.code === 11000) {
            const field = Object.keys(err.keyValue || {})[0] || 'field';
            return res.status(409).json({ success: false, message: `That ${field} is already in use.` });
        }

        return res.status(500).json({ success: false, message: 'Failed to update profile.' });
    }
}

const google = () => {
    passport.authenticate('google', { scope: ['profile', 'email'] })
}

const googleFallback = () => {
    passport.authenticate('google', {
        failureRedirect: '/login.html',
        successRedirect: `${process.env.CLIENT_URL || 'http://localhost:8081'}/index.html`
    })
}

module.exports = {register, login, logout, me, profile, google, googleFallback}