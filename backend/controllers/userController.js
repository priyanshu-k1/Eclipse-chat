const User = require('../models/userModel');
const Orbit = require('../models/orbitModel');
const bcrypt = require('bcryptjs');
const { getSocketIO } = require('../socket/socketHandler');

const updateDisplayName = async (req, res) => {
    try {
        const userId = req.user.id; 
        const { displayName } = req.body;
        if (!displayName || displayName.trim() === '') {
            return res.status(400).json({ message: 'Display name is required and cannot be empty' });
        }
        if (displayName.trim().length > 50) {
            return res.status(400).json({ message: 'Display name cannot exceed 50 characters' });
        }
        const user = await User.findByIdAndUpdate(
            userId,
            { displayName: displayName.trim() },
            { new: true, runValidators: true }
        ).select('-password -tokens'); 
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json({ 
            message: 'Display name updated successfully', 
            user: {
                id: user._id,
                username: user.username,
                displayName: user.displayName,
                avatar: user.avatar,
                eclipseId: user.eclipseId
            }
        });
    } catch (error) {
        console.error('Error updating display name:', error);
        res.status(500).json({ message: 'Error updating display name', error: error.message });
    }
};
const updatePassword = async (req, res) => {
    try {
        const userId = req.user.id;
        const { oldPassword, newPassword } = req.body;

        if (!oldPassword || !newPassword) {
            return res.status(400).json({ message: 'Both old and new password are required' });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'New password must be at least 6 characters long' });
        }
        if (oldPassword === newPassword) {
            return res.status(400).json({ message: 'New password must be different from old password' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Old password is incorrect' });
        }
        const salt = await bcrypt.genSalt(12);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();
        res.status(200).json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error('Error updating password:', error);
        res.status(500).json({ message: 'Error updating password', error: error.message });
    }
};
const updateProfilePic = async (req, res) => {
    try {
        const userId = req.user.id;
        const { avatar } = req.body;
        const avatarValue = avatar || '';
        if (avatar && avatar.trim() !== '') {
            const urlPattern = /^(https?:\/\/)[^\s]+$/;
            const isValidUrl = urlPattern.test(avatar.trim());
            const isBase64 = avatar.startsWith('data:image/');
            if (!isValidUrl && !isBase64) {
                return res.status(400).json({ message: 'Invalid avatar URL or base64 format' });
            }
        }
        const user = await User.findByIdAndUpdate(
            userId,
            { avatar: avatarValue },
            { new: true, runValidators: true }
        ).select('-password -tokens');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ 
            message: 'Profile picture updated successfully', 
            user: {
                id: user._id,
                username: user.username,
                displayName: user.displayName,
                avatar: user.avatar,
                eclipseId: user.eclipseId
            }
        });
    } catch (error) {
        console.error('Error updating profile picture:', error);
        res.status(500).json({ message: 'Error updating profile picture', error: error.message });
    }
};

const deleteUser = async (req, res) => {
    try {
        const userId = req.user.id;
        const { password } = req.body; 
        
        if (!password) {
            return res.status(400).json({ message: 'Password confirmation is required to delete account' });
        }
        
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Password is incorrect' });
        }
        await User.updateMany(
            { friends: userId },
            { $pull: { friends: userId } }
        );
        console.log('Removed user from friends lists');
        const orbitDeleteResult = await Orbit.deleteMany({
            $or: [
                { senderId: userId },
                { receiverId: userId }
            ]
        });
        console.log(`Deleted ${orbitDeleteResult.deletedCount} orbit connections`);
        const Message = require('../models/messageModel');
        const messageDeleteResult = await Message.deleteMany({
            $or: [
                { sender: userId },
                { receiver: userId }
            ]
        });
        console.log(`Deleted ${messageDeleteResult.deletedCount} messages`);
        const ReadStatus = require('../models/readStatusModel');
        const readStatusDeleteResult = await ReadStatus.deleteMany({
            $or: [
                { userId: userId },
                { conversationWith: userId }
            ]
        });
        console.log(`Deleted ${readStatusDeleteResult.deletedCount} read status records`);
        try {
            const io = getSocketIO();
            if (io) {
                io.emit('userAccountDeleted', { 
                    deletedUserId: userId,
                    timestamp: new Date()
                });
            }
        } catch (socketError) {
            console.warn('Socket notification failed:', socketError.message);
        }
        await User.findByIdAndDelete(userId);
        console.log('User account deleted successfully');

        res.status(200).json({ 
            message: 'User account and all related data deleted successfully',
            deletedData: {
                orbitConnections: orbitDeleteResult.deletedCount,
                messages: messageDeleteResult.deletedCount,
                readStatuses: readStatusDeleteResult.deletedCount
            }
        });
        
    } catch (error) {
        console.error('Error deleting user account:', error);
        res.status(500).json({ 
            message: 'Error deleting user account', 
            error: error.message 
        });
    }
};

const getUserProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const user = await User.findById(userId)
            .select('-password -tokens')
            .populate('friends', 'username displayName avatar eclipseId');
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ 
            message: 'User profile retrieved successfully',
            user: {
                id: user._id,
                username: user.username,
                displayName: user.displayName,
                avatar: user.avatar,
                eclipseId: user.eclipseId,
                email: user.email,
                friends: user.friends,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt
            }
        });
    } catch (error) {
        console.error('Error getting user profile:', error);
        res.status(500).json({ message: 'Error retrieving user profile', error: error.message });
    }
};
const searchUsers = async (req, res) => {
    try {
        const userId = req.user.id;
        const { q } = req.query;

        if (!q || q.trim() === '') {
            return res.status(200).json({ users: [] });
        }
        const searchTerm = q.trim();
        const users = await User.find({
            _id: { $ne: userId },
            $or: [
                { eclipseId: { $regex: searchTerm, $options: 'i' } },
                { username: { $regex: searchTerm, $options: 'i' } },
                { displayName: { $regex: searchTerm, $options: 'i' } }
            ]
        })
        .select('username displayName avatar eclipseId')
        .limit(5);
        res.status(200).json({ 
            users: users.map(user => ({
                id: user._id,
                username: user.username,
                displayName: user.displayName,
                avatar: user.avatar,
                eclipseId: user.eclipseId
            }))
        });
    } catch (error) {
        console.error('Error searching users:', error);
        res.status(500).json({ message: 'Error searching users', error: error.message });
    }
};
const getPendingRequests = async (req, res) => {
     try {
        const userId = req.user.id;
        const pendingRequests = await Orbit.find({
            receiverId: userId,
            status: 'pending'
        }).populate({
            path: 'senderId',
            select: 'displayName avatar eclipseId'
        });
        console.log('Found requests:', pendingRequests.length);
        res.status(200).json({
            requests: pendingRequests.map(request => ({
                id: request._id,
                sender: request.senderId
            }))
        });
    } catch (error) {
        console.error('Error fetching pending requests:', error);
        res.status(500).json({
            message: 'Failed to fetch pending requests',
            error: error.message
        });
    }
}
const getConnections = async (req, res) => {
  try {
    const userId = req.user.id;
    const orbits = await Orbit.find({
      $or: [
        { senderId: userId, status: 'accepted' },
        { receiverId: userId, status: 'accepted' }
      ]
    })
      .populate('senderId', 'displayName avatar eclipseId')
      .populate('receiverId', 'displayName avatar eclipseId');
    const connections = orbits.map(orbit => {
      const otherUser =
        orbit.senderId._id.toString() === userId
          ? orbit.receiverId
          : orbit.senderId;

      return {
        id: orbit._id,
        user: {
          id: otherUser._id,
          displayName: otherUser.displayName,
          avatar: otherUser.avatar,
          eclipseId: otherUser.eclipseId
        }
      };
    });

    res.status(200).json({ connections });
  } catch (error) {
    console.error('Error fetching connections:', error);
    res.status(500).json({
      message: 'Failed to fetch connections',
      error: error.message
    });
  }
};

const getOnlineUsers = async (req, res) => {
    try {
        const io = getSocketIO();
        
        if (!io || !io.getOnlineUsers) {
            return res.status(500).json({ message: 'Socket service not available' });
        }
        
        const onlineUsers = io.getOnlineUsers();
        
        res.status(200).json({ 
            message: 'Online users retrieved successfully',
            onlineUsers,
            count: onlineUsers.length
        });
    } catch (error) {
        console.error('Error getting online users:', error);
        res.status(500).json({ message: 'Error retrieving online users', error: error.message });
    }
};
const getUserAccountStats = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const user = await User.findById(userId)
            .select('createdAt friends')
            .populate('friends', '_id');
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({
            message: 'User account stats retrieved successfully',
            accountStats: {
                createdAt: user.createdAt,
                friendCount: user.friends.length,
                accountAge: {
                    days: Math.floor((new Date() - new Date(user.createdAt)) / (1000 * 60 * 60 * 24)),
                    readable: formatAccountAge(user.createdAt)
                }
            }
        });
    } catch (error) {
        console.error('Error getting user account stats:', error);
        res.status(500).json({ 
            message: 'Error retrieving account stats', 
            error: error.message 
        });
    }
};
const formatAccountAge = (createdAt) => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffTime = Math.abs(now - created);
    
    const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);
    
    if (years > 0) {
        return `${years} year${years > 1 ? 's' : ''} ago`;
    } else if (months > 0) {
        return `${months} month${months > 1 ? 's' : ''} ago`;
    } else if (days > 0) {
        return `${days} day${days > 1 ? 's' : ''} ago`;
    } else {
        return 'Today';
    }
};
const getUserAccountStatsData = async (userId) => {
    try {
        const user = await User.findById(userId)
            .select('createdAt friends');
        
        if (!user) {
            throw new Error('User not found');
        }

        return {
            createdAt: user.createdAt,
            friendCount: user.friends.length,
            accountAge: {
                days: Math.floor((new Date() - new Date(user.createdAt)) / (1000 * 60 * 60 * 24)),
                readable: formatAccountAge(user.createdAt)
            }
        };
    } catch (error) {
        throw new Error(`Error retrieving account stats: ${error.message}`);
    }
};
module.exports = {
    updateDisplayName,
    updatePassword,
    updateProfilePic,
    deleteUser,
    getUserProfile,
    searchUsers,
    getPendingRequests,
    getConnections,
    getOnlineUsers,
    getUserAccountStats,
    getUserAccountStatsData,
    formatAccountAge
};