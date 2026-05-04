const jwt  = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');

const COOKIE_OPTIONS = {
  httpOnly:  true,               // JS cannot read this cookie — XSS protection
  secure:    process.env.NODE_ENV === 'production', // HTTPS only in prod
  sameSite:  'strict',           // CSRF protection
  maxAge:    7 * 24 * 60 * 60 * 1000, // 7 days
  path:      '/',
};

function signToken(id) {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
}

function sendToken(user, statusCode, res) {
  const token = signToken(user._id);
  user.password = undefined;

  // Set httpOnly cookie — NOT accessible from JavaScript
  res.cookie('me_token', token, COOKIE_OPTIONS);

  // Also return user object (but NOT the token — client never needs to store it)
  res.status(statusCode).json({ user });
}

exports.register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, email, password, phone } = req.body;
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(400).json({ error: 'An account with this email already exists.' });

    const user = await User.create({ name, email, password, phone });
    sendToken(user, 201, res);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }
    if (!user.isActive) return res.status(401).json({ error: 'This account has been deactivated.' });

    sendToken(user, 200, res);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.logout = (req, res) => {
  // Clear the cookie — this is the only way to log out when using httpOnly cookies
  res.clearCookie('me_token', { ...COOKIE_OPTIONS, maxAge: 0 });
  res.json({ message: 'Logged out successfully.' });
};

exports.getMe = async (req, res) => {
  // Re-fetch from DB every time — ensures fresh data, handles deactivated accounts
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      res.clearCookie('me_token');
      return res.status(401).json({ error: 'User not found.' });
    }
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateMe = async (req, res) => {
  try {
    const { name, phone } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, phone },
      { new: true, runValidators: true }
    ).select('-password');
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
