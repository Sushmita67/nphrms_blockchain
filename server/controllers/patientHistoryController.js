const PatientHistory = require('../models/PatientHistory');
const Consent = require('../models/Consent');
const Doctor = require('../models/Doctor');
const User = require('../models/User');
const Hospital = require('../models/Hospital');
const Ledger = require('../models/Ledger');
const ledgerController = require('./ledgerController');

// Helper: Check if doctor has consent for patient (direct or via hospital)
async function hasConsent(patientId, doctorId) {
  const patient = await User.findById(patientId);
  const doctor = await User.findById(doctorId);
  if (!patient || !doctor) return false;
  // Check direct consent
  const directConsent = await Consent.findOne({ patient: patient.username, doctor: doctor.username, status: 'Granted' });
  if (directConsent) return true;
  // Check hospital consent
  const doctorProfile = await Doctor.findOne({ name: { $regex: doctor.username, $options: 'i' } }).populate('hospital');
  if (!doctorProfile) return false;
  const hospitalConsent = await Consent.findOne({ patient: patient.username, hospital: doctorProfile.hospital?.name, status: 'Granted' });
  return !!hospitalConsent;
}

// Get patient history (secure)
exports.getPatientHistory = async (req, res) => {
  try {
    const { patientId } = req.params;
    const user = req.user; // from auth middleware
    if (!user) return res.status(401).json({ message: 'Unauthorized' });
    // Admin can view all
    if (user.role === 'admin') {
      const history = await PatientHistory.find({ patient: patientId }).populate('doctor hospital patient');
      return res.status(200).json(history);
    }
    // Patient can view their own
    if (user.role === 'patient' && user._id.toString() === patientId) {
      const history = await PatientHistory.find({ patient: patientId }).populate('doctor hospital patient');
      return res.status(200).json(history);
    }
    // Doctor: check consent
    if (user.role === 'doctor') {
      const allowed = await hasConsent(patientId, user._id);
      if (!allowed) return res.status(403).json({ message: 'No consent to view this patient history' });
      const history = await PatientHistory.find({ patient: patientId }).populate('doctor hospital patient');
      return res.status(200).json(history);
    }
    return res.status(403).json({ message: 'Forbidden' });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching patient history', error });
  }
};

// Create patient history (doctor or patient self-report)
exports.createPatientHistory = async (req, res) => {
  try {
    const user = req.user;
    const { patient, hospital, details } = req.body;
    if (!details) return res.status(400).json({ message: 'Details are required' });
    if (!user) return res.status(401).json({ message: 'Unauthorized' });
    if (user.role === 'doctor') {
      if (!patient || !hospital) return res.status(400).json({ message: 'All fields required' });
      // Check consent
      const allowed = await hasConsent(patient, user._id);
      if (!allowed) return res.status(403).json({ message: 'No consent to add history for this patient' });
      const history = await PatientHistory.create({
        patient,
        doctor: user._id,
        hospital,
        details,
      });
      // Log to ledger
      try {
        const doctorUser = await User.findById(user._id);
        const hospitalDoc = await Hospital.findById(hospital);
        await ledgerController.createLedgerEntry({
          body: {
            type: 'Record Created',
            entity: patient.toString(),
            by: doctorUser?.username || 'doctor',
            hospital: hospitalDoc?.name || 'Unknown',
            details,
          }
        }, { status: () => ({ json: () => null }) });
      } catch (e) {}
      return res.status(201).json(history);
    } else if (user.role === 'patient') {
      // Patient can add their own history (self-reported)
      // Use their own _id for both patient and doctor fields
      // Use hospital from their Patient profile (by username) if not provided
      let hospitalId = hospital;
      if (!hospitalId) {
        const PatientModel = require('../models/Patient');
        const patientProfile = await PatientModel.findOne({ name: new RegExp('^' + user.username + '$', 'i') });
        hospitalId = patientProfile?.hospital;
      }
      if (!hospitalId) return res.status(400).json({ message: 'Hospital is required' });
      const history = await PatientHistory.create({
        patient: user._id,
        doctor: user._id,
        hospital: hospitalId,
        details,
      });
      // Log to ledger as self-report
      try {
        const hospitalDoc = await Hospital.findById(hospitalId);
        await ledgerController.createLedgerEntry({
          body: {
            type: 'Self Report',
            entity: user._id.toString(),
            by: 'self',
            hospital: hospitalDoc?.name || 'Unknown',
            details,
          }
        }, { status: () => ({ json: () => null }) });
      } catch (e) {}
      return res.status(201).json(history);
    } else {
      return res.status(401).json({ message: 'Only doctors or patients can create history' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error creating patient history', error });
  }
};

// (Optional) Admin: get all histories
exports.getAllHistories = async (req, res) => {
  try {
    const histories = await PatientHistory.find().populate('doctor hospital patient');
    res.status(200).json(histories);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching histories', error });
  }
}; 