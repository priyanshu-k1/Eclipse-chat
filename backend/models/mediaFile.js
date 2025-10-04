const mongoose = require('mongoose');
const mediaFileSchema = new mongoose.Schema({
    messageId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message',
        required: true
    },
    filePath: { 
        type: String,
        required: true
    },
    bucketName: {
        type: String,
        default: 'chat-media'
    },
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    isSavedBySender: {
        type: Boolean,
        default: false
    },
    isSavedByReceiver: {
        type: Boolean,
        default: false
    },
    expiresAt: {
        type: Date
    },
    markedForDeletion: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

module.exports = mongoose.model('MediaFile', mediaFileSchema);