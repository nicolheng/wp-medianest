function validateLogin(req, res, next){
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, message: "Email and password are required." });
    }

    next();
}

function validateRegister(req, res, next){
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ success: false, message: "All fields are required." });
    }

    if (password.length < 6 || !/[A-Z]/.test(password)) {
        return res.status(400).json({
            success: false,
            message: "Password must be 6+ chars with an uppercase letter."
        });
    }

    next();

}

module.exports = {validateLogin, validateRegister}