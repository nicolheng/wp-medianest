// 1. IMPORTS & CONFIG (DNS, Express, Mongoose, Dotenv)
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();

const authRoutes = require('./routes/auth');

const app = express();

// 2. MIDDLEWARE
// (Must come BEFORE routes so they can read the data you send)
app.use(require('cors')({
    origin: 'http://localhost:5500', // OR whatever your frontend URL is
    credentials: true
}));
app.use(express.json()); 

// 3. DATABASE CONNECTION
mongoose.connect(process.env.MONGO_URI, {
    dbName: 'medianest'
})
    .then(() => console.log("✅ SUCCESS: Connected to MongoDB!"))
    .catch(err => console.error("❌ ERROR:", err.message));

// Drop the old unique index on username to allow duplicates
const User = require('./models/User');
User.collection.dropIndex('username_1').then(() => {
    console.log("✅ Dropped old username unique index");
}).catch(err => {
    console.log("ℹ️ Username index not found or already dropped:", err.message);
});

// 4. ROUTES
app.use('/api', authRoutes);
app.get('/', (req, res) => res.send("MediaNest Backend is LIVE"));

// 5. START THE SERVER
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
});