const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const readStatusController = require('../controllers/readStatusController');

router.use(authenticate);
router.get('/', readStatusController.getReadStatus);
router.put('/', readStatusController.updateReadStatus);
router.put('/batch', readStatusController.batchUpdateReadStatus);
router.delete('/:eclipseId', readStatusController.deleteReadStatus);
router.delete('/cleanup', readStatusController.cleanupOldReadStatus);

module.exports = router;