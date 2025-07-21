const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'doctor', 'patient'], default: 'patient' },
  status: { type: String, enum: ['pending', 'verified'], default: 'pending' },
  photo: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema); 