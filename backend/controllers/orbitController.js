const Orbit = require('../models/orbitModel');
const User = require('../models/userModel');
const { getOrbitIdByUserId } = require('../utils/connectionUtils');

// Send connection request
const sendConnectionRequest = async (req, res) => {
    try {
        const senderId = req.user.id;
        const { receiverId } = req.body;
        
        if (!receiverId) {
            return res.status(400).json({ message: 'Receiver ID is required' });
        }
        
        if (senderId === receiverId) {
            return res.status(400).json({ message: 'You cannot send a request to yourself' });
        }
        
        const receiver = await User.findById(receiverId);
        if (!receiver) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Check if users are already connected (accepted orbit exists)
        const existingConnection = await Orbit.findOne({
            $or: [
                { senderId, receiverId },
                { senderId: receiverId, receiverId: senderId }
            ],
            status: 'accepted'
        });
        
        if (existingConnection) {
            return res.status(400).json({ message: 'Users are already connected' });
        }
        
        // Check if there's already a pending request from this sender to receiver
        const existingPendingRequest = await Orbit.findOne({
            senderId,
            receiverId,
            status: 'pending'
        });
        
        if (existingPendingRequest) {
            return res.status(400).json({ message: 'Connection request already sent' });
        }
        
        // Check if there's a pending request from receiver to sender
        const reversePendingRequest = await Orbit.findOne({
            senderId: receiverId,
            receiverId: senderId,
            status: 'pending'
        });
        
        if (reversePendingRequest) {
            return res.status(400).json({ 
                message: 'This user has already sent you a connection request. Please check your pending requests.' 
            });
        }
        
        const newOrbit = new Orbit({
            senderId,
            receiverId,
            status: 'pending'
        });
        
        await newOrbit.save();
        
        res.status(201).json({
            message: 'Connection request sent successfully',
            orbit: {
                id: newOrbit._id,
                senderId,
                receiverId,
                status: newOrbit.status
            }
        });
        
    } catch (error) {
        console.error('Error sending connection request:', error);
        res.status(500).json({ message: 'Error sending connection request', error: error.message });
    }
};

// Accept connection request
const acceptConnectionRequest = async (req, res) => {
    try {
        const userId = req.user.id;
        const { orbitId } = req.params;
        const orbit = await Orbit.findById(orbitId);
        if (!orbit) {
            return res.status(404).json({ message: 'Connection request not found' });
        }
        if (orbit.receiverId.toString() !== userId) {
            return res.status(403).json({ message: 'You are not authorized to accept this request' });
        }
        if (orbit.status !== 'pending') {
            return res.status(400).json({ message: 'Connection request is no longer pending' });
        }
        orbit.status = 'accepted';
        await orbit.save();
        await User.findByIdAndUpdate(
            orbit.senderId,
            { $addToSet: { friends: orbit.receiverId } }
        );
        await User.findByIdAndUpdate(
            orbit.receiverId,
            { $addToSet: { friends: orbit.senderId } }
        );

        res.status(200).json({
            message: 'Connection request accepted successfully',
            orbit: {
                id: orbit._id,
                senderId: orbit.senderId,
                receiverId: orbit.receiverId,
                status: orbit.status
            }
        });
    } catch (error) {
        console.error('Error accepting connection request:', error);
        res.status(500).json({ message: 'Error accepting connection request', error: error.message });
    }
};

// Deny connection request
const denyConnectionRequest = async (req, res) => {
    try {
        const userId = req.user.id;
        const { orbitId } = req.params;
        const orbit = await Orbit.findById(orbitId);
        if (!orbit) {
            return res.status(404).json({ message: 'Connection request not found' });
        }
        if (orbit.receiverId.toString() !== userId) {
            return res.status(403).json({ message: 'You are not authorized to deny this request' });
        }
        if (orbit.status !== 'pending') {
            return res.status(400).json({ message: 'Connection request is no longer pending' });
        }
        orbit.status = 'denied';
        orbit.deniedAt = new Date();
        await orbit.save();

        res.status(200).json({
            message: 'Connection request denied successfully',
            orbit: {
                id: orbit._id,
                senderId: orbit.senderId,
                receiverId: orbit.receiverId,
                status: orbit.status
            }
        });
    } catch (error) {
        console.error('Error denying connection request:', error);
        res.status(500).json({ message: 'Error denying connection request', error: error.message });
    }
};

