const Consent = require('../models/Consent');
const Doctor = require('../models/Doctor');
const Ledger = require('../models/Ledger');
const ledgerController = require('./ledgerController');

// Get consents for a specific patient
exports.getConsentsByPatient = async (req, res) => {
  try {
    const { patient } = req.query;
    if (!patient) {
      return res.status(400).json({ message: 'Patient parameter is required' });
    }

    let consents = await Consent.find({ patient });
    
    // If no consents exist, initialize them for all doctors
    if (consents.length === 0) {
      const doctors = await Doctor.find().populate('hospital');
      const initialConsents = doctors.map((doc) => ({
        patient: patient,
        doctor: doc.name.toLowerCase().replace(/\s/g, ''),
        doctorName: doc.name,
        hospital: doc.hospital?.name || '',
        status: 'Revoked',
      }));
      
      // Save the initial consents to database
      await Consent.insertMany(initialConsents);
      consents = await Consent.find({ patient });
    }

    res.status(200).json(consents);
  } catch (error) {
    console.error('Error fetching consents by patient:', error);
    res.status(500).json({ message: 'Error fetching consents', error: error.message });
  }
};

// Get consents for a specific doctor
exports.getConsentsByDoctor = async (req, res) => {
  try {
    const { doctor } = req.query;
    if (!doctor) {
      return res.status(400).json({ message: 'Doctor parameter is required' });
    }

    console.log('Fetching consents for doctor:', doctor);
    console.log('Searching for doctor field that matches:', doctor);
    
    // Try to find the doctor in the database to get the correct username format
    const doctorDoc = await Doctor.findOne({ name: { $regex: doctor, $options: 'i' } });
    if (doctorDoc) {
      console.log('Found doctor in database:', doctorDoc.name);
      const doctorUsername = doctorDoc.name.toLowerCase().replace(/\s/g, '');
      console.log('Doctor username format:', doctorUsername);
      
      const consents = await Consent.find({ doctor: doctorUsername });
      console.log('Found consents with doctor username:', consents);
      res.status(200).json(consents);
    } else {
      // Fallback: search with the provided doctor parameter
      console.log('Doctor not found in database, searching with provided parameter');
      const consents = await Consent.find({ doctor });
      console.log('Found consents with provided parameter:', consents);
      res.status(200).json(consents);
    }
  } catch (error) {
    console.error('Error in getConsentsByDoctor:', error);
    res.status(500).json({ message: 'Error fetching consents', error: error.message });
  }
};

// Create or update consent
exports.createConsent = async (req, res) => {
  try {
    const { patient, doctor, action } = req.body;
    
    console.log('Creating consent with:', { patient, doctor, action });
    
    if (!patient || !doctor || !action) {
      return res.status(400).json({ message: 'Patient, doctor, and action are required' });
    }

    // Find the doctor to get their details
    const doctorDoc = await Doctor.findOne({ name: { $regex: doctor, $options: 'i' } }).populate('hospital');
    if (!doctorDoc) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    console.log('Found doctor:', doctorDoc.name, 'Username format:', doctorDoc.name.toLowerCase().replace(/\s/g, ''));

    // Update or create consent
    const consent = await Consent.findOneAndUpdate(
      { patient, doctor: doctorDoc.name.toLowerCase().replace(/\s/g, '') },
      {
        patient,
        doctor: doctorDoc.name.toLowerCase().replace(/\s/g, ''), // Store doctor's username format
        doctorName: doctorDoc.name, // Store full name for display
        hospital: doctorDoc.hospital?.name || '',
        status: action === 'Grant' ? 'Granted' : 'Revoked',
      },
      { upsert: true, new: true }
    );

    console.log('Created/Updated consent:', consent);

    // Add to ledger with proper details
    await ledgerController.createLedgerEntry({
      body: {
        type: `Consent ${action}`,
        entity: patient,
        by: doctorDoc.name,
        hospital: doctorDoc.hospital?.name || '',
        details: `Patient ${patient} ${action.toLowerCase()}ed consent to Dr. ${doctorDoc.name} at ${doctorDoc.hospital?.name || 'Unknown Hospital'}`
      }
    }, { status: () => ({ json: () => null }) });

    res.status(200).json(consent);
  } catch (error) {
    console.error('Error creating consent:', error);
    res.status(500).json({ message: 'Error creating consent', error: error.message });
  }
};

// Get all consents (admin only)
exports.getAllConsents = async (req, res) => {
  try {
    const consents = await Consent.find();
    res.status(200).json(consents);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching consents', error });
  }
}; 