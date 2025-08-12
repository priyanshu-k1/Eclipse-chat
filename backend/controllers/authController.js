const User = require('../models/userModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const generateRandomName =require('../micro-service/DisplayNameGenerator');
require('dotenv').config();

exports.signup = async (req, res) => {
    try {
        const { username, email, password, displayName, avatar } = req.body;
        const existingEmail = await User.findOne({ email });
        if (existingEmail) return res.status(400).json({ message: 'Email already exists' });

        const existingUsername = await User.findOne({ username });
        if (existingUsername) return res.status(400).json({ message: 'Username already exists' });
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({
            username,
            email,
            password: hashedPassword,
            displayName: displayName || generateRandomName(),
            avatar: avatar || ''
        });

        await newUser.save();

        res.status(201).json({
            message: 'User created successfully',
            user: {
                id: newUser._id,
                username: newUser.username,
                email: newUser.email,
                displayName: newUser.displayName,
                avatar: newUser.avatar,
                eclipseId: newUser.eclipseId 
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.signin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );
    user.tokens.push({ token });
    await user.save();
    res.status(200).json({
      message: 'User signed in successfully',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        avatar: user.avatar,
        eclipseId: user.eclipseId
      }
    });

  } catch (err) {
    console.error('Signin error:', err.message);
    res.status(500).json({ 
      message: 'Server error during signin',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};