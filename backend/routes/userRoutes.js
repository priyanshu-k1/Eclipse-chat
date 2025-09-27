const express = require('express');
const router = express.Router();
const { 
    updateDisplayName, 
    updatePassword, 
    updateProfilePic, 
    deleteUser,
    getUserProfile,
    searchUsers,
    getPendingRequests,
    getConnections,
    getOnlineUsers,
    getUserAccountStats,
    getActiveSessions, 
    terminateSession, 
    terminateAllOtherSessions, 
    getSessionInfo 
} = require('../controllers/userController');

const { authenticate } = require('../middleware/authMiddleware');

router.get('/profile', authenticate, getUserProfile);
router.get('/account-stats', authenticate, getUserAccountStats);
router.put('/update-displayName', authenticate, updateDisplayName);
router.put('/update-password', authenticate, updatePassword);
router.put('/update-profilePic', authenticate, updateProfilePic);
router.delete('/delete', authenticate, deleteUser);
router.get('/search', authenticate, searchUsers);
router.get('/pending', authenticate, getPendingRequests);
router.get('/connections', authenticate, getConnections);
router.get('/online-users', authenticate, getOnlineUsers);
router.get('/sessions', authenticate, getActiveSessions);
router.get('/sessions/info', authenticate, getSessionInfo);
router.delete('/sessions/:sessionId', authenticate, terminateSession);
router.delete('/sessions/others/all', authenticate, terminateAllOtherSessions);

module.exports = router;
