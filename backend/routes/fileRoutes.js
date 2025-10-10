const express = require('express');
const router = express.Router();
const multer = require('multer');
const {uploadFile,uploadMultipleFiles,deleteFile,sendFiles}= require('../controllers/fileUploadController');
const { authenticate } = require('../middleware/authMiddleware');

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
    files: 10
  }
});
router.post('/upload', authenticate,upload.single('file'),uploadFile);
router.post('/upload-multiple',authenticate,upload.array('files', 10),uploadMultipleFiles);
router.delete('/:messageId',authenticate,deleteFile);
router.post('/send', authenticate, sendFiles);

module.exports = router;