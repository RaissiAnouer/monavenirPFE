const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();

// Verify token route
router.post('/', async (req, res) => {
  const token = req.body.token;
  console.log('Received token:', token);
  if (!token) {
    return res.status(400).json({ message: 'Token is required' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.status(200).json({ message: 'Token is valid', userId: decoded.id });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({ message: 'Invalid token' });
  }
});

module.exports = router; 