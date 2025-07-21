const mongoose = require('mongoose');

const ledgerSchema = new mongoose.Schema({
  type: { type: String, required: true }, // e.g., 'Consent Granted', 'Record Created'
  entity: { type: String, required: true }, // patient name
  by: { type: String, required: true }, // doctor name
  hospital: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  block: { type: String, required: true }, // simulated block hash
  details: { type: String }, // additional details about the action
}, { timestamps: true });

module.exports = mongoose.model('Ledger', ledgerSchema); 