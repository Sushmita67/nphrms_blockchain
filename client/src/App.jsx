import React, { useEffect, useState, createContext, useContext } from 'react';
import { Routes, Route, NavLink, useNavigate, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import Doctors from './pages/Doctors';
import Hospitals from './pages/Hospitals';
import Consent from './pages/Consent';
import Ledger from './pages/Ledger';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import useMediaQuery from '@mui/material/useMediaQuery';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import { useTheme } from '@mui/material/styles';

const navItems = [
  { name: 'Dashboard', path: '/' },
  { name: 'Patients', path: '/patients' },
  { name: 'Doctors', path: '/doctors' },
  { name: 'Hospitals', path: '/hospitals' },
  { name: 'Consent', path: '/consent' },
  { name: 'Ledger', path: '/ledger' },
];

const AuthContext = createContext();
export function useAuth() { return useContext(AuthContext); }

function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const u = localStorage.getItem('user');
    return u ? JSON.parse(u) : null;
  });

  // Listen for login/logout/register in other tabs or programmatically
  useEffect(() => {
    const syncUser = () => {
      const u = localStorage.getItem('user');
      setUser(u ? JSON.parse(u) : null);
    };
    window.addEventListener('storage', syncUser);
    return () => window.removeEventListener('storage', syncUser);
  }, []);

  // Update localStorage when user changes
  useEffect(() => {
    if (user) localStorage.setItem('user', JSON.stringify(user));
    else localStorage.removeItem('user');
  }, [user]);

  const login = (userObj) => {
    setUser(userObj);
    localStorage.setItem('user', JSON.stringify(userObj));
  };
  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };
  return <AuthContext.Provider value={{ user, setUser, login, logout }}>{children}</AuthContext.Provider>;
}

function PrivateRoute({ children, role }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to={`/${user.role}-dashboard`} replace />;
  return children;
}

export { AuthProvider };

export default function App() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Role-based nav items
  let navItems = [];
  if (user) {
    if (user.role === 'admin') {
      navItems = [
        { name: 'Dashboard', path: '/admin-dashboard' },
        { name: 'Hospitals', path: '/hospitals' },
        { name: 'Ledger', path: '/ledger' },
      ];
    } else if (user.role === 'doctor') {
      navItems = [
        { name: 'Dashboard', path: '/doctor-dashboard' },
        { name: 'Patients', path: '/patients' },
      ];
    } else if (user.role === 'patient') {
      navItems = [
        { name: 'Dashboard', path: '/patient-dashboard' },
        { name: 'My Record', path: '/patients' },
        { name: 'Consent', path: '/consent' },
      ];
    }
  }

  const drawer = (
    <Box onClick={() => setDrawerOpen(false)} sx={{ width: 220 }}>
      <List>
        {navItems.map((item) => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton component={NavLink} to={item.path} selected={window.location.pathname === item.path}>
              <ListItemText primary={item.name} />
            </ListItemButton>
          </ListItem>
        ))}
        <ListItem disablePadding>
          <ListItemButton onClick={() => { logout(); navigate('/login'); }}>
            <ListItemText primary="Logout" />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', width: '100vw', height: '100vh', overflow: 'auto' }}>
      {user && (
        <AppBar position="static" color="primary">
          <Toolbar>
            {isMobile && (
              <IconButton edge="start" color="inherit" aria-label="menu" onClick={() => setDrawerOpen(true)}>
                <MenuIcon />
              </IconButton>
            )}
            <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
              Nepal HealthChain Prototype
            </Typography>
            {!isMobile && navItems.map((item) => (
              <Button
                key={item.path}
                color="inherit"
                component={NavLink}
                to={item.path}
                sx={{ ml: 1 }}
                style={({ isActive }) => ({
                  textDecoration: isActive ? 'underline' : 'none',
                  fontWeight: isActive ? 'bold' : 'normal',
                })}
              >
                {item.name}
              </Button>
            ))}
            <Button color="inherit" sx={{ ml: 2 }} onClick={() => { logout(); navigate('/login'); }}>Logout</Button>
          </Toolbar>
        </AppBar>
      )}
      <Drawer anchor="left" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        {drawer}
      </Drawer>
      <Box sx={{ width: '100%', height: user ? 'calc(100vh - 64px)' : '100vh', p: { xs: 1, sm: 2, md: 3 }, boxSizing: 'border-box', overflow: 'auto' }}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot" element={<ForgotPassword />} />
          <Route path="/reset" element={<ResetPassword />} />
          <Route path="/admin-dashboard" element={<PrivateRoute role="admin"><Dashboard /></PrivateRoute>} />
          <Route path="/doctor-dashboard" element={<PrivateRoute role="doctor"><Dashboard /></PrivateRoute>} />
          <Route path="/patient-dashboard" element={<PrivateRoute role="patient"><Dashboard /></PrivateRoute>} />
          <Route path="/" element={<PrivateRoute><Navigate to={`/${user?.role}-dashboard`} replace /></PrivateRoute>} />
          <Route path="/patients" element={<PrivateRoute><Patients /></PrivateRoute>} />
          <Route path="/doctors" element={<PrivateRoute><Doctors /></PrivateRoute>} />
          <Route path="/hospitals" element={<PrivateRoute><Hospitals /></PrivateRoute>} />
          <Route path="/consent" element={<PrivateRoute><Consent /></PrivateRoute>} />
          <Route path="/ledger" element={<PrivateRoute><Ledger /></PrivateRoute>} />
          <Route path="*" element={<Navigate to={user ? `/${user.role}-dashboard` : '/login'} replace />} />
        </Routes>
      </Box>
    </Box>
  );
} 