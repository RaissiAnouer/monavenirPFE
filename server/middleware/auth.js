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
    // Rate limiting check
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const windowStart = now - WINDOW_MS;
    
    // Clean up old entries
    if (rateLimitMap.has(ip)) {
      rateLimitMap.set(
        ip, 
        rateLimitMap.get(ip).filter(timestamp => timestamp > windowStart)
      );
    }
    
    // Check rate limit
    const requestTimestamps = rateLimitMap.get(ip) || [];
    if (requestTimestamps.length >= MAX_REQUESTS) {
      console.log(`Rate l imit exceeded for IP: ${ip}`);
      return res.status(429).json({ 
        error: 'Too many requests, please try again later',
        retryAfter: Math.ceil((WINDOW_MS - (now - requestTimestamps[0])) / 1000)
      });
    }
    
    // Add current request timestamp
    requestTimestamps.push(now);
    rateLimitMap.set(ip, requestTimestamps);
    
    // Token validation - check both Authorization header and query parameter
    let token = req.header('Authorization')?.replace('Bearer ', '');
    
    // If token is not in header, check query parameter
    if (!token && req.query.token) {
      token = req.query.token;
    }
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Check if token is expired
      const currentTime = Math.floor(Date.now() / 1000);
      if (decoded.exp && decoded.exp < currentTime) {
        return res.status(401).json({ 
          error: 'Token expired',
          code: 'TOKEN_EXPIRED'
        });
      }
      
      const user = await User.findOne({ _id: decoded.id });

      if (!user) {
        return res.status(401).json({ 
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }
      
      req.user = {
        id: user._id,
        email: user.email,
        role: user.role,
        name: user.name
      };
      req.token = token;
      next();
    } catch (jwtError) {
      console.error('JWT verification error:', jwtError.name, jwtError.message);
      
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          error: 'Token expired',
          code: 'TOKEN_EXPIRED'
        });
      } else if (jwtError.name === 'JsonWebTokenError') {
        return res.status(401).json({ 
          error: 'Invalid token',
          code: 'INVALID_TOKEN'
        });
      }
      
      return res.status(401).json({ 
        error: 'Authentication failed',
        code: 'AUTH_FAILED'
      });
    }
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ 
      error: 'Server error during authentication',
      code: 'SERVER_ERROR'
    });
  }
};

module.exports = auth;