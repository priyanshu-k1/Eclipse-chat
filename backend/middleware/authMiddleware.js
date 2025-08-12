const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/userModel');
require('dotenv').config();

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user._id, 
      eclipseId: user.eclipseId,
      username: user.username 
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' } // Token expires in 7 days
  );
};

// Login user
exports.login = async (req, res) => {
  try {
    const { eclipseId, password } = req.body;

    // Find user by eclipseId
    const user = await User.findOne({ eclipseId });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(user);

    // Send response
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        eclipseId: user.eclipseId,
        username: user.username,
        displayName: user.displayName,
        avatar: user.avatar
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Register user (example)
exports.register = async (req, res) => {
  try {
    const { eclipseId, username, password, displayName } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ 
      $or: [{ eclipseId }, { username }] 
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        message: 'User with this eclipseId or username already exists' 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = new User({
      eclipseId,
      username,
      password: hashedPassword,
      displayName: displayName || username
    });

    await user.save();

    // Generate token
    const token = generateToken(user);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        eclipseId: user.eclipseId,
        username: user.username,
        displayName: user.displayName,
        avatar: user.avatar
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
// Authentication middleware
exports.authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({ 
      _id: decoded.id,
      'tokens.token': token
    });

    if (!user) {
      return res.status(401).json({ message: 'Authentication failed' });
    }

    req.token = token;
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ message: 'Please authenticate' });
  }
};