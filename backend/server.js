// IMPORTS & CONFIG (DNS, Express, Mongoose, Dotenv)
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();
const session = require('express-session');
const MongoStore = require('connect-mongo').default;
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const authRoutes = require('./routes/auth');
const itemRoutes = require('./routes/items');

const app = express();

// MIDDLEWARE
// come BEFORE routes so they can read the data send
app.use(express.json());
app.use(require('cors')({
    origin: process.env.CLIENT_URL || 'http://localhost:8081',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

// DATABASE CONNECTION
mongoose.connect(process.env.MONGO_URI, {
    dbName: 'medianest'
})
    .then(() => console.log("SUCCESS: Connected to MongoDB!"))
    .catch(err => console.error("ERROR:", err.message));

// drop the old unique index on username to allow duplicates
const User = require('./models/User');
User.collection.dropIndex('username_1').then(() => {
    console.log("Dropped old username unique index");
}).catch(err => {
    console.log("Username index not found or already dropped:", err.message);
});

// MongoDB Session Store (uses existing Mongoose connection)
app.use(session({
    secret: process.env.SESSION_SECRET || 'dev-fallback-secret-change-in-prod', // fallback
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGO_URI,
        dbName: 'medianest',
        collectionName: 'sessions',
        ttl: 24 * 60 * 60
    }),
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // auto-switch
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // auto-switch
        maxAge: 24 * 60 * 60 * 1000
    }
}));


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
                profile: {
                    avatarUrl: profile.photos?.[0]?.value || user.profile.avatarUrl
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

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// ROUTES
app.use('/api/auth', authRoutes);
app.get('/', (req, res) => res.send("MediaNest Backend is LIVE"));

app.use('/api/items', itemRoutes);
app.use('/api/reviews', require('./routes/reviews'));

app.use(express.static('public'));

// START THE SERVER
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});