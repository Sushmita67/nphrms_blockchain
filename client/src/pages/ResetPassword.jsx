import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Alert from '@mui/material/Alert';
import API from '../utils/api';

export default function ResetPassword() {
  const [form, setForm] = useState({ email: '', otp: '', password: '', confirm: '' });
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.otp || !form.password || !form.confirm) {
      setError('All fields are required');
      return;
    }
    if (form.password !== form.confirm) {
      setError('Passwords do not match');
      return;
    }
    setError('');
    try {
      await API.post('/auth/reset-password', {
        email: form.email,
        otp: form.otp,
        newPassword: form.password,
      });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password');
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
      <Paper elevation={6} sx={{ p: 4, minWidth: 340, maxWidth: 400 }}>
        <Typography variant="h5" fontWeight="bold" mb={2} align="center">Reset Password</Typography>
        {success && <Alert severity="success" sx={{ mb: 2 }}>Password has been reset. You may now <Link to="/login">login</Link>.</Alert>}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <form onSubmit={handleSubmit}>
          <TextField
            label="Email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            fullWidth
            margin="normal"
            required
          />
          <TextField
            label="OTP"
            name="otp"
            value={form.otp}
            onChange={handleChange}
            fullWidth
            margin="normal"
            required
          />
          <TextField
            label="New Password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            fullWidth
            margin="normal"
            required
          />
          <TextField
            label="Confirm Password"
            name="confirm"
            type="password"
            value={form.confirm}
            onChange={handleChange}
            fullWidth
            margin="normal"
            required
          />
          <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 2 }}>
            Reset Password
          </Button>
        </form>
        <Box mt={2} display="flex" justifyContent="center">
          <Button component={Link} to="/login" size="small">Back to Login</Button>
        </Box>
      </Paper>
    </Box>
  );
} 