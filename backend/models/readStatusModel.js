const mongoose = require('mongoose');

const readStatusSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    conversationWith: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    lastSeenMessageId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message',
        required: true
    },
    lastSeenAt: {
        type: Date,
        default: Date.now
    }
}, { 
    timestamps: true 
});


readStatusSchema.index({ userId: 1, conversationWith: 1 }, { unique: true });
readStatusSchema.index({ lastSeenAt: 1 });

module.exports = mongoose.model('ReadStatus', readStatusSchema);