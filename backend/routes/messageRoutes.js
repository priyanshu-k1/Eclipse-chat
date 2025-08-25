const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messagecontroller');
const { authenticate } = require('../middleware/authMiddleware'); 

router.post('/send', authenticate, messageController.sendMessage);
router.get('/conversation/:eclipseId', authenticate, messageController.getConversation);
router.get('/conversations', authenticate, messageController.getAllConversations);
router.patch('/:messageId/save', authenticate, messageController.saveMessage);

// New orbit management routes
router.post('/orbits/accept', authenticate, messageController.acceptOrbit);
router.post('/orbits/deny', authenticate, messageController.denyOrbit);

module.exports = router;