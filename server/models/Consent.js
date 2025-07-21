const mongoose = require('mongoose');

const consentSchema = new mongoose.Schema({
  patient: { type: String, required: true }, // patient username
  doctor: { type: String, required: true }, // doctor username
  doctorName: { type: String, required: true },
  hospital: { type: String, required: true },
  status: { type: String, enum: ['Granted', 'Revoked'], default: 'Revoked' },
}, { timestamps: true });

module.exports = mongoose.model('Consent', consentSchema); 