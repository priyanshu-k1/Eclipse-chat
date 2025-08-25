const User = require('../models/userModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const displayNameGenerator = require('../micro-service/DisplayNameGenerator');
const AvatarGenerator= require('../micro-service/AvatarGenerator').default;

// Utility functions
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user._id, 
      username: user.username,
      email: user.email,
      eclipseId: user.eclipseId
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

const hashPassword = async (password) => {
  return await bcrypt.hash(password, 10);
};

const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

const authErrors = {
  // Validation Errors
  "Username must be at least 3 characters": "Username should be minimum 3 characters long",
  "Username must be alphanumeric": "Username should only contain letters and numbers (no spaces or special characters)",
  "Please provide a valid email": "Enter a valid email address format",
  "Password must be at least 6 characters": "Password should be at least 6 characters long",
  "Password is required": "Password is required",

  // Signup Errors
  "User with this email already exists": "An account with this email already exists",
  "User with this username already exists": "This username is already taken",

  // Login Errors
  "Invalid credentials": "Email or password is incorrect",

  // Authentication Errors
  "No token provided": "Authentication token is missing",
  "Authentication failed": "Invalid authentication token",
  "Please authenticate": "You need to login to access this resource",

  // Server Errors
  "Server error during registration": "Something went wrong during signup",
  "Server error during login": "Something went wrong during login",
  "Server error during logout": "Something went wrong during logout",

  // Token Errors
  "Token invalid": "Your session has expired, please login again",
  "jwt expired": "Your session has expired, please login again",
  "jwt malformed": "Invalid authentication token"
};

// Helper function to get human readable error
const getHumanReadableError = (errorMessage) => {
  return authErrors[errorMessage] || "Something went wrong. Please try again.";
};

// Validation rules
exports.signupValidation = [
  body('username')
    .isLength({ min: 3 })
    .withMessage('Username must be at least 3 characters')
    .isAlphanumeric()
    .withMessage('Username must be alphanumeric'),
  
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
];

exports.signinValidation = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// Validation middleware
exports.validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const firstError = errors.array()[0];
    const humanReadableError = getHumanReadableError(firstError.msg);
    return res.status(400).json({
      error: humanReadableError
    });
  }
  next();
};

exports.signup = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const existingUser = await User.findOne({
      $or: [{ email }, { username: username.toLowerCase() }]
    });

    if (existingUser) {
      const field = existingUser.email === email ? 'email' : 'username';
      const errorMessage = `User with this ${field} already exists`;
      return res.status(400).json({ 
        error: getHumanReadableError(errorMessage)
      });
    }
    
    const hashedPassword = await hashPassword(password);

    const newUser = new User({
      username: username.toLowerCase(), 
      email,
      password: hashedPassword,
      displayName: displayNameGenerator(),
      avatar:AvatarGenerator(username)
    });

    await newUser.save();
    const token = generateToken(newUser);
    newUser.tokens.push({ token });
    await newUser.save();

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        displayName: newUser.displayName,
        eclipseId: newUser.eclipseId,
        avatar: newUser.avatar
      }
    });

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ 
      error: getHumanReadableError('Server error during registration')
    });
  }
};

exports.signin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ 
        error: getHumanReadableError('Invalid credentials')
      });
    }

    // Check password
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        error: getHumanReadableError('Invalid credentials')
      });
    }
    const token = generateToken(user);
    user.tokens.push({ token });
    await user.save();

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        eclipseId: user.eclipseId,
        avatar: user.avatar
      }
    });

  } catch (error) {
    console.error('Signin error:', error);
    res.status(500).json({ 
      error: getHumanReadableError('Server error during login')
    });
  }
};

// Logout endpoint (removes the current token from user's tokens array)
exports.logout = async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter(tokenObj => tokenObj.token !== req.token);
    await req.user.save();
    
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ 
      error: getHumanReadableError('Server error during logout')
    });
  }
};

// Logout from all devices (removes all tokens)
exports.logoutAll = async (req, res) => {
  try {
    req.user.tokens = [];
    await req.user.save();
    
    res.json({ message: 'Logged out from all devices successfully' });
  } catch (error) {
    console.error('Logout all error:', error);
    res.status(500).json({ 
      error: getHumanReadableError('Server error during logout')
    });
  }
};
