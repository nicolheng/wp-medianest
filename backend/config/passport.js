const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');


// Serialize: What to store in the session cookie?
// We only store the user ID to keep the cookie small & secure.
passport.serializeUser((user, done) => {
    done(null, user._id);
});

// Deserialize: How to rebuild req.user from the cookie?
// Runs on every request after the session is loaded.
passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

// Google Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/api/auth/google/callback",
    scope: ['profile', 'email'] // What data we request
}, async (accessToken, refreshToken, profile, done) => {
    try {
        const email = profile.emails?.[0]?.value;
        if (!email) return done(new Error("Google didn't return an email"));

        let user = await User.findOne({ email });

        if (!user) {
            // First time: Create user
            const baseName = profile.displayName
                ? profile.displayName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() 
                : email.split('@')[0];
            
            user = await User.create({
                username: `${baseName}${Math.floor(Math.random() * 1000)}`,
                email,
                password: 'oauth-placeholder',
                authProvider: 'google',
                watchlist: {
                    movies: [],
                    tv: [],
                    books: [],
                    music: []
                },
                history: {
                    movies: [],
                    tv: [],
                    books: [],
                    music: []
                },
                searchHistory: [],
                profile: {
                    avatarUrl: profile.photos?.[0]?.value || "https://i.postimg.cc/zvS2kWVk/user.jpg",
                    bio: "",
                    joinDate: Date.now()
                }
            });
        } else {
            // Existing user: Update avatar if needed
            if (profile.photos?.[0]?.value && !user.profile.avatarUrl.includes('postimg.cc')) {
                user.profile.avatarUrl = profile.photos[0].value;
                await user.save();
            }
        }

        done(null, user); // Passport takes it from here
    } catch (err) {
        done(err, null);
    }
}));