const jwt  = require('jsonwebtoken');
const User = require('../models/User');

/**
 * protect — reads JWT from httpOnly cookie (primary) or Authorization header (fallback)
 * This means localStorage is never used for tokens.
 * Each browser tab reads from the server independently — no cross-tab state merging.
 */
exports.protect = async (req, res, next) => {
  try {
    let token;

    // 1. Prefer httpOnly cookie — most secure, JS can't access it
    if (req.cookies?.me_token) {
      token = req.cookies.me_token;
    }
    // 2. Fallback: Authorization header (for API clients / mobile)
    else if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ error: 'Not authenticated. Please log in.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user    = await User.findById(decoded.id).select('-password');

    if (!user)            return res.status(401).json({ error: 'User no longer exists.' });
    if (!user.isActive)   return res.status(401).json({ error: 'Account is deactivated.' });

    req.user = user;
    next();
  } catch (err) {
    // Clear bad cookie
    res.clearCookie('me_token');
    return res.status(401).json({ error: 'Session expired. Please log in again.' });
  }
};

/**
 * optionalAuth — attaches user if logged in, continues without error if not
 */
exports.optionalAuth = async (req, res, next) => {
  try {
    let token;
    if (req.cookies?.me_token) token = req.cookies.me_token;
    else if (req.headers.authorization?.startsWith('Bearer ')) token = req.headers.authorization.split(' ')[1];
    if (!token) return next();
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user    = await User.findById(decoded.id).select('-password');
    if (user && user.isActive) req.user = user;
  } catch (_) { res.clearCookie('me_token'); }
  next();
};

exports.restrictTo = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) {
    return res.status(403).json({ error: 'You do not have permission to do this.' });
  }
  next();
};
