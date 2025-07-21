const express = require('express');
const router = express.Router();
const consentController = require('../controllers/consentController');

router.get('/', consentController.getConsentsByPatient);
router.get('/doctor', consentController.getConsentsByDoctor);
router.post('/', consentController.createConsent);
router.get('/all', consentController.getAllConsents);

module.exports = router; 