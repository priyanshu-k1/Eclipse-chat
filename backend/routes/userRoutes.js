const express = require('express');
const router = express.Router();
const { 
    updateDisplayName, 
    updatePassword, 
    updateProfilePic, 
    deleteUser,
    getUserProfile 
} = require('../controllers/userController');


const { authenticate } = require('../middleware/authMiddleware');


router.get('/profile', authenticate, getUserProfile);
router.put('/update-displayName', authenticate, updateDisplayName);
router.put('/update-password', authenticate, updatePassword);
router.put('/update-profilePic', authenticate, updateProfilePic);
router.delete('/delete', authenticate, deleteUser);

module.exports = router;