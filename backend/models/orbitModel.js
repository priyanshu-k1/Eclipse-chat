const mongoose = require('mongoose');

const orbitSchema = new mongoose.Schema({
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    receiverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'denied'],
        default: 'pending'
    },
    messageCount: {
        type: Number,
        default: 0
    },
    deniedAt: {
        type: Date,
        default: null
    }
}, { timestamps: true });
orbitSchema.index({ senderId: 1, receiverId: 1 }, { unique: true });

module.exports = mongoose.model('Orbit', orbitSchema);