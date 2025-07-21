const Ledger = require('../models/Ledger');

// Get all ledger entries
exports.getAllLedgerEntries = async (req, res) => {
  try {
    const ledger = await Ledger.find().sort({ timestamp: -1 });
    res.status(200).json(ledger);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching ledger', error });
  }
};

// Create new ledger entry
exports.createLedgerEntry = async (req, res) => {
  try {
    const { type, entity, by, hospital } = req.body;
    
    if (!type || !entity || !by || !hospital) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const blockHash = Math.random().toString(16).slice(2, 10) + '...';
    const ledgerEntry = await Ledger.create({
      type,
      entity,
      by,
      hospital,
      timestamp: new Date(),
      block: blockHash,
    });

    res.status(201).json(ledgerEntry);
  } catch (error) {
    res.status(500).json({ message: 'Error creating ledger entry', error });
  }
};

// Get ledger entries by entity (patient)
exports.getLedgerByEntity = async (req, res) => {
  try {
    const { entity } = req.params;
    const ledger = await Ledger.find({ entity }).sort({ timestamp: -1 });
    res.status(200).json(ledger);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching ledger entries', error });
  }
}; 