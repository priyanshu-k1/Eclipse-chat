const express = require('express');
const router = express.Router();
const { authenticate,authMiddleware  } = require('../middleware/authMiddleware');
const {
  signup,
  signin,
  logout,
  logoutAll,
  signupValidation,
  signinValidation,
  validate
} = require('../controllers/authController');


// Public routes
router.post('/signup', signupValidation, validate, signup);
router.post('/signin', signinValidation, validate, signin);

// Protected routes
router.post('/logout', authenticate, logout);
router.post('/logout-all', authenticate, logoutAll);

// Get current user profile
router.get('/me', authenticate, (req, res) => {
  res.json({
    user: {
      id: req.user._id,
      username: req.user.username,
      email: req.user.email,
      displayName: req.user.displayName,
      eclipseId: req.user.eclipseId,
      avatar: req.user.avatar
    }
  });
});

// New verify route
router.get("/verify", authenticate, (req, res) => {
  res.json({
    message: "Token valid",
    user: {
      id: req.user._id,
      email: req.user.email,
      username: req.user.username,
      displayName: req.user.displayName,
      eclipseId: req.user.eclipseId,
      avatar: req.user.avatar
    }
  });
});

module.exports = router;