const Ledger = require('../models/Ledger');
const crypto = require('crypto');

// Get all ledger entries
exports.getAllLedgerEntries = async (req, res) => {
  try {
    const ledger = await Ledger.find().sort({ timestamp: -1 });
    res.status(200).json(ledger);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching ledger', error });
  }
};

// helper to compute block hash
function computeHash(payload) {
  const str = JSON.stringify(payload);
  return crypto.createHash('sha256').update(str).digest('hex');
}

// Create new ledger entry (simulated blockchain append)
exports.createLedgerEntry = async (req, res) => {
  try {
    const { type, entity, by, hospital, details } = req.body;
    
    if (!type || !entity || !by || !hospital) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const latest = await Ledger.findOne().sort({ createdAt: -1 });
    const prevBlock = latest?.block || '';
    const timestamp = new Date();
    const toHash = { type, entity, by, hospital, timestamp, prevBlock, details: details || '' };
    const blockHash = computeHash(toHash);
    const ledgerEntry = await Ledger.create({
      ...toHash,
      block: blockHash,
      prevBlock,
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

// Verify chain integrity: ensures each block's prevBlock matches previous block hash
exports.verifyChain = async (req, res) => {
  try {
    const chain = await Ledger.find().sort({ createdAt: 1 });
    let valid = true;
    for (let i = 0; i < chain.length; i++) {
      const current = chain[i];
      const expectedHash = computeHash({
        type: current.type,
        entity: current.entity,
        by: current.by,
        hospital: current.hospital,
        timestamp: current.timestamp,
        prevBlock: current.prevBlock || '',
        details: current.details || ''
      });
      if (current.block !== expectedHash) {
        valid = false;
        break;
      }
      if (i > 0 && current.prevBlock !== chain[i - 1].block) {
        valid = false;
        break;
      }
    }
    res.status(200).json({ valid, length: chain.length });
  } catch (error) {
    res.status(500).json({ message: 'Verification failed', error });
  }
};