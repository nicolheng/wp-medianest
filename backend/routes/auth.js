const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth'); 
const passport = require('passport');
const {validateLogin, validateRegister} = require('../middleware/validators')
const authController = require('../controllers/authController')

router.post('/register', validateRegister, authController.register);

router.post('/login', validateLogin, authController.login);

router.post('/logout', authController.logout);

router.get('/me', protect, authController.me);

router.put('/profile', protect, authController.profile);

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