const Hospital = require('../models/Hospital');

exports.getAllHospitals = async (req, res) => {
  try {
    const hospitals = await Hospital.find();
    res.status(200).json(hospitals);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching hospitals', error });
  }
};

exports.createHospital = async (req, res) => {
  try {
    const hospital = new Hospital(req.body);
    await hospital.save();
    res.status(201).json(hospital);
  } catch (error) {
    res.status(500).json({ message: 'Error creating hospital', error });
  }
};

exports.getHospitalById = async (req, res) => {
  try {
    const hospital = await Hospital.findById(req.params.id);
    if (!hospital) return res.status(404).json({ message: 'Hospital not found' });
    res.status(200).json(hospital);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching hospital', error });
  }
};

exports.updateHospital = async (req, res) => {
  try {
    const hospital = await Hospital.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!hospital) return res.status(404).json({ message: 'Hospital not found' });
    res.status(200).json(hospital);
  } catch (error) {
    res.status(500).json({ message: 'Error updating hospital', error });
  }
};

exports.deleteHospital = async (req, res) => {
  try {
    const hospital = await Hospital.findByIdAndDelete(req.params.id);
    if (!hospital) return res.status(404).json({ message: 'Hospital not found' });
    res.status(200).json({ message: 'Hospital deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting hospital', error });
  }
}; 