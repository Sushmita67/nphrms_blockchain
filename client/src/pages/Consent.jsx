import React, { useEffect, useState } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import { useAuth } from '../App';
import API from '../utils/api';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

export default function Consent() {
  const { user } = useAuth();
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [consents, setConsents] = useState([]);
  const [dialog, setDialog] = useState({ open: false, row: null, action: '' });
  const [requestDialog, setRequestDialog] = useState({ open: false, patient: null });
  const [loading, setLoading] = useState(false);

  // Get patient identifier (username or _id)
  const patientId = user.username || user.email || user._id; // Use username consistently for consent matching

  // Debug logging
  console.log('Consent component - User object:', user);
  console.log('Consent component - PatientId:', patientId);

  // Fetch data based on user role
  useEffect(() => {
    async function fetchData() {
      if (!user) {
        console.log('No user object found, skipping fetch');
        return;
      }
      
      setLoading(true);
      try {
        console.log('Fetching consent data for user:', user);
        console.log('User role:', user?.role);
        console.log('PatientId:', patientId);
        
        if (user.role === 'patient') {
          if (!patientId) {
            console.log('No patientId found, skipping fetch');
            setLoading(false);
            return;
          }
          
          console.log('Fetching patient data with patientId:', patientId);
          const [docRes, consentRes] = await Promise.all([
            API.get('/doctors'),
            API.get(`/consents?patient=${patientId}`),
          ]);
          console.log('Patient data fetched:', { doctors: docRes.data, consents: consentRes.data });
          setDoctors(docRes.data);
          setConsents(consentRes.data);
        } else if (user.role === 'doctor') {
          console.log('Fetching doctor data with username:', user.username);
          const [patRes, consentRes] = await Promise.all([
            API.get('/patients'),
            API.get(`/consents/doctor?doctor=${user.username}`),
          ]);
          console.log('Doctor data fetched:', { patients: patRes.data, consents: consentRes.data });
          setPatients(patRes.data);
          setConsents(consentRes.data);
        } else if (user.role === 'admin') {
          console.log('Fetching admin data');
          const consentRes = await API.get('/consents/all');
          console.log('Admin data fetched:', consentRes.data);
          setConsents(consentRes.data);
        }
      } catch (err) {
        console.error('Error fetching consent data:', err);
        console.error('Error details:', err.response?.data || err.message);
        console.error('Error status:', err.response?.status);
      }
      setLoading(false);
    }
    fetchData();
  }, [user, patientId]);

  const handleToggle = (row, action) => {
    setDialog({ open: true, row, action });
  };

  const handleClose = () => setDialog({ open: false, row: null, action: '' });

  const handleRequestConsent = (patient) => {
    setRequestDialog({ open: true, patient });
  };

  const handleCloseRequest = () => setRequestDialog({ open: false, patient: null });

  const handleConfirm = async () => {
    try {
      await API.post('/consents/', {
        patient: patientId,
        doctor: dialog.row.doctorName, // use doctor's full name as required by backend
        action: dialog.action, // use 'Grant' or 'Revoke' as required by backend
      });
      // Refetch consents
      const consentRes = await API.get(`/consents?patient=${patientId}`);
      setConsents(consentRes.data);
    } catch (err) {
      console.error('Error updating consent:', err);
    }
    handleClose();
  };

  const handleRequestConfirm = async () => {
    try {
      await API.post('/consents/', {
        patient: requestDialog.patient._id || requestDialog.patient.username || requestDialog.patient.name.toLowerCase().replace(/\s/g, ''),
        doctor: user.firstName ? `${user.firstName} ${user.lastName}` : user.username, // use full name if available, else username
        action: 'Revoke', // Initially revoked, patient needs to grant
      });
      handleCloseRequest();
    } catch (err) {
      console.error('Error requesting consent:', err);
    }
  };

  // For patients - show consent management
  if (user.role === 'patient') {
    // Merge doctors and consents for patient view
    const mergedRows = doctors.map(doc => {
      const consent = consents.find(
        c => c.doctorName === doc.name && c.hospital === (doc.hospital?.name || '')
      );
      return {
        id: doc._id,
        doctor: doc.name.toLowerCase().replace(/\s/g, ''),
        doctorName: doc.name,
        hospital: doc.hospital?.name || '',
        status: consent ? consent.status : 'Revoked',
        // ...add any other fields needed for your DataGrid/actions
      };
    });

    const columns = [
      { field: 'doctorName', headerName: 'Doctor', width: 180 },
      { field: 'hospital', headerName: 'Hospital', width: 160 },
      {
        field: 'status',
        headerName: 'Status',
        width: 120,
        renderCell: (params) => (
          <Chip
            label={params.value}
            color={params.value === 'Granted' ? 'success' : 'default'}
            variant={params.value === 'Granted' ? 'filled' : 'outlined'}
            size="small"
          />
        ),
      },
      {
        field: 'actions',
        headerName: 'Actions',
        width: 200,
        renderCell: (params) => (
          <Stack direction="row" spacing={1}>
            <Button
              size="small"
              variant="contained"
              color="primary"
              disabled={params.row.status === 'Granted'}
              onClick={() => handleToggle(params.row, 'Grant')}
            >
              Grant
            </Button>
            <Button
              size="small"
              variant="outlined"
              color="secondary"
              disabled={params.row.status === 'Revoked'}
              onClick={() => handleToggle(params.row, 'Revoke')}
            >
              Revoke
            </Button>
          </Stack>
        ),
      },
    ];

    return (
      <div style={{ height: 480, width: '100%' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h5">Consent Management</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
            Grant or revoke consent for doctors/hospitals to view your health record. All actions are logged to the blockchain ledger.
          </Typography>
        </Stack>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
            <CircularProgress />
            <Typography sx={{ ml: 2 }}>Loading consent data...</Typography>
          </Box>
        ) : (
          <DataGrid 
            rows={mergedRows} 
            columns={columns} 
            pageSize={6} 
            rowsPerPageOptions={[6]} 
            disableSelectionOnClick 
            autoHeight 
            loading={loading} 
            getRowId={row => row.id} 
          />
        )}
        
        <Dialog open={dialog.open} onClose={handleClose} fullWidth maxWidth="xs">
          <DialogTitle>{dialog.action} Consent</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to <b>{dialog.action}</b> consent for <b>{dialog.row?.doctorName}</b> at <b>{dialog.row?.hospital}</b>?
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button onClick={handleConfirm} variant="contained" color={dialog.action === 'Grant' ? 'primary' : 'secondary'}>
              Confirm
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    );
  }

  // For doctors - show consent requests and patient list
  if (user.role === 'doctor') {
    const patientColumns = [
      { field: 'name', headerName: 'Patient Name', width: 180 },
      { field: 'age', headerName: 'Age', width: 90 },
      { field: 'gender', headerName: 'Gender', width: 110 },
      { field: 'hospital', headerName: 'Hospital', width: 180, valueGetter: (params) => {
        if (!params.row || !params.row.hospital) return '';
        return params.row.hospital.name || '';
      }},
      {
        field: 'actions',
        headerName: 'Actions',
        width: 150,
        renderCell: (params) => (
          <Button
            size="small"
            variant="contained"
            color="primary"
            onClick={() => handleRequestConsent(params.row)}
          >
            Request Consent
          </Button>
        ),
      },
    ];

    const consentColumns = [
      { field: 'patient', headerName: 'Patient', width: 150 },
      { field: 'hospital', headerName: 'Hospital', width: 160 },
      {
        field: 'status',
        headerName: 'Status',
        width: 120,
        renderCell: (params) => (
          <Chip
            label={params.value}
            color={params.value === 'Granted' ? 'success' : 'warning'}
            variant="filled"
            size="small"
          />
        ),
      },
      { field: 'createdAt', headerName: 'Requested On', width: 150, valueGetter: (params) => {
        return new Date(params.row.createdAt).toLocaleDateString();
      }},
    ];

    return (
      <div style={{ height: 600, width: '100%' }}>
        <Typography variant="h5" gutterBottom>Consent Management</Typography>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
            <CircularProgress />
            <Typography sx={{ ml: 2 }}>Loading consent data...</Typography>
          </Box>
        ) : (
          <>
            <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>Request Consent from Patients</Typography>
            <DataGrid 
              rows={patients} 
              columns={patientColumns} 
              pageSize={5} 
              rowsPerPageOptions={[5]} 
              disableSelectionOnClick 
              autoHeight 
              loading={loading} 
              getRowId={row => row._id} 
            />

            <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>My Consent Requests</Typography>
            <DataGrid 
              rows={consents} 
              columns={consentColumns} 
              pageSize={5} 
              rowsPerPageOptions={[5]} 
              disableSelectionOnClick 
              autoHeight 
              loading={loading} 
              getRowId={row => row._id || row.id} 
            />
          </>
        )}

        <Dialog open={requestDialog.open} onClose={handleCloseRequest} fullWidth maxWidth="sm">
          <DialogTitle>Request Consent</DialogTitle>
          <DialogContent>
            <Card sx={{ mt: 1 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Patient Information</Typography>
                <Typography>Name: {requestDialog.patient?.name}</Typography>
                <Typography>Age: {requestDialog.patient?.age}</Typography>
                <Typography>Gender: {requestDialog.patient?.gender}</Typography>
                <Typography>Hospital: {requestDialog.patient?.hospital?.name}</Typography>
              </CardContent>
            </Card>
            <Typography sx={{ mt: 2 }}>
              This will send a consent request to the patient. They will need to grant consent before you can view their medical history.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseRequest}>Cancel</Button>
            <Button onClick={handleRequestConfirm} variant="contained" color="primary">
              Send Request
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    );
  }

  // For admin - show all consents
  const adminColumns = [
    { field: 'patient', headerName: 'Patient', width: 150 },
    { field: 'doctor', headerName: 'Doctor', width: 150 },
    { field: 'hospital', headerName: 'Hospital', width: 160 },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={params.value === 'Granted' ? 'success' : 'warning'}
          variant="filled"
          size="small"
        />
      ),
    },
    { field: 'createdAt', headerName: 'Created On', width: 150, valueGetter: (params) => {
      return new Date(params.row.createdAt).toLocaleDateString();
    }},
  ];

  return (
    <div style={{ height: 480, width: '100%' }}>
      <Typography variant="h5" gutterBottom>All Consent Records</Typography>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>Loading consent data...</Typography>
        </Box>
      ) : (
        <DataGrid 
          rows={consents} 
          columns={adminColumns} 
          pageSize={10} 
          rowsPerPageOptions={[10]} 
          disableSelectionOnClick 
          autoHeight 
          loading={loading} 
          getRowId={row => row._id || row.id} 
        />
      )}
    </div>
  );
} 