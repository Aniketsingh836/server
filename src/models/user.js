// models/User.js

const mongoose = require('mongoose');

// const userSchema = new mongoose.Schema({
//   username: {type :String , default : null},
//   key: {type :String , default : null},
//   expires_in: {type :Date , default : null},
//   generated_at:{type :Date , default : null}
// });


const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  sessionToken: { type: String, default: '' },
  sessionExpires: { type: Date, default: Date.now },
});


module.exports = mongoose.model('User', userSchema);

