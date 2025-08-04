const mongoose = require('mongoose');

const ledgerSchema = new mongoose.Schema({
  type: { type: String, required: true }, // e.g., 'Consent Granted', 'Record Created'
  entity: { type: String, required: true }, // patient username or id
  by: { type: String, required: true }, // doctor username/name or 'self'
  hospital: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  block: { type: String, required: true }, // current block hash (sha256)
  prevBlock: { type: String, default: '' }, // previous block hash (chain link)
  details: { type: String }, // additional details about the action
}, { timestamps: true });

module.exports = mongoose.model('Ledger', ledgerSchema); 