const Message = require('../models/messageModel');
const { encryptMessage, decryptMessage } = require('../micro-service/encryptionService');

exports.sendMessage = async (req, res) => {
    const { receiverId, content } = req.body;
    const { iv, encryptedData, authTag } = encryptMessage(content);
    const message = new Message({
        sender: req.user.id,
        receiver: receiverId,
        content: encryptedData,
        iv,
        authTag,
        expiresAt: Date.now() + 5 * 60 * 1000 
    });

    await message.save();
    res.status(201).json({ message: 'Message sent securely' });
};
