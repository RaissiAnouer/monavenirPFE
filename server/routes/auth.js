const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
const verifyRoute = require('./auth/verify'); // Import the verify route
const crypto = require('crypto');

// Use the verify route
router.use('/verify', verifyRoute);

// Password validation
const validatePassword = (password) => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
  return passwordRegex.test(password);
};

// Email validation
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Generate secure JWT token
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user._id, 
      role: user.role, 
      email: user.email,
      name: user.name 
    },
    process.env.JWT_SECRET,
    { 
      expiresIn: '1h',
      jwtid: crypto.randomBytes(16).toString('hex') // Add a unique JWT ID
    }
  );
};

// Signup route
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, username, phone, role, grade } = req.body;

    // Add validation
    if (!email || !password || !username || !phone || !role) {
      return res.status(400).json({ 
        success: false,
        message: 'Missing required fields',
        details: 'Email, password, username, phone, and/or role are required'
      });
    }

    // Validate email format
    if (!validateEmail(email)) {
      return res.status(400).json({
        message: 'Invalid email format',
        details: 'Please provide a valid email address'
      });
    }

    // Validate password complexity
    if (!validatePassword(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password does not meet requirements',
        details: 'Password must be at least 8 characters long and include uppercase, lowercase, number, and special character (@$!%*?&#)'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [
        { email: email.toLowerCase() },
        { username: username.toLowerCase() }
      ]
    });

    if (existingUser) {
      return res.status(400).json({
        message: 'User already exists',
        details: 'Email or username is already registered'
      });
    }

    // Create new user with proper defaults
    const newUser = new User({
      name: name?.trim() || username.trim(), // Use username as name if not provided
      email: email.toLowerCase().trim(),
      password: await bcrypt.hash(password, 12), // Increased from 10 to 12 rounds
      username: username.trim(),
      phone: phone.trim(),
      role: role.toLowerCase(),
      grade: grade?.trim(),
      enrolledCourses: [],
      createdAt: new Date()
    });

    // Save user
    await newUser.save();

    // Generate token
    const token = generateToken(newUser);

    // Send response
    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        username: newUser.username,
        role: newUser.role,
        grade: newUser.grade,
        createdAt: newUser.createdAt,
        enrolledCourses: []
      }
    });

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ 
      message: 'Server error during signup',
      details: error.message,
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
});

// Login route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: 'Email and password are required'
      });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({
        message: 'Invalid email or password'
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        message: 'Invalid email or password'
      });
    }

    // Generate token
    const token = generateToken(user);

    // Send response with all user fields
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        username: user.username,
        role: user.role,
        grade: user.grade,
        createdAt: user.createdAt,
        enrolledCourses: user.enrolledCourses
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      message: 'Server error during login'
    });
  }
});

// Update profile route
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { name, email, phone, grade } = req.body;
    
    if (!name || !email || !phone) {
      return res.status(400).json({ 
        message: 'Name, email and phone are required' 
      });
    }

    // Validate email format
    if (!validateEmail(email)) {
      return res.status(400).json({
        message: 'Invalid email format',
        details: 'Please provide a valid email address'
      });
    }

    const userId = req.user.id;
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if email is being changed and if it's already in use
    if (email.toLowerCase() !== user.email) {
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        return res.status(400).json({
          message: 'Email already in use',
          details: 'Please use a different email address'
        });
      }
    }

    // Update user fields
    user.name = name.trim();
    user.email = email.toLowerCase().trim();
    user.phone = phone.trim();
    if (user.role === 'student' && grade) {
      user.grade = grade.trim();
    }

    await user.save();

    // Generate new token
    const token = generateToken(user);

    res.json({
      message: 'Profile updated successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        username: user.username,
        role: user.role,
        grade: user.grade,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      message: error.message || 'Server error during profile update'
    });
  }
});

// Verify token endpoint
router.post('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ valid: true, user: decoded });
  } catch (error) {
    console.error('Token verification error:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    res.status(500).json({ message: 'Error verifying token' });
  }
});

// Refresh token endpoint
router.post('/refresh-token', async (req, res) => {
  try {
    // Get the token from the Authorization header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        message: 'No token provided',
        code: 'NO_TOKEN'
      });
    }
    
    try {
      // Verify the token even if it's expired
      const decoded = jwt.verify(token, process.env.JWT_SECRET, { ignoreExpiration: true });
      
      // Find the user
      const user = await User.findById(decoded.id);
      
      if (!user) {
        return res.status(401).json({ 
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }
      
      // Generate a new token
      const newToken = generateToken(user);
      
      // Return the new token
      return res.json({
        token: newToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    } catch (jwtError) {
      console.error('Token refresh error:', jwtError);
      
      if (jwtError.name === 'JsonWebTokenError') {
        return res.status(401).json({ 
          message: 'Invalid token',
          code: 'INVALID_TOKEN'
        });
      }
      
      return res.status(401).json({ 
        message: 'Token refresh failed',
        code: 'REFRESH_FAILED'
      });
    }
  } catch (error) {
    console.error('Refresh token error:', error);
    return res.status(500).json({ 
      message: 'Server error during token refresh',
      code: 'SERVER_ERROR'
    });
  }
});

// Change password route
router.post('/change-password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: 'Current password and new password are required'
      });
    }
    
    // Validate new password complexity
    if (!validatePassword(newPassword)) {
      return res.status(400).json({
        message: 'Password does not meet complexity requirements',
        details: 'Password must be at least 8 characters long and include uppercase, lowercase, number, and special character'
      });
    }
    
    const userId = req.user.id;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({
        message: 'Current password is incorrect'
      });
    }
    
    // Update password
    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();
    
    res.json({
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({
      message: 'Server error during password change'
    });
  }
});

module.exports = router;
  