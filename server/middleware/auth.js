const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Simple in-memory rate limiting
const rateLimitMap = new Map();
const MAX_REQUESTS = 60; // Max requests per window
const WINDOW_MS = 60 * 1000; // 1 minute window

/**
 * Authentication middleware
 * This middleware verifies the JWT token in the Authorization header
 * and attaches the user information to the request object.
 * If no token is provided or the token is invalid, it returns a 401 Unauthorized response.
 * This ensures that only authenticated users can access protected routes.
 */

const auth = async (req, res, next) => {
  try {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const windowStart = now - WINDOW_MS;

    if (rateLimitMap.has(ip)) {
      rateLimitMap.set(ip, rateLimitMap.get(ip).filter(timestamp => timestamp > windowStart));
    }

    const requestTimestamps = rateLimitMap.get(ip) || [];
    if (requestTimestamps.length >= MAX_REQUESTS) {
      return res.status(429).json({ error: 'Too many requests', retryAfter: Math.ceil((WINDOW_MS - (now - requestTimestamps[0])) / 1000) });
    }

    requestTimestamps.push(now);
    rateLimitMap.set(ip, requestTimestamps);

    let token = req.header('Authorization')?.replace('Bearer ', '') || req.query.token;

    if (!token) return res.status(401).json({ error: 'Authentication required' });

    const decoded = await jwt.verify(token, process.env.JWT_SECRET);
    const currentTime = Math.floor(Date.now() / 1000);
    if (decoded.exp && decoded.exp < currentTime) {
      return res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
    }

    const user = await User.findOne({ _id: decoded.id });
    if (!user) return res.status(401).json({ error: 'User not found', code: 'USER_NOT_FOUND' });

    req.user = { id: user._id, email: user.email, role: user.role, name: user.name };
    req.token = token;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    if (error.name === 'TokenExpiredError') return res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
    if (error.name === 'JsonWebTokenError') return res.status(401).json({ error: 'Invalid token', code: 'INVALID_TOKEN' });
    res.status(500).json({ error: 'Server error during authentication', code: 'SERVER_ERROR' });
  }
};
module.exports = auth;
