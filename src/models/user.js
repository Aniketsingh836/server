// models/User.js

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {type :String , default : null},
  key: {type :String , default : null},
  expires_in: {type :Date , default : null}
});



module.exports = mongoose.model('User', userSchema);

