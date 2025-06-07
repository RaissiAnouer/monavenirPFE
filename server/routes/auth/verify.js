const express = require('express');
const router = express.Router();
const User = require('../../models/User');

// Verify email route
router.get('/', async (req, res) => {
  const { token } = req.query;
  console.log('Received verification token:', token);
  
  if (!token) {
    return res.status(400).json({ message: 'Verification token is required' });
  }

  try {
    // Find user with the verification token
    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ 
        message: 'Invalid or expired verification token',
        details: 'Please request a new verification email'
      });
    }

    // Update user's verification status
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    res.status(200).json({ 
      message: 'Email verified successfully',
      details: 'You can now log in to your account'
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ 
      message: 'Error verifying email',
      details: 'Please try again or contact support'
    });
  }
});

module.exports = router; 
