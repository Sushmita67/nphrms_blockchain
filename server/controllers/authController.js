const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { sendEmail } = require('../utils/email');
const otpStorage = require('../utils/otpStorage');
const SECRET_KEY = process.env.SECRET_KEY;
const CLIENT_URL = process.env.CLIENT_URL;

// Registration
exports.register = async (req, res) => {
  try {
    const { username, email, password,  role = 'patient', photo } = req.body;
    if ( !username || !email || !password ) {
      return res.status(400).json({ message: 'All required fields must be filled' });
    }
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ message: 'Email or username already registered' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, email, password: hashedPassword, role, status: 'verified', photo });
    await user.save();
    // // Email verification
    // const verificationToken = jwt.sign({ userId: user._id }, SECRET_KEY, { expiresIn: '1d' });
    // const verifyUrl = `${CLIENT_URL}/verify-email?token=${verificationToken}`;
    // await sendEmail({
    //   from: process.env.EMAIL_USER,
    //   to: user.email,
    //   subject: 'Registration Successful. Welcome!',
    //   html: `<p>Welcome, ${user.email}! Please verify your email: <a href="${verifyUrl}">${verifyUrl}</a></p>`
    // });
    res.status(201).json({ message: 'Registration successful.' });
  } catch (error) {
    res.status(500).json({ message: 'Registration failed', error });
  }
};

// Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(403).json({ message: 'Invalid email or password' });
    }
    if (user.status !== 'verified') {
      return res.status(403).json({ message: 'Email not verified' });
    }
    const token = jwt.sign({ id: user._id, email: user.email, role: user.role, photo: user.photo }, SECRET_KEY, { expiresIn: '6h' });
    res.status(200).json({
      token,
      user_id: user._id,
      username: user.username, // Add username to response
      photo: user.photo,
      email: user.email,
      role: user.role,
      message: 'Login successful',
    });
  } catch (error) {
    res.status(500).json({ message: 'Login failed', error });
  }
};

// Password Reset Request
exports.resetPasswordRequest = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });
    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStorage.set(email, { otp, expiry: Date.now() + 10 * 60 * 1000 });
    await sendEmail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reset OTP',
      html: `<p>Your OTP for password reset is: <b>${otp}</b></p>`
    });
    res.status(200).json({ message: 'OTP sent to email' });
  } catch (error) {
    res.status(500).json({ message: 'Error sending OTP', error });
  }
};

// Reset Password
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    const storedOTP = otpStorage.get(email);
    if (!storedOTP || storedOTP.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }
    if (Date.now() > storedOTP.expiry) {
      return res.status(400).json({ message: 'OTP expired. Please request a new one.' });
    }
    otpStorage.delete(email);
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const user = await User.findOne({ email });
    user.password = hashedPassword;
    await user.save();
    res.status(200).json({ message: 'Password reset successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error resetting password', error });
  }
};

// Validate Session
exports.validateSession = async (req, res) => {
  try {
    const token = req.header('Authorization')?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token provided' });
    const verified = jwt.verify(token, SECRET_KEY);
    if (!verified) return res.status(401).json({ message: 'Invalid or expired token' });
    res.status(200).json({ message: 'Token is valid', user: verified });
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired token', error });
  }
};

// Get Current User
exports.getCurrentUser = async (req, res) => {
  try {
    const token = req.header('Authorization')?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token provided' });
    const verified = jwt.verify(token, SECRET_KEY);
    if (!verified) return res.status(401).json({ message: 'Invalid or expired token' });
    const user = await User.findById(verified.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.status(200).json({ message: 'User profile retrieved', body: user });
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired token', error });
  }
};

// Email Verification
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: 'Verification token missing' });
    let payload;
    try {
      payload = jwt.verify(token, SECRET_KEY);
    } catch (err) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }
    const user = await User.findById(payload.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.status === 'verified') {
      return res.status(200).json({ message: 'Email already verified' });
    }
    user.status = 'verified';
    await user.save();
    res.status(200).json({ message: 'Email verified successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Verification failed', error });
  }
};

// Resend Verification Email
exports.resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.status === 'verified') {
      return res.status(400).json({ message: 'User is already verified' });
    }
    const verificationToken = jwt.sign({ userId: user._id }, SECRET_KEY, { expiresIn: '1d' });
    const verifyUrl = `${CLIENT_URL}/verify-email?token=${verificationToken}`;
    await sendEmail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: 'Resend Verification Email',
      html: `<p>Hi ${user.firstName} ${user.lastName}, please verify your email: <a href="${verifyUrl}">${verifyUrl}</a></p>`
    });
    res.status(200).json({ message: 'Verification email sent' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to send verification email', error });
  }
}; 