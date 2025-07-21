import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Alert from '@mui/material/Alert';
import { useAuth } from '../App';
import API from '../utils/api';

export default function Login() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await API.post('/auth/login', {
        email: form.username,
        password: form.password,
      });
      if (res.data && res.data.token) {
        login({
          ...res.data,
          token: res.data.token,
          _id: res.data.user_id, // ensure _id is always present
          username: res.data.username, // ensure username is always present
        });
        navigate(`/${res.data.role}-dashboard`);
      } else {
        setError('Login failed. Please try again.');
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 'Invalid username/email or password'
      );
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
      <Paper elevation={6} sx={{ p: 4, minWidth: 340, maxWidth: 400 }}>
        <Typography variant="h5" fontWeight="bold" mb={2} align="center">Login</Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <form onSubmit={handleSubmit}>
          <TextField
            label="Email"
            name="username"
            value={form.username}
            onChange={handleChange}
            fullWidth
            margin="normal"
            autoFocus
            required
          />
          <TextField
            label="Password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            fullWidth
            margin="normal"
            required
          />
          <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 2 }}>
            Login
          </Button>
        </form>
        <Box mt={2} display="flex" justifyContent="space-between">
          <Button component={Link} to="/register" size="small">Register</Button>
          <Button component={Link} to="/forgot" size="small">Forgot Password?</Button>
        </Box>
      </Paper>
    </Box>
  );
} 