// Get user's orbits (connections)
const getUserOrbits = async (req, res) => {
    try {
        const userId = req.user.id;

        const orbits = await Orbit.find({
            $or: [
                { senderId: userId },
                { receiverId: userId }
            ],
            status: 'accepted'
        })
        .populate('senderId', 'username displayName avatar eclipseId')
        .populate('receiverId', 'username displayName avatar eclipseId');
        const formattedOrbits = orbits.map(orbit => {
            const otherUser = orbit.senderId._id.toString() === userId 
                ? orbit.receiverId 
                : orbit.senderId;
            
            return {
                id: orbit._id,
                user: {
                    id: otherUser._id,
                    username: otherUser.username,
                    displayName: otherUser.displayName,
                    avatar: otherUser.avatar,
                    eclipseId: otherUser.eclipseId
                },
                messageCount: orbit.messageCount,
                createdAt: orbit.createdAt
            };
        });

        res.status(200).json({
            message: 'Orbits retrieved successfully',
            orbits: formattedOrbits
        });
    } catch (error) {
        console.error('Error getting user orbits:', error);
        res.status(500).json({ message: 'Error getting user orbits', error: error.message });
    }
};
const cancelConnectionRequest = async (req, res) => {
    try {
        const userId = req.user.id;
        const { orbitId } = req.params;
        const orbit = await Orbit.findById(orbitId);
        if (!orbit) {
            return res.status(404).json({ message: 'Connection request not found' });
        }
        if (orbit.senderId.toString() !== userId) {
            return res.status(403).json({ message: 'You are not authorized to cancel this request' });
        }
        if (orbit.status !== 'pending') {
            return res.status(400).json({ message: 'Connection request is no longer pending' });
        }
        await Orbit.findByIdAndDelete(orbitId);

        res.status(200).json({
            message: 'Connection request cancelled successfully'
        });
    } catch (error) {
        console.error('Error cancelling connection request:', error);
        res.status(500).json({ message: 'Error cancelling connection request', error: error.message });
    }
};

// Check relationship status between current user and another user
const checkRelationshipStatus = async (req, res) => {
    try {
        const userId = req.user.id;
        const { otherUserId } = req.params;

        if (userId === otherUserId) {
            return res.status(400).json({ message: 'Cannot check relationship with yourself' });
        }
        const currentUser = await User.findById(userId);
        if (currentUser.friends.includes(otherUserId)) {
            return res.status(200).json({ status: 'friends' });
        }
        const existingOrbit = await Orbit.findOne({
            $or: [
                { senderId: userId, receiverId: otherUserId },
                { senderId: otherUserId, receiverId: userId }
            ],
            status: 'pending'
        });

        if (existingOrbit) {
            if (existingOrbit.senderId.toString() === userId) {
                return res.status(200).json({ status: 'pending_sent' });
            } else {
                return res.status(200).json({ status: 'pending_received' });
            }
        }
        return res.status(200).json({ status: 'none' });
    } catch (error) {
        console.error('Error checking relationship status:', error);
        res.status(500).json({ message: 'Error checking relationship status', error: error.message });
    }
};
const getDeniedList = async (req, res) => {
    try {
        const userId = req.user.id;
        const deniedOrbits = await Orbit.find({
            senderId: userId,
            status: 'denied'
        }).populate('receiverId', 'username displayName avatar eclipseId');

        const deniedUsers = deniedOrbits.map(orbit => ({
            id: orbit.receiverId._id,
            username: orbit.receiverId.username,
            displayName: orbit.receiverId.displayName,
            avatar: orbit.receiverId.avatar,
            eclipseId: orbit.receiverId.eclipseId,
            deniedAt: orbit.deniedAt || orbit.updatedAt
        }));

        res.status(200).json({
            message: 'Denied users retrieved successfully',
            deniedUsers
        });
    } catch (error) {
        console.error('Error getting denied users:', error);
        res.status(500).json({ message: 'Error getting denied users', error: error.message });
    }
};
const removeConnection = async (req, res) => {
  try {
    const userId = req.user.id;
    const otherUserId = req.params.connectionId;
    console.log("Removing connection between:", userId, "and", otherUserId);

    const orbitId = await getOrbitIdByUserId(userId, otherUserId);
    console.log("Found orbit ID:", orbitId);

    if (!orbitId) {
      return res.status(404).json({ message: "Connection not found" });
    }
    await User.findByIdAndUpdate(userId, { $pull: { friends: otherUserId } });
    await User.findByIdAndUpdate(otherUserId, { $pull: { friends: userId } });
    await Orbit.findByIdAndDelete(orbitId);
    res.status(200).json({
      message: "Connection removed successfully",
      removedConnectionId: orbitId
    });
  } catch (error) {
    console.error("Error removing connection:", error);
    res.status(500).json({ message: "Error removing connection", error: error.message });
  }
};
module.exports = {
    sendConnectionRequest,
    acceptConnectionRequest,
    denyConnectionRequest,
    getUserOrbits,
    cancelConnectionRequest,
    checkRelationshipStatus,
    getDeniedList,
    removeConnection
};