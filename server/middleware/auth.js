const jwt = require("jsonwebtoken");
const User = require("../models/User");
require("dotenv").config();

const SECRET_KEY = process.env.SECRET_KEY;

function authenticateToken(req, res, next) {
    const token = req.header("Authorization")?.split(" ")[1];
    if (!token) {
        return res.status(401).send("Access denied: No token provided");
    }
    try {
        const verified = jwt.verify(token, SECRET_KEY);
        req.user = verified;
        next();
    } catch (e) {
        res.status(400).send("Invalid token");
    }
}

const authorizeRole = (role) => (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: "Not authorized, no user found!" });
    }
    if (req.user.role !== role) {
        return res.status(403).json({ message: "Access Denied: Insufficient Permissions" });
    }
    next();
};

const protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        token = req.headers.authorization.split(" ")[1];
    }
    if (!token) {
        return res.status(401).json({ message: "No token found error" });
    }
    try {
        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        if (!decoded.id) {
            return res.status(400).json({ message: "Invalid token payload: No user_id" });
        }
        req.user = await User.findById(decoded.id);
        if (!req.user) {
            return res.status(401).json({ message: "Not authorized, user not found" });
        }
        if (req.user.status !== 'verified') {
            return res.status(403).json({ message: "Email not verified" });
        }
        next();
    } catch (err) {
        return res.status(401).json({ message: "Not authorized to access this route!" });
    }
};

module.exports = { authenticateToken, authorizeRole, protect }; 