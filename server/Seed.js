require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/User');
const Hospital = require('./models/Hospital');
const Doctor = require('./models/Doctor');
const Patient = require('./models/Patient');
const PatientHistory = require('./models/PatientHistory');
const Consent = require('./models/Consent');
const Ledger = require('./models/Ledger');

const MONGO_URI = process.env.MONGO_URI;

const hospitalsData = [
  { name: 'Bir Hospital', location: 'Kathmandu', beds: 350 },
  { name: 'Dhulikhel Hospital', location: 'Dhulikhel', beds: 200 },
  { name: 'Patan Hospital', location: 'Lalitpur', beds: 250 },
  { name: 'Bharatpur Hospital', location: 'Chitwan', beds: 180 },
  { name: 'Pokhara Academy of Health Sciences', location: 'Pokhara', beds: 220 },
  { name: 'B.P. Koirala Institute of Health Sciences', location: 'Dharan', beds: 300 },
  { name: 'Koshi Hospital', location: 'Biratnagar', beds: 150 },
  { name: 'Lumbini Provincial Hospital', location: 'Butwal', beds: 170 },
  { name: 'Seti Zonal Hospital', location: 'Dhangadhi', beds: 140 },
  { name: 'Janakpur Zonal Hospital', location: 'Janakpur', beds: 160 },
];

const doctorsData = [
  { name: 'Dr. Anil Thapa', specialty: 'Cardiology' },
  { name: 'Dr. Sunita Lama', specialty: 'Pediatrics' },
  { name: 'Dr. Rajesh Shrestha', specialty: 'General Medicine' },
  { name: 'Dr. Sushma Karki', specialty: 'Gynecology' },
  { name: 'Dr. Prakash Adhikari', specialty: 'Orthopedics' },
  { name: 'Dr. Binita Rai', specialty: 'Neurology' },
  { name: 'Dr. Manoj Basnet', specialty: 'Dermatology' },
  { name: 'Dr. Ramesh Poudel', specialty: 'ENT' },
  { name: 'Dr. Sita Gurung', specialty: 'Psychiatry' },
  { name: 'Dr. Nabin Maharjan', specialty: 'Urology' },
  { name: 'Dr. Kamala Shrestha', specialty: 'Oncology' },
  { name: 'Dr. Bishal Khadka', specialty: 'Nephrology' },
];

const patientsData = [
  { name: 'Sita Sharma', age: 29, gender: 'Female' },
  { name: 'Ram Bahadur', age: 45, gender: 'Male' },
  { name: 'Mina Karki', age: 34, gender: 'Female' },
  { name: 'Kamal Gurung', age: 52, gender: 'Male' },
  { name: 'Rita Magar', age: 41, gender: 'Female' },
  { name: 'Bishal Rai', age: 37, gender: 'Male' },
  { name: 'Saraswati Adhikari', age: 23, gender: 'Female' },
  { name: 'Prakash Shrestha', age: 50, gender: 'Male' },
  { name: 'Nirmala Lama', age: 28, gender: 'Female' },
  { name: 'Suman Tamang', age: 33, gender: 'Male' },
  { name: 'Ramesh Thapa', age: 40, gender: 'Male' },
  { name: 'Sunita KC', age: 31, gender: 'Female' },
  { name: 'Bina Maharjan', age: 27, gender: 'Female' },
  { name: 'Dipak Basnet', age: 36, gender: 'Male' },
  { name: 'Manju Shrestha', age: 44, gender: 'Female' },
  { name: 'Kiran Khadka', age: 39, gender: 'Male' },
  { name: 'Sabina Rai', age: 26, gender: 'Female' },
  { name: 'Raju Gurung', age: 48, gender: 'Male' },
  { name: 'Laxmi Poudel', age: 32, gender: 'Female' },
  { name: 'Sushil Karki', age: 35, gender: 'Male' },
];

const adminData = {
  firstName: 'Admin',
  lastName: 'User',
  username: 'admin',
  email: 'admin@ehrnepal.com',
  password: 'admin@123',
  mobile: '9800000000',
  role: 'admin',
  status: 'verified',
};

const randomHistoryDetails = [
  'Routine checkup. No issues found.',
  'Diagnosed with hypertension. Prescribed medication.',
  'Follow-up visit for diabetes management.',
  'Minor surgery performed. Recovery normal.',
  'Complaints of chest pain. ECG and labs ordered.',
  'Annual physical examination. All vitals normal.',
  'Treated for seasonal flu.',
  'Vaccination administered.',
  'Consultation for allergy symptoms.',
  'Referred to specialist for further evaluation.',
];

