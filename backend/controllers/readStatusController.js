const ReadStatus = require('../models/readStatusModel');
const findUserByEclipseId = require('../utils/findUserByEclipseId');
exports.getReadStatus = async (req, res) => {
    try {
        const readStatuses = await ReadStatus.find({ userId: req.user.id })
            .populate('conversationWith', 'eclipseId username displayName avatar')
            .sort({ lastSeenAt: -1 });

        const readStatusMap = {};
        readStatuses.forEach(status => {
            const conversationId = `conv_${status.conversationWith._id}`;
            readStatusMap[conversationId] = {
                lastSeenMessageId: status.lastSeenMessageId,
                lastSeenAt: status.lastSeenAt,
                conversationWith: status.conversationWith
            };
        });

        res.json({
            readStatus: readStatusMap
        });

    } catch (error) {
        console.error('Error getting read status:', error);
        res.status(500).json({
            message: 'Failed to get read status',
            error: process.env.NODE_ENV === 'development' ? error.message : {}
        });
    }
};
exports.updateReadStatus = async (req, res) => {
    try {
        const { eclipseId, messageId } = req.body;

        if (!eclipseId || !messageId) {
            return res.status(400).json({
                message: 'Eclipse ID and message ID are required'
            });
        }

        const otherUser = await findUserByEclipseId(eclipseId);
        if (!otherUser) {
            return res.status(404).json({
                message: 'User not found'
            });
        }
        const readStatus = await ReadStatus.findOneAndUpdate(
            {
                userId: req.user.id,
                conversationWith: otherUser._id
            },
            {
                lastSeenMessageId: messageId,
                lastSeenAt: new Date()
            },
            {
                upsert: true,
                new: true,
                runValidators: true
            }
        ).populate('conversationWith', 'eclipseId username displayName avatar');

        res.json({
            message: 'Read status updated successfully',
            readStatus: {
                conversationId: `conv_${otherUser._id}`,
                lastSeenMessageId: readStatus.lastSeenMessageId,
                lastSeenAt: readStatus.lastSeenAt,
                conversationWith: readStatus.conversationWith
            }
        });

    } catch (error) {
        console.error('Error updating read status:', error);
        res.status(500).json({
            message: 'Failed to update read status',
            error: process.env.NODE_ENV === 'development' ? error.message : {}
        });
    }
};
exports.batchUpdateReadStatus = async (req, res) => {
    try {
        const { updates } = req.body;

        if (!Array.isArray(updates) || updates.length === 0) {
            return res.status(400).json({
                message: 'Updates array is required and cannot be empty'
            });
        }

        const bulkOps = [];
        const userIds = [];
        for (const update of updates) {
            if (!update.eclipseId || !update.messageId) {
                return res.status(400).json({
                    message: 'Each update must contain eclipseId and messageId'
                });
            }

            const otherUser = await findUserByEclipseId(update.eclipseId);
            if (!otherUser) {
                return res.status(400).json({
                    message: `User with Eclipse ID ${update.eclipseId} not found`
                });
            }

            userIds.push(otherUser._id);

            bulkOps.push({
                updateOne: {
                    filter: {
                        userId: req.user.id,
                        conversationWith: otherUser._id
                    },
                    update: {
                        lastSeenMessageId: update.messageId,
                        lastSeenAt: new Date()
                    },
                    upsert: true
                }
            });
        }
        const result = await ReadStatus.bulkWrite(bulkOps);
        const updatedStatuses = await ReadStatus.find({
            userId: req.user.id,
            conversationWith: { $in: userIds }
        }).populate('conversationWith', 'eclipseId username displayName avatar');

        const readStatusMap = {};
        updatedStatuses.forEach(status => {
            const conversationId = `conv_${status.conversationWith._id}`;
            readStatusMap[conversationId] = {
                lastSeenMessageId: status.lastSeenMessageId,
                lastSeenAt: status.lastSeenAt,
                conversationWith: status.conversationWith
            };
        });

        res.json({
            message: 'Read status batch updated successfully',
            updated: result.modifiedCount + result.upsertedCount,
            readStatus: readStatusMap
        });

    } catch (error) {
        console.error('Error batch updating read status:', error);
        res.status(500).json({
            message: 'Failed to batch update read status',
            error: process.env.NODE_ENV === 'development' ? error.message : {}
        });
    }
};
exports.deleteReadStatus = async (req, res) => {
    try {
        const { eclipseId } = req.params;

        const otherUser = await findUserByEclipseId(eclipseId);
        if (!otherUser) {
            return res.status(404).json({
                message: 'User not found'
            });
        }

        const result = await ReadStatus.deleteOne({
            userId: req.user.id,
            conversationWith: otherUser._id
        });

        if (result.deletedCount === 0) {
            return res.status(404).json({
                message: 'Read status not found'
            });
        }

        res.json({
            message: 'Read status deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting read status:', error);
        res.status(500).json({
            message: 'Failed to delete read status',
            error: process.env.NODE_ENV === 'development' ? error.message : {}
        });
    }
};
exports.cleanupOldReadStatus = async (req, res) => {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const result = await ReadStatus.deleteMany({
            lastSeenAt: { $lt: thirtyDaysAgo }
        });

        res.json({
            message: 'Cleanup completed successfully',
            deletedCount: result.deletedCount
        });

    } catch (error) {
        console.error('Error cleaning up read status:', error);
        res.status(500).json({
            message: 'Failed to cleanup read status',
            error: process.env.NODE_ENV === 'development' ? error.message : {}
        });
    }
};