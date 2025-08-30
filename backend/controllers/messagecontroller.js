const Message = require('../models/messageModel');
const Orbit = require('../models/orbitModel');
const findUserByEclipseId = require('../utils/findUserByEclipseId');
const { encryptMessage, decryptMessage } = require('../micro-service/encryptionService');

exports.sendMessage = async (req, res) => {
    try {
        const { recipientEclipseId, content } = req.body;
        if (!recipientEclipseId || !content) {
            return res.status(400).json({ 
                message: 'Recipient Eclipse ID and content are required' 
            });
        }
        
        const recipient = await findUserByEclipseId(recipientEclipseId);
        if (!recipient) {
            return res.status(404).json({ 
                message: 'Recipient not found' 
            });
        }
        const isFriend = req.user.friends.includes(recipient._id) || recipient.friends.includes(req.user.id);
        
        if (!isFriend) {
            let orbit = await Orbit.findOne({
                senderId: req.user.id,
                receiverId: recipient._id
            });
            if (!orbit) {
                orbit = new Orbit({
                    senderId: req.user.id,
                    receiverId: recipient._id,
                    status: 'pending',
                    messageCount: 0
                });
            }
            
            if (orbit.status === 'denied' && orbit.deniedAt) {
                const twoWeeksAgo = new Date();
                twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
                
                if (orbit.deniedAt > twoWeeksAgo) {
                    return res.status(403).json({ 
                        message: 'Cannot send messages. Orbit request was denied recently.' 
                    });
                } else {
                    orbit.status = 'pending';
                    orbit.messageCount = 0;
                    orbit.deniedAt = null;
                }
            }
            if (orbit.status === 'pending' && orbit.messageCount >= 5) {
                return res.status(403).json({ 
                    message: 'Message limit reached. Please wait for the recipient to accept your orbit request.' 
                });
            }
            if (orbit.status === 'pending') {
                orbit.messageCount += 1;
                await orbit.save();
            }
        }
        
        const { iv, encryptedData, authTag } = encryptMessage(content);
        const message = new Message({
            sender: req.user.id,
            receiver: recipient._id,
            content: encryptedData,
            iv,
            authTag,
            expiresAt: Date.now() + 5 * 60 * 1000,
            isSavedBySender: false,
            isSavedByReceiver: false
        });

        const savedMessage = await message.save();
        await savedMessage.populate([
            { path: 'sender', select: 'eclipseId username displayName avatar' },
            { path: 'receiver', select: 'eclipseId username displayName avatar' }
        ]);
        
        const io = req.app.get('io');
        if (io) {
            const roomId = generateRoomId(req.user.eclipseId, recipientEclipseId);
            console.log(`Sender eclipseId: ${req.user.eclipseId}`);
            console.log(`Recipient eclipseId: ${recipientEclipseId}`);
            console.log(`Generated room ID: ${roomId}`);
            console.log(`Personal room: user_${recipientEclipseId}`);

            const messageData = {
                id: savedMessage._id,
                content: decryptMessage(encryptedData, iv, authTag), 
                sender: savedMessage.sender,
                receiver: savedMessage.receiver,
                timestamp: savedMessage.createdAt,
                expiresAt: savedMessage.expiresAt,
                isSavedBySender: savedMessage.isSavedBySender,
                isSavedByReceiver: savedMessage.isSavedByReceiver
            };
            
            io.to(roomId).emit('receive_message', messageData);
            io.to(`user_${recipientEclipseId}`).emit('receive_message', messageData);
            console.log(`Message emitted to both rooms: ${roomId} and user_${recipientEclipseId}`);
        }
        
        res.status(201).json({ 
            message: 'Message sent securely',
            messageId: savedMessage._id,
            expiresAt: savedMessage.expiresAt
        });

    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ 
            message: 'Failed to send message',
            error: process.env.NODE_ENV === 'development' ? error.message : {}
        });
    }
};
exports.acceptOrbit = async (req, res) => {
    try {
        const { senderEclipseId } = req.body;
        
        if (!senderEclipseId) {
            return res.status(400).json({ 
                message: 'Sender Eclipse ID is required' 
            });
        }
        
        const sender = await findUserByEclipseId(senderEclipseId);
        if (!sender) {
            return res.status(404).json({ 
                message: 'Sender not found' 
            });
        }
        const orbit = await Orbit.findOne({
            senderId: sender._id,
            receiverId: req.user.id,
            status: 'pending'
        });
        
        if (!orbit) {
            return res.status(404).json({ 
                message: 'No pending orbit request found' 
            });
        }
        orbit.status = 'accepted';
        await orbit.save();
        if (!req.user.friends.includes(sender._id)) {
            req.user.friends.push(sender._id);
            await req.user.save();
        }
        
        if (!sender.friends.includes(req.user.id)) {
            sender.friends.push(req.user.id);
            await sender.save();
        }
        
        res.json({ 
            message: 'Orbit request accepted',
            orbit: orbit
        });
        
    } catch (error) {
        console.error('Error accepting orbit:', error);
        res.status(500).json({ 
            message: 'Failed to accept orbit request',
            error: process.env.NODE_ENV === 'development' ? error.message : {}
        });
    }
};
exports.denyOrbit = async (req, res) => {
    try {
        const { senderEclipseId } = req.body;
        
        if (!senderEclipseId) {
            return res.status(400).json({ 
                message: 'Sender Eclipse ID is required' 
            });
        }
        
        const sender = await findUserByEclipseId(senderEclipseId);
        if (!sender) {
            return res.status(404).json({ 
                message: 'Sender not found' 
            });
        }
        const orbit = await Orbit.findOne({
            senderId: sender._id,
            receiverId: req.user.id,
            status: 'pending'
        });
        
        if (!orbit) {
            return res.status(404).json({ 
                message: 'No pending orbit request found' 
            });
        }
        orbit.status = 'denied';
        orbit.deniedAt = new Date();
        await orbit.save();
        
        res.json({ 
            message: 'Orbit request denied',
            orbit: orbit
        });
        
    } catch (error) {
        console.error('Error denying orbit:', error);
        res.status(500).json({ 
            message: 'Failed to deny orbit request',
            error: process.env.NODE_ENV === 'development' ? error.message : {}
        });
    }
};

