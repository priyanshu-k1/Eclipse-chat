const express = require('express');
const router = express.Router();
const {
    sendConnectionRequest,
    acceptConnectionRequest,
    denyConnectionRequest,
    getUserOrbits,
    cancelConnectionRequest,
    checkRelationshipStatus,
    getDeniedList,
    removeConnection,
} = require('../controllers/orbitController');
const { authenticate } = require('../middleware/authMiddleware');


router.post('/request', authenticate, sendConnectionRequest);
router.put('/:orbitId/accept', authenticate, acceptConnectionRequest);
router.put('/:orbitId/deny', authenticate, denyConnectionRequest);
router.delete('/:orbitId/cancel', authenticate, cancelConnectionRequest);
router.get('/my-orbits', authenticate, getUserOrbits);
router.get('/check-relationship/:otherUserId', authenticate, checkRelationshipStatus);
router.get('/get-denied-list', authenticate, getDeniedList);
router.delete('/remove-connection/:connectionId', authenticate, removeConnection);

module.exports = router;