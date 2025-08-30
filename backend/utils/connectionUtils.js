const mongoose = require("mongoose");
const Orbit = require("../models/orbitModel");

async function getOrbitIdByUserId(currentUserId, otherUserId) {
  try {
    const orbit = await Orbit.findOne({
      $or: [
        { senderId: currentUserId, receiverId: otherUserId, status: "accepted" },
        { senderId: otherUserId, receiverId: currentUserId, status: "accepted" }
      ]
    }).select("_id");

    return orbit ? orbit._id : null;
  } catch (error) {
    console.error("Error finding orbit by userId:", error);
    return null;
  }
}

module.exports = { getOrbitIdByUserId };
