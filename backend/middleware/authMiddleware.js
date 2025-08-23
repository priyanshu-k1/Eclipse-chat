const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

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
    }).select('-password');
    
    if (!user) {
      return res.status(401).json({ message: 'Authentication failed' });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ message: 'Please authenticate' });
  }
};