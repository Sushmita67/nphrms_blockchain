const express = require('express');
const router = express.Router();
const hospitalController = require('../controllers/hospitalController');

router.get('/', hospitalController.getAllHospitals);
router.post('/', hospitalController.createHospital);
router.get('/:id', hospitalController.getHospitalById);
router.put('/:id', hospitalController.updateHospital);
router.delete('/:id', hospitalController.deleteHospital);

module.exports = router; 