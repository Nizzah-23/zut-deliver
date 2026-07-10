const jwt = require('jsonwebtoken');
require('dotenv').config();

const protect = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'No token, access denied' });
    }

    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET not configured');
      return res.status(500).json({ message: 'Server configuration error' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    console.error('Auth error:', err.message);
    return res.status(401).json({ message: 'Invalid token' });
  }
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      if (!roles.includes(req.user.role)) {
        return res.status(403).json({ 
          message: `Access denied. ${req.user.role}s cannot access this route.` 
        });
      }
      next();
    } catch (err) {
      console.error('Authorization error:', err.message);
      return res.status(500).json({ message: 'Server error' });
    }
  };
};

module.exports = { protect, authorizeRoles };