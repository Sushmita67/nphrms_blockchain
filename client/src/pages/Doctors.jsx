import React, { useEffect, useState } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';
import { useAuth } from '../App';
import Typography from '@mui/material/Typography';
import API from '../utils/api';

export default function Doctors() {
  const { user } = useAuth();
  if (!user || user.role === 'patient') {
    return <Typography variant="h6" color="error">Access denied.</Typography>;
  }
  const [doctors, setDoctors] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [open, setOpen] = useState(false);
  const [editDoctor, setEditDoctor] = useState(null);
  const [form, setForm] = useState({ name: '', specialty: '', hospital: '' });
  const [loading, setLoading] = useState(false);

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const res = await API.get('/doctors');
      setDoctors(res.data);
    } catch (err) {}
    setLoading(false);
  };
  const fetchHospitals = async () => {
    try {
      const res = await API.get('/hospitals');
      setHospitals(res.data);
    } catch (err) {}
  };
  useEffect(() => {
    fetchDoctors();
    fetchHospitals();
  }, []);

  const handleOpen = (doctor = null) => {
    setEditDoctor(doctor);
    setForm(doctor || { name: '', specialty: '', hospital: '' });
    setOpen(true);
  };
  const handleClose = () => setOpen(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSave = async () => {
    try {
      if (editDoctor) {
        await API.put(`/doctors/${editDoctor._id}`, form);
      } else {
        await API.post('/doctors', form);
      }
      fetchDoctors();
      setOpen(false);
    } catch (err) {}
  };

  const handleDelete = async (id) => {
    try {
      await API.delete(`/doctors/${id}`);
      fetchDoctors();
    } catch (err) {}
  };

  const columns = [
    { field: '_id', headerName: 'ID', width: 180 },
    { field: 'name', headerName: 'Name', width: 180 },
    { field: 'specialty', headerName: 'Specialty', width: 180 },
    { field: 'hospital', headerName: 'Hospital', width: 180, valueGetter: (params) => {
      if (!params.row || !params.row.hospital) return '';
      return params.row.hospital.name || '';
    }},
    {
      field: 'actions',
      headerName: 'Actions',
      width: 180,
      renderCell: (params) => (
        <Stack direction="row" spacing={1}>
          {user.role === 'admin' && <Button size="small" variant="outlined" onClick={() => handleOpen(params.row)}>Edit</Button>}
          {user.role === 'admin' && <Button size="small" color="error" variant="outlined" onClick={() => handleDelete(params.row._id)}>Delete</Button>}
        </Stack>
      ),
    },
  ];

  return (
    <div style={{ height: 420, width: '100%' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <h2>Doctors</h2>
        {user.role === 'admin' && <Button variant="contained" color="primary" onClick={() => handleOpen()}>Add Doctor</Button>}
      </Stack>
      <DataGrid rows={doctors} columns={columns} pageSize={5} rowsPerPageOptions={[5]} disableSelectionOnClick autoHeight loading={loading} getRowId={row => row._id} />
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
        <DialogTitle>{editDoctor ? 'Edit Doctor' : 'Add Doctor'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField label="Name" name="name" value={form.name} onChange={handleChange} fullWidth />
            <TextField label="Specialty" name="specialty" value={form.specialty} onChange={handleChange} fullWidth />
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
    </div>
  );
} 