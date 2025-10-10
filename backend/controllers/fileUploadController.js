const { supabase } = require('../config/supabase');
const Message = require('../models/messageModel');
const User = require('../models/userModel');
const { encryptMessage } = require('../micro-service/encryptionService');

// Generate unique file name
const generateUniqueFileName = (originalName) => {
  const timestamp = Date.now();
  const crypto = require('crypto');
  const randomString = crypto.randomBytes(8).toString('hex');
  const extension = originalName.split('.').pop();
  const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
  
  return `${nameWithoutExt}_${timestamp}_${randomString}.${extension}`;
};

// Validate file type and size
const validateFile = (file) => {
  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
  
  const ALLOWED_TYPES = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
    'application/pdf', 'application/msword', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain', 'text/csv',
    'application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed',
    'audio/mpeg', 'audio/wav', 'audio/ogg',
    'video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo'
  ];

  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'File size exceeds 50MB limit' };
  }

  if (!ALLOWED_TYPES.includes(file.mimetype)) {
    return { valid: false, error: 'File type not allowed' };
  }

  return { valid: true };
};

const uploadFile = async (req, res) => {
  try {
    
    if (!req.file) {
      return res.status(400).json({
        type: 'validation_error',
        message: 'No file uploaded'
      });
    }

    // Validate file
    const validation = validateFile(req.file);
    if (!validation.valid) {
      return res.status(400).json({
        type: 'validation_error',
        message: validation.error
      });
    }

    // Generate unique file name
    const uniqueFileName = generateUniqueFileName(req.file.originalname);
    const filePath = `messages/${req.user.eclipseId}/${uniqueFileName}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('chat-files')
      .upload(filePath, req.file.buffer, {
        contentType: req.file.mimetype,
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      return res.status(500).json({
        type: 'error',
        message: 'Failed to upload file to storage'
      });
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('chat-files')
      .getPublicUrl(filePath);

    const fileUrl = urlData.publicUrl;

    // Return file info WITHOUT creating message
    res.status(200).json({
      type: 'success',
      message: 'File uploaded successfully',
      data: {
        fileUrl: fileUrl,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        fileType: req.file.mimetype,
        storagePath: filePath
      }
    });

  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({
      type: 'error',
      message: 'Failed to upload file'
    });
  }
};

const uploadMultipleFiles = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        type: 'validation_error',
        message: 'No files uploaded'
      });
    }

    const uploadedFiles = [];
    const errors = [];

    // Upload each file
    for (const file of req.files) {
      try {
        const validation = validateFile(file);
        if (!validation.valid) {
          errors.push({
            fileName: file.originalname,
            error: validation.error
          });
          continue;
        }

        // Generate unique file name
        const uniqueFileName = generateUniqueFileName(file.originalname);
        const filePath = `messages/${req.user.eclipseId}/${uniqueFileName}`;

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('chat-files')
          .upload(filePath, file.buffer, {
            contentType: file.mimetype,
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          errors.push({
            fileName: file.originalname,
            error: 'Failed to upload to storage'
          });
          continue;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('chat-files')
          .getPublicUrl(filePath);

        const fileUrl = urlData.publicUrl;

        uploadedFiles.push({
          fileName: file.originalname,
          fileUrl: fileUrl,
          fileSize: file.size,
          fileType: file.mimetype,
          storagePath: filePath
        });

      } catch (fileError) {
        console.error('Error processing file:', fileError);
        errors.push({
          fileName: file.originalname,
          error: 'Failed to process file'
        });
      }
    }

    res.status(200).json({
      type: 'success',
      message: `Successfully uploaded ${uploadedFiles.length} file(s)`,
      data: {
        uploadedFiles,
        errors: errors.length > 0 ? errors : undefined
      }
    });

  } catch (error) {
    console.error('Error uploading multiple files:', error);
    res.status(500).json({
      type: 'error',
      message: 'Failed to upload files'
    });
  }
};
const sendFiles = async (req, res) => {
  try {
    const { recipientEclipseId, files } = req.body;

    if (!recipientEclipseId) {
      return res.status(400).json({
        type: 'validation_error',
        message: 'Recipient Eclipse ID is required'
      });
    }

    if (!files || files.length === 0) {
      return res.status(400).json({
        type: 'validation_error',
        message: 'No files to send'
      });
    }
    const findUserByEclipseId = require('../utils/findUserByEclipseId');
    const recipient = await findUserByEclipseId(recipientEclipseId);
    
    if (!recipient) {
      return res.status(404).json({
        type: 'user_not_found',
        message: 'Recipient not found'
      });
    }

    const io = req.app.get('io');
    const { generateRoomId } = require('./messagecontroller');
    const roomId = io ? generateRoomId(req.user.eclipseId, recipientEclipseId) : null;

    const sentMessages = [];

    // Create message for each file
    for (const fileData of files) {
      try {
        const fileContent = `${fileData.fileType}: ${fileData.fileName}`;
        const { iv, encryptedData, authTag } = encryptMessage(fileContent);

        const message = new Message({
          sender: req.user._id,
          receiver: recipient._id,
          content: encryptedData,
          iv: iv,
          authTag: authTag,
          messageType: 'file',
          fileMetadata: {
            fileName: fileData.fileName,
            fileSize: fileData.fileSize,
            fileType: fileData.fileType,
            fileUrl: fileData.fileUrl,
            storagePath: fileData.storagePath
          },
          expiresAt: null,
          isSavedBySender: false,
          isSavedByReceiver: false,
          isSeen: false,
          seenAt: null
        });

        await message.save();
        await message.populate('sender', 'username displayName avatar eclipseId');
        await message.populate('receiver', 'username displayName avatar eclipseId');

        // Emit socket event
        if (io && roomId) {
          const messageData = {
            id: message._id,
            content: fileContent,
            sender: message.sender,
            receiver: message.receiver,
            timestamp: message.createdAt,
            messageType: 'file',
            fileMetadata: message.fileMetadata,
            expiresAt: message.expiresAt,
            isSavedBySender: message.isSavedBySender,
            isSavedByReceiver: message.isSavedByReceiver,
            isSeen: message.isSeen,
            seenAt: message.seenAt
          };
          
          io.to(roomId).emit('receive_message', messageData);
          io.to(`user_${recipientEclipseId}`).emit('receive_message', messageData);
        }

        sentMessages.push({
          messageId: message._id,
          fileName: fileData.fileName,
          timestamp: message.createdAt
        });

      } catch (error) {
        console.error('Error sending file message:', error);
      }
    }

    res.status(200).json({
      type: 'success',
      message: `Successfully sent ${sentMessages.length} file(s)`,
      data: {
        sentMessages
      }
    });

  } catch (error) {
    console.error('Error sending files:', error);
    res.status(500).json({
      type: 'error',
      message: 'Failed to send files'
    });
  }
};

// Delete file from storage
const deleteFile = async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        type: 'error',
        message: 'Message not found'
      });
    }

    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        type: 'authorization_error',
        message: 'You can only delete your own files'
      });
    }

    if (message.fileMetadata && message.fileMetadata.storagePath) {
      const { error: deleteError } = await supabase.storage
        .from('chat-files')
        .remove([message.fileMetadata.storagePath]);

      if (deleteError) {
        console.error('Error deleting file from storage:', deleteError);
      }
    }

    await message.deleteOne();

    res.status(200).json({
      type: 'success',
      message: 'File deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({
      type: 'error',
      message: 'Failed to delete file'
    });
  }
};

module.exports = {
  uploadFile,
  uploadMultipleFiles,
  sendFiles,
  deleteFile
};