exports.getConversation = async (req, res) => {
    try {
        const { eclipseId } = req.params;
        const { page = 1, limit = 50 } = req.query;
        const otherUser = await findUserByEclipseId(eclipseId);
        if (!otherUser) {
            return res.status(404).json({ message: 'User not found' });
        }
        const messages = await Message.find({
            $or: [
                { sender: req.user.id, receiver: otherUser._id },
                { sender: otherUser._id, receiver: req.user.id }
            ]
        })
        .populate('sender', 'eclipseId username displayName avatar')
        .populate('receiver', 'eclipseId username displayName avatar')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);
        const decryptedMessages = messages.map(message => ({
            id: message._id,
            content: decryptMessage(message.content, message.iv, message.authTag),
            sender: message.sender,
            receiver: message.receiver,
            timestamp: message.createdAt,
            expiresAt: message.expiresAt,
            isSavedBySender: message.isSavedBySender,
            isSavedByReceiver: message.isSavedByReceiver
        }));

        res.json({
            messages: decryptedMessages.reverse(),
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                hasMore: messages.length === parseInt(limit)
            }
        });

    } catch (error) {
        console.error('Error getting conversation:', error);
        res.status(500).json({ 
            message: 'Failed to get conversation',
            error: process.env.NODE_ENV === 'development' ? error.message : {}
        });
    }
};

