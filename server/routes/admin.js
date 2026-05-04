const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/auth');
const {
  getDashboardStats, getAllBookings, getAllQuotes,
  getAllUsers, updateBooking, getChatLeads
} = require('../controllers/adminController');

router.use(protect, restrictTo('admin'));

router.get('/stats', getDashboardStats);
router.get('/bookings', getAllBookings);
router.patch('/bookings/:id', updateBooking);
router.get('/quotes', getAllQuotes);
router.get('/users', getAllUsers);
router.get('/leads', getChatLeads);

module.exports = router;
