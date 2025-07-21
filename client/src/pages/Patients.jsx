import React, { useEffect, useState } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import { useAuth } from '../App';

import API from '../utils/api';

export default function Patients() {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [patientHistory, setPatientHistory] = useState([]);
  const [open, setOpen] = useState(false);
  const [historyDialog, setHistoryDialog] = useState(false);
  const [editPatient, setEditPatient] = useState(null);
  const [form, setForm] = useState({ name: '', age: '', gender: '', hospital: '' });
  const [historyForm, setHistoryForm] = useState({ details: '' });
  const [loading, setLoading] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const res = await API.get('/patients');
      setPatients(res.data);
    } catch (err) {}
    setLoading(false);
  };

  const fetchHospitals = async () => {
    try {
      const res = await API.get('/hospitals');
      setHospitals(res.data);
    } catch (err) {}
  };

  const fetchPatientHistory = async (patientId) => {
    try {
      console.log('Fetching patient history for ID:', patientId);
      console.log('Current user:', user);
      const res = await API.get(`/patient-history/${patientId}`);
      console.log('Patient History Data:', res.data);
      setPatientHistory(res.data);
    } catch (err) {
      console.error('Error fetching patient history:', err);
      setPatientHistory([]);
    }
  };

  useEffect(() => {
    if (user?.role === 'patient') {
      // For patients, fetch their own history
      if (user._id) {
        console.log('Using user._id for patient history:', user._id);
        fetchPatientHistory(user._id);
      } else if (user.username) {
        console.log('Using user.username for patient history:', user.username);
        fetchPatientHistory(user.username);
      }
    } else {
      // For doctors and admins, fetch patient list
      fetchPatients();
      fetchHospitals();
    }
  }, [user]);

  const handleOpen = (patient = null) => {
    setEditPatient(patient);
    setForm(patient || { name: '', age: '', gender: '', hospital: '' });
    setOpen(true);
  };

  const handleClose = () => setOpen(false);

  const handleHistoryOpen = (patient) => {
    setSelectedPatient(patient);
    setHistoryForm({ details: '' });
    fetchPatientHistory(patient._id);
    setHistoryDialog(true);
  };

  const handleHistoryClose = () => setHistoryDialog(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleHistoryChange = (e) => setHistoryForm({ ...historyForm, [e.target.name]: e.target.value });

  const handleSave = async () => {
    try {
      if (editPatient) {
        await API.put(`/patients/${editPatient._id}`, form);
      } else {
        await API.post('/patients', form);
      }
      fetchPatients();
      setOpen(false);
    } catch (err) {}
  };

  const handleDelete = async (id) => {
    try {
      await API.delete(`/patients/${id}`);
      fetchPatients();
    } catch (err) {}
  };

  const handleAddHistory = async () => {
    try {
      const patientId = user?.role === 'patient' ? user._id : selectedPatient._id;
      await API.post('/patient-history', {
        patient: patientId,
        details: historyForm.details,
      });
      fetchPatientHistory(patientId);
      setHistoryForm({ details: '' });
    } catch (err) {
      console.error('Error adding history:', err);
    }
  };

  // For patients - show their medical history
  if (user?.role === 'patient') {
    const historyColumns = [
      { field: 'date', headerName: 'Date', width: 150, valueGetter: (params) => {
        if (!params || !params.row) return 'Unknown date';
        const rawDate = params.row.date;
        if (rawDate) {
          const d = new Date(rawDate);
          if (!isNaN(d.getTime())) {
            const day = String(d.getDate()).padStart(2, '0');
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const year = d.getFullYear();
            return `${day}-${month}-${year}`;
          }
        }
        return 'Unknown date';
      }},
      { field: 'details', headerName: 'Medical Details', width: 300 },
      { field: 'doctor', headerName: 'Doctor', width: 150, valueGetter: (params) => {
        if (!params || !params.row) return 'Self-reported';
        if (!params.row.doctor) return 'Self-reported';
        // Handle populated doctor object
        if (params.row.doctor.username) return params.row.doctor.username;
        if (params.row.doctor.firstName || params.row.doctor.lastName) return `${params.row.doctor.firstName || ''} ${params.row.doctor.lastName || ''}`.trim();
        if (params.row.doctor.name) return params.row.doctor.name;
        return 'Self-reported';
      }},
      { field: 'hospital', headerName: 'Hospital', width: 200, valueGetter: (params) => {
        if (!params || !params.row) return '';
        if (params.row.hospital && params.row.hospital.name) return params.row.hospital.name;
        return '';
      }},
    ];

    return (
      <div style={{ height: 420, width: '100%' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <h2>My Medical Records</h2>
          <Button variant="contained" color="primary" onClick={() => setHistoryDialog(true)}>
            Add New Record
          </Button>
        </Stack>
        
        <DataGrid 
          rows={patientHistory} 
          columns={historyColumns} 
          pageSize={5} 
          rowsPerPageOptions={[5]} 
          disableSelectionOnClick 
          autoHeight 
          loading={loading} 
          getRowId={row => row._id} 
        />

        <Dialog open={historyDialog} onClose={handleHistoryClose} fullWidth maxWidth="sm">
          <DialogTitle>Add New Medical Record</DialogTitle>
          <DialogContent>
            <Stack spacing={2} mt={1}>
              <TextField 
                label="Medical Details" 
                name="details" 
                value={historyForm.details} 
                onChange={handleHistoryChange} 
                fullWidth 
                multiline 
                rows={4}
                placeholder="Describe your symptoms, medications, or any health updates..."
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleHistoryClose}>Cancel</Button>
            <Button onClick={handleAddHistory} variant="contained" color="primary">Save</Button>
          </DialogActions>
        </Dialog>
      </div>
    );
  }

  // For doctors and admins - show patient list
  const columns = [
    { field: '_id', headerName: 'ID', width: 180 },
    { field: 'name', headerName: 'Name', width: 180 },
    { field: 'age', headerName: 'Age', width: 90 },
    { field: 'gender', headerName: 'Gender', width: 110 },
    { field: 'hospital', headerName: 'Hospital', width: 180, valueGetter: (params) => {
      if (!params || !params.row) return '';
      if (!params.row.hospital) return '';
      return params.row.hospital.name || '';
    }},
    {
      field: 'actions',
      headerName: 'Actions',
      width: 220,
      renderCell: (params) => (
        <Stack direction="row" spacing={1}>
          {user?.role !== 'patient' && <Button size="small" variant="outlined" onClick={() => handleOpen(params.row)}>Edit</Button>}
          {user?.role !== 'patient' && <Button size="small" color="error" variant="outlined" onClick={() => handleDelete(params.row._id)}>Delete</Button>}
          <Button size="small" color="primary" variant="contained" onClick={() => handleHistoryOpen(params.row)}>View History</Button>
        </Stack>
      ),
    },
  ];



  return (
    <div style={{ height: 420, width: '100%' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <h2>Patients</h2>
        {user?.role !== 'patient' && <Button variant="contained" color="primary" onClick={() => handleOpen()}>Add Patient</Button>}
      </Stack>
      <DataGrid rows={patients} columns={columns} pageSize={5} rowsPerPageOptions={[5]} disableSelectionOnClick autoHeight loading={loading} getRowId={row => row._id} />
      
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
        <DialogTitle>{editPatient ? 'Edit Patient' : 'Add Patient'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField label="Name" name="name" value={form.name} onChange={handleChange} fullWidth />
            <TextField label="Age" name="age" value={form.age} onChange={handleChange} fullWidth type="number" />
            <TextField label="Gender" name="gender" value={form.gender} onChange={handleChange} fullWidth />
            <TextField label="Hospital" name="hospital" value={form.hospital} onChange={handleChange} fullWidth select SelectProps={{ native: true }}>
              <option value="">Select Hospital</option>
              {hospitals.map(h => <option key={h._id} value={h._id}>{h.name}</option>)}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" color="primary">Save</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={historyDialog} onClose={handleHistoryClose} fullWidth maxWidth="md">
        <DialogTitle>
          {selectedPatient ? `${selectedPatient.name}'s Medical History` : 'Medical History'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            {selectedPatient && (
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Patient Information</Typography>
                  <Typography>Name: {selectedPatient.name}</Typography>
                  <Typography>Age: {selectedPatient.age}</Typography>
                  <Typography>Gender: {selectedPatient.gender}</Typography>
                </CardContent>
              </Card>
            )}
            
            <Typography variant="h6">Medical Records</Typography>
            <DataGrid 
              rows={patientHistory} 
              columns={[
                { field: 'date', headerName: 'Date', width: 120, valueGetter: (params) => {
                  if (!params || !params.row) return 'Unknown date';
                  return new Date(params.row.date).toLocaleDateString();
                }},
                { field: 'details', headerName: 'Details', width: 300 },
                { field: 'doctor', headerName: 'Doctor', width: 150, valueGetter: (params) => {
                  if (!params || !params.row) return 'Self-reported';
                  return params.row.doctor.firstName + ' ' + params.row.doctor.lastName;
                }},
              ]} 
              pageSize={5} 
              rowsPerPageOptions={[5]} 
              disableSelectionOnClick 
              autoHeight 
              getRowId={row => row._id} 
            />

            {user?.role === 'doctor' && (
              <Stack spacing={2}>
                <Typography variant="h6">Add New Record</Typography>
                <TextField 
                  label="Medical Details" 
                  name="details" 
                  value={historyForm.details} 
                  onChange={handleHistoryChange} 
                  fullWidth 
                  multiline 
                  rows={4}
                  placeholder="Enter medical details..."
                />
                <Button onClick={handleAddHistory} variant="contained" color="primary">
                  Add Record
                </Button>
              </Stack>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleHistoryClose}>Close</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
} 