const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
    admin: String,
    password: String,
  });

  module.exports = mongoose.model('Admin', adminSchema);