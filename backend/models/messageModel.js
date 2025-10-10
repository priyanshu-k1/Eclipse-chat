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
  messageType: {
    type: String,
    enum: ['text', 'file'],
    default: 'text'
  },
  fileMetadata: {
    fileName: String,
    fileSize: Number,
    fileType: String,
    fileUrl: String,
    storagePath: String
  },
  isSavedBySender: {
    type: Boolean,
    default: false
  },
  isSavedByReceiver: {
    type: Boolean,
    default: false
  },
  isSeen: {
    type: Boolean,
    default: false
  },
  seenAt: {
    type: Date
  },
  expiresAt: {
    type: Date,
    index: { expires: 0 }
  }
},
{ timestamps: true });

messageSchema.methods.markAsSeen = async function () {
  if (!this.isSeen) {
    this.isSeen = true;
    this.seenAt = new Date();
    this.expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    await this.save();
  }
};

module.exports = mongoose.model('Message', messageSchema);