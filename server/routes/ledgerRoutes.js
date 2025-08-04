const express = require('express');
const router = express.Router();
const ledgerController = require('../controllers/ledgerController');

router.get('/', ledgerController.getAllLedgerEntries);
router.post('/', ledgerController.createLedgerEntry);
router.get('/:entity', ledgerController.getLedgerByEntity);
router.get('/_internal/verify', ledgerController.verifyChain);

module.exports = router; 