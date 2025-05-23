const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes
const protect = async (req, res, next) => {
  console.log(`DEBUG: Protect middleware triggered for: ${req.method} ${req.originalUrl}`); // Keep this for debugging
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from the token
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        // Handle case where user associated with token is deleted
        console.log('DEBUG: User not found for token in protect middleware.');
        res.status(401);
        return next(new Error('Not authorized, user not found')); // Use next()
      }

      next();
    } catch (error) {
      console.error('DEBUG: Token verification failed:', error.message);
      res.status(401);
      // Pass the specific error for better debugging if needed, or a generic one
      return next(new Error('Not authorized, token failed')); // Use next()
    }
  }

  if (!token) {
    console.log('DEBUG: No token found in protect middleware.');
    res.status(401);
    // Use next(error) for better error handling
    return next(new Error('Not authorized, no token')); // Use next()
  }
};

// Admin only middleware
const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403);
    // Use next(error)
    return next(new Error('Not authorized as an admin')); // Use next()
  }
};

// Student only middleware
const student = (req, res, next) => {
  if (req.user && req.user.role === 'student') {
    next();
  } else {
    res.status(403);
    // Use next(error)
    return next(new Error('Not authorized as a student')); // Use next()
  }
};

module.exports = { protect, admin, student };