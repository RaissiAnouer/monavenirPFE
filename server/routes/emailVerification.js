const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { generateVerificationCode, sendVerificationEmail } = require('../utils/emailService');

router.post('/send-verification', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ message: 'Email already verified' });
    }

    // Check if there's an existing valid token
    if (user.emailVerificationToken && user.emailVerificationExpires > Date.now()) {
      const code = user.emailVerificationToken;
      const emailSent = await sendVerificationEmail(email, code, user.username);
      if (!emailSent) {
        return res.status(500).json({ message: 'Error sending verification email' });
      }
      return res.status(200).json({ message: 'Verification email sent successfully' });
    }

    // Generate a new code if no valid token exists
    const code = generateVerificationCode();
    user.emailVerificationToken = code;
    user.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    await user.save();

    const emailSent = await sendVerificationEmail(email, code, user.username);
    if (!emailSent) {
      return res.status(500).json({ message: 'Error sending verification email' });
    }

    res.status(200).json({ message: 'Verification email sent successfully' });
  } catch (error) {
    console.error('Error in send-verification:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/verify-email', async (req, res) => {
  try {
    const { email, code } = req.body;
    const user = await User.findOne({
      email: email,
      emailVerificationToken: code,
      emailVerificationExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired verification code' });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    res.status(200).json({
      message: 'Email verified successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error in verify-email:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
