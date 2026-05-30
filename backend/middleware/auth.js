const User = require('../models/User');

async function protect(req, res, next) {
    try {
        let user = null;
        if (req.user?._id) {
            user = req.user;
        } 
        else if (req.session?.userId) {
            user = await User.findById(req.session.userId);
        }
        if (!user) {
            return res.status(401).json({ success: false, message: 'Not authenticated. Please log in.' });
        }
        req.user = user;
        
        next();
    } catch (err) {
        next(err); 
    }
}

module.exports = protect ;