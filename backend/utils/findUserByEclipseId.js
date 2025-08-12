const User = require('../models/userModel');
async function findUserByEclipseId(eclipseId) {
  if (!eclipseId) return null;
  return await User.findOne({ eclipseId }).select('_id username displayName eclipseId avatar');
}
module.exports = findUserByEclipseId;
