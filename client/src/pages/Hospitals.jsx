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

export default function Hospitals() {
  const { user } = useAuth();
  if (!user || user.role !== 'admin') {
    return <Typography variant="h6" color="error">Access denied. Only admin can manage hospitals.</Typography>;
  }
  const [hospitals, setHospitals] = useState([]);
  const [open, setOpen] = useState(false);
  const [editHospital, setEditHospital] = useState(null);
  const [form, setForm] = useState({ name: '', location: '', beds: '' });
  const [loading, setLoading] = useState(false);

  const fetchHospitals = async () => {
    setLoading(true);
    try {
      const res = await API.get('/hospitals');
      setHospitals(res.data);
    } catch (err) {
      // handle error
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchHospitals();
  }, []);

  const handleOpen = (hospital = null) => {
    setEditHospital(hospital);
    setForm(hospital || { name: '', location: '', beds: '' });
    setOpen(true);
  };
  const handleClose = () => setOpen(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSave = async () => {
    try {
      if (editHospital) {
        await API.put(`/hospitals/${editHospital._id}`, form);
      } else {
        await API.post('/hospitals', form);
      }
      fetchHospitals();
      setOpen(false);
    } catch (err) {
      // handle error
    }
  };

  const handleDelete = async (id) => {
    try {
      await API.delete(`/hospitals/${id}`);
      fetchHospitals();
    } catch (err) {
      // handle error
    }
  };

  const columns = [
    { field: '_id', headerName: 'ID', width: 180 },
    { field: 'name', headerName: 'Name', width: 180 },
    { field: 'location', headerName: 'Location', width: 180 },
    { field: 'beds', headerName: 'Beds', width: 110 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 180,
      renderCell: (params) => (
        <Stack direction="row" spacing={1}>
          <Button size="small" variant="outlined" onClick={() => handleOpen(params.row)}>Edit</Button>
          <Button size="small" color="error" variant="outlined" onClick={() => handleDelete(params.row._id)}>Delete</Button>
        </Stack>
      ),
    },
  ];

  return (
    <div style={{ height: 420, width: '100%' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <h2>Hospitals</h2>
        <Button variant="contained" color="primary" onClick={() => handleOpen()}>Add Hospital</Button>
      </Stack>
      <DataGrid rows={hospitals} columns={columns} pageSize={5} rowsPerPageOptions={[5]} disableSelectionOnClick autoHeight loading={loading} getRowId={row => row._id} />
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
        <DialogTitle>{editHospital ? 'Edit Hospital' : 'Add Hospital'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField label="Name" name="name" value={form.name} onChange={handleChange} fullWidth />
            <TextField label="Location" name="location" value={form.location} onChange={handleChange} fullWidth />
            <TextField label="Beds" name="beds" value={form.beds} onChange={handleChange} fullWidth type="number" />
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