const express = require('express');
const router = express.Router();
const patientHistoryController = require('../controllers/patientHistoryController');
const { protect } = require('../middleware/auth');

router.get('/:patientId', protect, patientHistoryController.getPatientHistory);
router.post('/', protect, patientHistoryController.createPatientHistory);
router.get('/', protect, patientHistoryController.getAllHistories); // admin only

module.exports = router; 