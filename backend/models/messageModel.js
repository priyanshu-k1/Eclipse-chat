const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: String,
        required: true
    },
    iv: {
        type: String, 
        required: true
    },
    authTag: {
        type: String,
        required: true
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
        type: Date,
        default: () => Date.now() + (5 * 60 * 1000), 
        index: { expires: 0 } 
    }
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);
