const mongoose = require('mongoose');
const {Schema} = mongoose;

const UserSchema = new Schema({
  firstname: String,
  lastname: String,
  username: String,
  email: String,
  password: String,
});

const UserModel = mongoose.model('User', UserSchema);

module.exports = UserModel;