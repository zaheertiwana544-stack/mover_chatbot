const express = require('express');
const { body }  = require('express-validator');
const router    = express.Router();
const { register, login, logout, getMe, updateMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
], register);

router.post('/login', login);
router.post('/logout', logout);     // clears httpOnly cookie
router.get('/me', protect, getMe);
router.patch('/me', protect, updateMe);

module.exports = router;
