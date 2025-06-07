const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
const verifyRoute = require('./auth/verify');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

router.use('/verify', verifyRoute);

const validatePassword = (password) => {
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
  return passwordRegex.test(password);
};

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePhone = (phone) => {
  const phoneRegex = /^[0-9]{8}$/;
  return phoneRegex.test(phone);
};

const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user._id, 
      role: user.role, 
      email: user.email,
      name: user.name,
      username: user.username
    },
    process.env.JWT_SECRET,
    { 
      expiresIn: '1h',
      jwtid: crypto.randomBytes(16).toString('hex')
    }
  );
};

// Generate email verification token
const generateVerificationToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Send verification email
const sendVerificationEmail = async (email, token, username) => {
  try {
    // Create email transporter
    const transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT, 10),
      secure: true, // Use SSL for port 465
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      logger: true,
      debug: true,
      tls: {
        ciphers: 'SSLv3',
        rejectUnauthorized: true,
      },
      pool: true,
    });

    // Create verification URL
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${token}`;

    // Send verification email
    const mailOptions = {
      from: `"MonAvenir.tn Support" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Email Verification - MonAvenir.tn',
      html: `
        <h1>Welcome to MonAvenir.tn!</h1>
        <p>Dear ${username},</p>
        <p>Thank you for registering with MonAvenir.tn. Please click the link below to verify your email address:</p>
        <p><a href="${verificationUrl}" style="padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Verify Email</a></p>
        <p>This link will expire in 24 hours.</p>
        <p>If you didn't create an account with us, please ignore this email.</p>
        <p>Best regards,</p>
        <p>The MonAvenir.tn Team</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending verification email:', error);
    return false;
  }
};

router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, username, phone, role, state } = req.body;

    if (!email || !password || !username || !phone || !role) {
      return res.status(400).json({ 
        success: false,
        message: 'Missing required fields',
        details: 'Email, password, username, phone, and/or role are required'
      });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({
        message: 'Invalid email format',
        details: 'Please provide a valid email address'
      });
    }

    if (!validatePhone(phone)) {
      return res.status(400).json({
        message: 'Invalid phone number format',
        details: 'Phone number must be exactly 8 digits'
      });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password does not meet requirements',
        details: 'Password must be at least 8 characters long and include uppercase, lowercase, number, and special character (@$!%*?&#)'
      });
    }

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

    const newUser = new User({
      name: name?.trim() || username.trim(),
      email: email.toLowerCase().trim(),
      password: await bcrypt.hash(password, 12),
      username: username.trim(),
      phone: phone.trim(),
      role: role.toLowerCase(),
      state: state?.trim(),
      enrolledCourses: [],
      createdAt: new Date(),
      isEmailVerified: false
    });

    await newUser.save();

    // Generate verification token and send email
    const token = generateVerificationToken();
    newUser.emailVerificationToken = token;
    newUser.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    await newUser.save();

    const emailSent = await sendVerificationEmail(email, token, newUser.username);
    if (!emailSent) {
      console.error('Failed to send verification email');
    }

    res.status(201).json({
      message: 'User created successfully. Please check your email to verify your account.',
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        username: newUser.username,
        role: newUser.role,
        state: newUser.state,
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

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: 'Email and password are required'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({
        message: 'Invalid email or password'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        message: 'Invalid email or password'
      });
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      return res.status(403).json({
        message: 'Email not verified',
        details: 'Please verify your email before logging in'
      });
    }

    const token = generateToken(user);

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        username: user.username,
        role: user.role,
        state: user.state,
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

router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { name, username, email, phone, state } = req.body;
    
    if (!name || !email || !phone || !username) {
      return res.status(400).json({ 
        message: 'Name, email, phone, and username are required' 
      });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({
        message: 'Invalid email format',
        details: 'Please provide a valid email address'
      });
    }

    if (!validatePhone(phone)) {
      return res.status(400).json({
        message: 'Invalid phone number format',
        details: 'Phone number must be exactly 8 digits'
      });
    }

    const userId = req.user.id;
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (email.toLowerCase() !== user.email) {
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        return res.status(400).json({
          message: 'Email already in use',
          details: 'Please use a different email address'
        });
      }
    }

    if (username.toLowerCase() !== user.username) {
      const existingUser = await User.findOne({ username: username.toLowerCase() });
      if (existingUser) {
        return res.status(400).json({
          message: 'Username already in use',
          details: 'Please use a different username'
        });
      }
    }

    user.name = name.trim();
    user.username = username.trim();
    user.email = email.toLowerCase().trim();
    user.phone = phone.trim();
    if (user.role === 'student' && state) {
      user.state = state.trim();
    }

    await user.save();

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
        state: user.state,
        createdAt: user.createdAt,
        enrolledCourses: user.enrolledCourses || []
      }
    });

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      message: error.message || 'Server error during profile update'
    });
  }
});

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

router.post('/refresh-token', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        message: 'No token provided',
        code: 'NO_TOKEN'
      });
    }
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET, { ignoreExpiration: true });
      
      const user = await User.findById(decoded.id);
      
      if (!user) {
        return res.status(401).json({ 
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }
      
      const newToken = generateToken(user);
      
      return res.json({
        token: newToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          username: user.username
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

router.post('/change-password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: 'Current password and new password are required'
      });
    }
    
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
    
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({
        message: 'Current password is incorrect'
      });
    }
    
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

// Forgot Password - Send Reset Email
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !validateEmail(email)) {
      return res.status(400).json({ message: 'A valid email address is required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: 'No user found with this email address' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = Date.now() + 3600000; // 1 hour

    // Save token to user
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetTokenExpiry;
    await user.save();

    // Create reset URL
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    // Create email transporter
    const transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT, 10),
      secure: true, // Use SSL for port 465
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      logger: true,
      debug: true,
      tls: {
        ciphers: 'SSLv3',
        rejectUnauthorized: true,
      },
      pool: true,
    });

    transporter.verify((error, success) => {
      if (error) {
        console.error('SMTP Transporter Verification Error:', error);
      } else {
        console.log('SMTP Transporter is ready to send emails');
      }
    });

    // Send email
    const mailOptions = {
      from: `"MonAvenir.tn Support" <${process.env.SMTP_USER}>`,
      to: user.email,
      subject: 'Password Reset Request - MonAvenir.tn',
      html: `
        <h1>Password Reset Request</h1>
        <p>Dear ${user.name || user.username},</p>
        <p>You have requested a password reset for your MonAvenir.tn account. Click the link below to reset your password:</p>
        <p><a href="${resetUrl}" style="padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a></p>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email or contact our support team.</p>
        <p>Best regards,</p>
        <p>The MonAvenir.tn Team</p>
      `,
    };

    await transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error sending email:', error);
        return res.status(500).json({ message: 'Error sending reset email', details: error.message });
      }
      console.log('Email sent successfully:', info.response);
    });

    res.json({ message: 'Password reset email sent successfully. Please check your inbox (and spam/junk folder).' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Error sending reset email', details: error.message });
  }
});

// Reset Password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ message: 'Token and new password are required' });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({
        message: 'Password does not meet complexity requirements',
        details: 'Password must be at least 8 characters long and include uppercase, lowercase, number, and special character (@$!%*?&#)'
      });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    // Hash new password
    user.password = await bcrypt.hash(password, 12);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: 'Password has been reset successfully. You can now log in with your new password.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Error resetting password', details: error.message });
  }
});

// Contact Form - Send Message to Support Team
router.post('/contact', async (req, res) => {
  try {
    const { subject, message } = req.body;

    // Validate input
    if (!subject || !message) {
      return res.status(400).json({ message: 'Subject and message are required' });
    }

    // Create email transporter
    const transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT, 10),
      secure: true, // Use SSL for port 465
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      logger: true,
      debug: true,
      tls: {
        ciphers: 'SSLv3',
        rejectUnauthorized: true,
      },
      pool: true,
    });

    transporter.verify((error, success) => {
      if (error) {
        console.error('SMTP Transporter Verification Error:', error);
      } else {
        console.log('SMTP Transporter is ready to send emails');
      }
    });

    // Send email to support team
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: process.env.SMTP_USER, // Support team email
      subject: `Contact Form: ${subject}`,
      html: `
        <h1>New Contact Form Submission</h1>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
        <hr />
        <p>MonAvenir.tn Support Team</p>
      `,
    };

    await transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error sending contact email:', error);
        return res.status(500).json({ message: 'Error sending message', details: error.message });
      }
      console.log('Contact email sent successfully:', info.response);
    });

    res.json({ message: 'Message sent successfully. Our team will get back to you soon.' });
  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({ message: 'Error sending message', details: error.message });
  }
});

// Test email configuration
router.post('/test-email', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Create email transporter
    const transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT, 10),
      secure: true, // Use SSL for port 465
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      logger: true,
      debug: true,
      tls: {
        ciphers: 'SSLv3',
        rejectUnauthorized: true,
      },
      pool: true,
    });

    const testMailOptions = {
      from: `"MonAvenir.tn Test" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Test Email from MonAvenir.tn',
      html: `
        <h1>Test Email</h1>
        <p>This is a test email to verify the email configuration.</p>
        <p>If you're receiving this email, the email service is working correctly.</p>
      `
    };

    await transporter.sendMail(testMailOptions);
    console.log('Test email sent successfully');
    res.json({ message: 'Test email sent successfully' });
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({ 
      message: 'Error sending test email',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

module.exports = router;