async function seed() {
  await mongoose.connect(MONGO_URI);
  await User.deleteMany({});
  await Hospital.deleteMany({});
  await Doctor.deleteMany({});
  await Patient.deleteMany({});
  await PatientHistory.deleteMany({});
  await Consent.deleteMany({});
  await Ledger.deleteMany({});

  // Seed hospitals
  const hospitals = await Hospital.insertMany(hospitalsData);

  // Seed doctors (assign hospitals randomly)
  const doctorPassword = await bcrypt.hash('doctor@123', 10);
  const doctorUsers = [];
  for (let i = 0; i < doctorsData.length; i++) {
    const doc = doctorsData[i];
    const hospital = hospitals[Math.floor(Math.random() * hospitals.length)];
    // Create doctor user
    const user = new User({
      firstName: doc.name.split(' ')[1] || doc.name,
      lastName: doc.name.split(' ')[2] || '',
      username: doc.name.toLowerCase().replace(/\s/g, ''),
      email: `${doc.name.toLowerCase().replace(/\s/g, '')}@ehrnepal.com`,
      password: doctorPassword,
      mobile: '98' + Math.floor(10000000 + Math.random() * 90000000),
      role: 'doctor',
      status: 'verified',
    });
    await user.save();
    doctorUsers.push(user);
    // Create doctor profile
    await Doctor.create({
      name: doc.name,
      specialty: doc.specialty,
      hospital: hospital._id,
    });
  }

  // Seed patients (assign hospitals randomly)
  const patientPassword = await bcrypt.hash('patient@123', 10);
  const patientUsers = [];
  for (let i = 0; i < patientsData.length; i++) {
    const pat = patientsData[i];
    const hospital = hospitals[Math.floor(Math.random() * hospitals.length)];
    // Create patient user
    const user = new User({
      firstName: pat.name.split(' ')[0],
      lastName: pat.name.split(' ')[1] || '',
      username: pat.name.toLowerCase().replace(/\s/g, ''),
      email: `${pat.name.toLowerCase().replace(/\s/g, '')}@ehrnepal.com`,
      password: patientPassword,
      mobile: '98' + Math.floor(10000000 + Math.random() * 90000000),
      role: 'patient',
      status: 'verified',
    });
    await user.save();
    patientUsers.push(user);
    // Create patient profile
    await Patient.create({
      name: pat.name,
      age: pat.age,
      gender: pat.gender,
      hospital: hospital._id,
    });
  }

  // Seed admin
  const adminPassword = await bcrypt.hash(adminData.password, 10);
  await User.create({
    ...adminData,
    password: adminPassword,
  });

  // Seed random patient history for each patient
  for (let i = 0; i < patientUsers.length; i++) {
    const patient = patientUsers[i];
    for (let j = 0; j < 3; j++) {
      const doctor = doctorUsers[Math.floor(Math.random() * doctorUsers.length)];
      const hospital = hospitals[Math.floor(Math.random() * hospitals.length)];
      const details = randomHistoryDetails[Math.floor(Math.random() * randomHistoryDetails.length)];
      await PatientHistory.create({
        patient: patient._id,
        doctor: doctor._id,
        hospital: hospital._id,
        details,
        date: new Date(Date.now() - Math.floor(Math.random() * 10000000000)),
      });
    }
    // Also add a record created by the patient themselves
    await PatientHistory.create({
      patient: patient._id,
      doctor: patient._id, // patient as their own doctor for self-added
      hospital: hospitals[Math.floor(Math.random() * hospitals.length)]._id,
      details: 'Self-reported: Feeling healthy and no complaints.',
      date: new Date(),
    });
  }

  // Seed initial consents (all revoked by default)
  console.log('Seeding initial consents...');
  for (let i = 0; i < patientUsers.length; i++) {
    const patient = patientUsers[i];
    for (let j = 0; j < doctorUsers.length; j++) {
      const doctor = doctorUsers[j];
      const doctorProfile = await Doctor.findOne({ name: doctor.firstName + ' ' + doctor.lastName }).populate('hospital');
      if (doctorProfile) {
        await Consent.create({
          patient: patient.username, // Use username for consistency
          doctor: doctor.username, // Use username for consistency
          doctorName: doctorProfile.name,
          hospital: doctorProfile.hospital?.name || '',
          status: 'Revoked', // All consents start as revoked
        });
      }
    }
  }

  console.log('Database seeded successfully!');
  mongoose.disconnect();
}

seed(); 