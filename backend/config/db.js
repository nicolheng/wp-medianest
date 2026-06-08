const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI, {
    dbName: process.env.DB_NAME || 'medianest'
})
    .then(() => console.log(`SUCCESS: Connected to MongoDB! Database: ${process.env.DB_NAME || 'medianest'}`))
    .catch(err => console.error("ERROR:", err.message));