exports.getAllConversations = async (req, res) => {
    try {
        const conversations = await Message.aggregate([
            {
                $match: {
                    $or: [
                        { sender: req.user._id },
                        { receiver: req.user._id }
                    ]
                }
            },
            {
                $sort: { createdAt: -1 }
            },
            {
                $group: {
                    _id: {
                        $cond: {
                            if: { $eq: ['$sender', req.user._id] },
                            then: '$receiver',
                            else: '$sender'
                        }
                    },
                    lastMessage: { $first: '$$ROOT' }
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            {
                $unwind: '$user'
            },
            {
                $project: {
                    user: {
                        _id: '$user._id',
                        eclipseId: '$user.eclipseId',
                        username: '$user.username',
                        displayName: '$user.displayName',
                        avatar: '$user.avatar'
                    },
                    lastMessage: {
                        _id: '$lastMessage._id',
                        content: '$lastMessage.content',
                        iv: '$lastMessage.iv',
                        authTag: '$lastMessage.authTag',
                        sender: '$lastMessage.sender',
                        createdAt: '$lastMessage.createdAt',
                        expiresAt: '$lastMessage.expiresAt'
                    }
                }
            },
            {
                $sort: { 'lastMessage.createdAt': -1 }
            }
        ]);
        const decryptedConversations = conversations.map(conv => ({
            user: conv.user,
            lastMessage: {
                id: conv.lastMessage._id,
                content: decryptMessage(conv.lastMessage.content, conv.lastMessage.iv, conv.lastMessage.authTag),
                isFromMe: conv.lastMessage.sender.toString() === req.user.id,
                timestamp: conv.lastMessage.createdAt,
                expiresAt: conv.lastMessage.expiresAt
            }
        }));

        res.json({ conversations: decryptedConversations });

    } catch (error) {
        console.error('Error getting conversations:', error);
        res.status(500).json({ 
            message: 'Failed to get conversations',
            error: process.env.NODE_ENV === 'development' ? error.message : {}
        });
    }
};

exports.saveMessage = async (req, res) => {
    try {
        const { messageId } = req.params;
        
        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({ message: 'Message not found' });
        }

        const isSender = message.sender.toString() === req.user.id;
        const isReceiver = message.receiver.toString() === req.user.id;

        if (!isSender && !isReceiver) {
            return res.status(403).json({ message: 'Not authorized to save this message' });
        }
        if (isSender) {
            message.isSavedBySender = true;
        } else {
            message.isSavedByReceiver = true;
        }
        if (message.isSavedBySender && message.isSavedByReceiver) {
            message.expiresAt = null;
        }

        await message.save();
        const io = req.app.get('io');
        if (io) {
            const roomId = generateRoomId(req.user.eclipseId, 
                isSender ? message.receiver.eclipseId : message.sender.eclipseId);
            
            const updateData = {
                messageId: message._id,
                isSavedBySender: message.isSavedBySender,
                isSavedByReceiver: message.isSavedByReceiver,
                expiresAt: message.expiresAt
            };
            
            io.to(roomId).emit('message_saved', updateData);
        }

        res.json({ 
            message: 'Message saved successfully',
            isSavedBySender: message.isSavedBySender,
            isSavedByReceiver: message.isSavedByReceiver,
            expiresAt: message.expiresAt
        });

    } catch (error) {
        console.error('Error saving message:', error);
        res.status(500).json({ 
            message: 'Failed to save message',
            error: process.env.NODE_ENV === 'development' ? error.message : {}
        });
    }
};
exports.getSavedMessages = async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        
        const messages = await Message.find({
            $or: [
                { sender: req.user.id, isSavedBySender: true },
                { receiver: req.user.id, isSavedByReceiver: true }
            ]
        })
        .populate('sender', 'eclipseId username displayName avatar')
        .populate('receiver', 'eclipseId username displayName avatar')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

        const decryptedMessages = messages.map(message => ({
            id: message._id,
            content: decryptMessage(message.content, message.iv, message.authTag),
            sender: message.sender,
            receiver: message.receiver,
            timestamp: message.createdAt,
            savedAt: message.updatedAt,
            isSavedBySender: message.isSavedBySender,
            isSavedByReceiver: message.isSavedByReceiver
        }));

        res.json({
            savedMessages: decryptedMessages,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                hasMore: messages.length === parseInt(limit)
            }
        });

    } catch (error) {
        console.error('Error getting saved messages:', error);
        res.status(500).json({ 
            message: 'Failed to get saved messages',
            error: process.env.NODE_ENV === 'development' ? error.message : {}
        });
    }
};
exports.unsaveMessage = async (req, res) => {
    try {
        const { messageId } = req.params;
        
        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({ message: 'Message not found' });
        }

        const isSender = message.sender.toString() === req.user.id;
        const isReceiver = message.receiver.toString() === req.user.id;

        if (!isSender && !isReceiver) {
            return res.status(403).json({ message: 'Not authorized to unsave this message' });
        }
        if (isSender) {
            message.isSavedBySender = false;
        } else {
            message.isSavedByReceiver = false;
        }
        if (!message.isSavedBySender && !message.isSavedByReceiver && !message.expiresAt) {
            message.expiresAt = new Date(Date.now() + 5 * 60 * 1000); 
        }

        await message.save();
        const io = req.app.get('io');
        if (io) {
            const roomId = generateRoomId(req.user.eclipseId, 
                isSender ? message.receiver.eclipseId : message.sender.eclipseId);
            
            const updateData = {
                messageId: message._id,
                isSavedBySender: message.isSavedBySender,
                isSavedByReceiver: message.isSavedByReceiver,
                expiresAt: message.expiresAt
            };
            
            io.to(roomId).emit('message_unsaved', updateData);
        }

        res.json({ 
            message: 'Message unsaved successfully',
            isSavedBySender: message.isSavedBySender,
            isSavedByReceiver: message.isSavedByReceiver,
            expiresAt: message.expiresAt
        });

    } catch (error) {
        console.error('Error unsaving message:', error);
        res.status(500).json({ 
            message: 'Failed to unsave message',
            error: process.env.NODE_ENV === 'development' ? error.message : {}
        });
    }
};


function generateRoomId(eclipseId1, eclipseId2) {
    return [eclipseId1, eclipseId2].sort().join('_');
}