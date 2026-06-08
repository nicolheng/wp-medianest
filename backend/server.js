// IMPORTS & CONFIG (DNS, Express, Mongoose, Dotenv)
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const express = require('express');
require('dotenv').config();
const session = require('express-session');
const MongoStore = require('connect-mongo').default;
const passport = require('passport');

require('./config/passport');
require('./config/db');

const authRoutes = require('./routes/auth');
const itemRoutes = require('./routes/items');
const libraryRoutes = require('./routes/library');
const User = require('./models/User');



const app = express();

// MIDDLEWARE
// come BEFORE routes so they can read the data send
app.use(express.json());
app.use(require('cors')({
    origin: process.env.CLIENT_URL || 'http://localhost:8081',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));


// drop the old unique index on username to allow duplicates
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

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// ROUTES
app.get('/', (req, res) => res.send("MediaNest Backend is LIVE"));
app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/googlebooks', require('./routes/googlebooks'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/library', libraryRoutes);

app.use((req, res, next) => {
    console.log(`${req.method} request made to: ${req.url}`);
    next();
});

app.use(express.static('public'));

// START THE SERVER
const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
}

module.exports = app;