const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, default: null },
  key: { type: String, default: null },
  expires_in: { type: Date, default: null },
  generated_at: { type: Date, default: null },
  // Adding fields for session management
  sessionToken: { type: String, default: '' }, // Stores the session token
  sessionExpires: { type: Date, default: Date.now }, // Stores the expiration time of the session token
});

module.exports = mongoose.model('User', userSchema);
