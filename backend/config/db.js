const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI, {
    dbName: 'medianest'
})
    .then(() => console.log("SUCCESS: Connected to MongoDB!"))
    .catch(err => console.error("ERROR:", err.message));