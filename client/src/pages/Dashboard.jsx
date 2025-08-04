import React, { useEffect, useState } from 'react';
import { useAuth } from '../App';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import API from '../utils/api';

export default function Dashboard() {
  const { user } = useAuth();
  const [hospitals, setHospitals] = useState([]);
  const [users, setUsers] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [patientHistory, setPatientHistory] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [consents, setConsents] = useState([]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        if (user.role === 'admin') {
          const [hospRes, userRes, patRes, docRes] = await Promise.all([
            API.get('/hospitals'),
            API.get('/users'),
            API.get('/patients'),
            API.get('/doctors'),
          ]);
          setHospitals(hospRes.data);
          setUsers(userRes.data);
          setPatients(patRes.data);
          setDoctors(docRes.data);
        } else if (user.role === 'doctor') {
          const [docRes, patRes, consentRes] = await Promise.all([
            API.get('/doctors'),
            API.get('/patients'),
            API.get(`/consents/doctor?doctor=${user.username}`),
          ]);
          setDoctors(docRes.data);
          setPatients(patRes.data);
          setConsents(consentRes.data);
        } else if (user.role === 'patient') {
          const patRes = await API.get('/patients');
          setPatients(patRes.data);
          // Fetch patient's own history
          try {
            if (!user._id) throw new Error('User ID missing for patient');
            const historyRes = await API.get(`/patient-history/${user._id}`);
            setPatientHistory(historyRes.data);
          } catch (err) {
            console.error('Error fetching patient history:', err);
          }
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      }
      setLoading(false);
    }
    if (user) fetchData();
  }, [user]);

  const handlePatientSearch = () => {
    // This will be handled by the Patients page
    // For now, just show filtered patients
  };

  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!user) return null;
  if (loading) return <Typography>Loading...</Typography>;

  if (user.role === 'admin') {
    return (
      <Box sx={{ maxWidth: 1200, mx: 'auto', mt: 4 }}>
        <Card sx={{ bgcolor: 'background.paper', boxShadow: 3, mb: 3 }}>
          <CardContent>
            <Typography variant="h4" color="primary" fontWeight="bold" gutterBottom>
              Admin Dashboard
            </Typography>
            <Typography variant="body1" sx={{ mb: 3 }}>
              Manage hospitals, doctors, and users in the Nepal HealthChain system.
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Card sx={{ bgcolor: 'primary.light', color: 'white' }}>
                  <CardContent>
                    <Typography variant="h6">Total Hospitals</Typography>
                    <Typography variant="h4">{hospitals.length}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card sx={{ bgcolor: 'secondary.light', color: 'white' }}>
                  <CardContent>
                    <Typography variant="h6">Total Doctors</Typography>
                    <Typography variant="h4">{doctors.length}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card sx={{ bgcolor: 'success.light', color: 'white' }}>
                  <CardContent>
                    <Typography variant="h6">Total Patients</Typography>
                    <Typography variant="h4">{patients.length}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Typography variant="h6" color="primary" sx={{ mt: 3, mb: 2 }}>Recent Hospitals</Typography>
            <List>
              {hospitals.slice(0, 5).map(h => (
                <ListItem key={h._id}>
                  <ListItemText primary={h.name} secondary={`${h.location} - ${h.beds} beds`} />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      </Box>
    );
  }

  if (user.role === 'doctor') {
    // Find the doctor profile
    const myDoctor = doctors.find(
      d =>
        d.name &&
        user.username &&
        d.name.toLowerCase().replace(/\s/g, '') === user.username.toLowerCase().replace(/\s/g, '')
    );
    
    // Debug logging
    console.log('Doctor Dashboard Debug:', {
      user: user.username,
      myDoctor: myDoctor,
      allConsents: consents,
      allPatients: patients
    });
    
    // Get patients who have granted consent to this doctor
    const grantedConsents = consents.filter(c => c.status === 'Granted');
    
    console.log('Granted Consents for this doctor:', grantedConsents);
    
    // Get patient details for those who granted consent
    const myPatients = patients.filter(p => 
      grantedConsents.some(consent => {
        // Convert patient name to username format for matching
        const patientUsername = p.name ? p.name.toLowerCase().replace(/\s/g, '') : '';
        const matches = consent.patient === patientUsername;
        console.log(`Checking patient ${p.name} (${patientUsername}) against consent.patient ${consent.patient}: ${matches}`);
        return matches;
      })
    );
    
    console.log('My Patients:', myPatients);
    
    return (
      <Box sx={{ maxWidth: 1200, mx: 'auto', mt: 4 }}>
        <Card sx={{ bgcolor: 'background.paper', boxShadow: 3, mb: 3 }}>
          <CardContent>
            <Typography variant="h4" color="primary" fontWeight="bold" gutterBottom>
              Doctor Dashboard
            </Typography>
            <Typography variant="body1" sx={{ mb: 3 }}>
              Welcome, Dr. {myDoctor?.name || user.username}. Manage your patients and their medical records.
            </Typography>

            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} md={6}>
                <Card sx={{ bgcolor: 'primary.light', color: 'white' }}>
                  <CardContent>
                    <Typography variant="h6">My Patients (With Consent)</Typography>
                    <Typography variant="h4">{myPatients.length}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card sx={{ bgcolor: 'secondary.light', color: 'white' }}>
                  <CardContent>
                    <Typography variant="h6">Hospital</Typography>
                    <Typography variant="h6">{myDoctor?.hospital?.name || 'Not Assigned'}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
              <TextField
                label="Search Patients"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                sx={{ flexGrow: 1 }}
              />
              <Button variant="contained" color="primary">
                Search
              </Button>
            </Stack>

            <Typography variant="h6" color="primary" sx={{ mb: 2 }}>My Patients (With Consent)</Typography>
            <List>
              {myPatients.length === 0 && (
                <ListItem>
                  <ListItemText primary="No patients have granted consent to you yet. Patients need to grant consent before you can view their records." />
                </ListItem>
              )}
              {myPatients.map(p => (
                <ListItem key={p._id}>
                  <ListItemText 
                    primary={p.name} 
                    secondary={`Age: ${p.age} | Gender: ${p.gender} | Hospital: ${p.hospital?.name || ''}`} 
                  />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      </Box>
    );
  }

  // Default: patient
  const patient = patients.find(p => {
    if (!p.name || !user.username) return false;
    return p.name.toLowerCase().replace(/ /g, '') === user.username.toLowerCase();
  });

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', mt: 4 }}>
      <Card sx={{ bgcolor: 'background.paper', boxShadow: 3, mb: 3 }}>
        <CardContent>
          <Typography variant="h4" color="primary" fontWeight="bold" gutterBottom>
            Patient Dashboard
          </Typography>
          <Typography variant="body1" sx={{ mb: 3 }}>
            Welcome, {user.username}. Here is your health information:
          </Typography>

          {patient ? (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card sx={{ bgcolor: 'primary.light', color: 'white' }}>
                  <CardContent>
                    <Typography variant="h6">Personal Information</Typography>
                    <Typography>Name: {patient.name}</Typography>
                    <Typography>Age: {patient.age}</Typography>
                    <Typography>Gender: {patient.gender}</Typography>
                    <Typography>Hospital: {patient.hospital?.name || 'Not Assigned'}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card sx={{ bgcolor: 'secondary.light', color: 'white' }}>
                  <CardContent>
                    <Typography variant="h6">Medical Records</Typography>
                    <Typography variant="h4">{patientHistory.length}</Typography>
                    <Typography>Total Records</Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          ) : (
            <Typography color="error">No health record found for this patient.</Typography>
          )}

          {patientHistory.length > 0 && (
            <>
              <Typography variant="h6" color="primary" sx={{ mt: 3, mb: 2 }}>Recent Medical Records</Typography>
              <List>
                {patientHistory.slice(0, 3).map(record => {
                  const date = record.date ? new Date(record.date).toLocaleDateString() : (record.createdAt ? new Date(record.createdAt).toLocaleDateString() : 'Unknown date');
                  // Determine doctor display
                  let doctorName = 'Self-reported';
                  const patientId = record.patient?._id || record.patient;
                  const doctorId = record.doctor?._id || record.doctor;
                  const isSelfReported = patientId && doctorId && String(patientId) === String(doctorId);
                  if (!isSelfReported && record.doctor) {
                    if (record.doctor.username) doctorName = record.doctor.username;
                    else if (record.doctor.firstName || record.doctor.lastName) doctorName = `${record.doctor.firstName || ''} ${record.doctor.lastName || ''}`.trim();
                    else if (record.doctor.name) doctorName = record.doctor.name;
                  }
                  let hospitalName = '';
                  if (record.hospital && (record.hospital.name)) {
                    hospitalName = record.hospital.name;
                  }
                  return (
                    <ListItem key={record._id}>
                      <ListItemText 
                        primary={record.details}
                        secondary={`${date}${hospitalName ? ' - ' + hospitalName : ''}${doctorName ? ' - ' + doctorName : ''}`}
                      />
                    </ListItem>
                  );
                })}
              </List>
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
} 