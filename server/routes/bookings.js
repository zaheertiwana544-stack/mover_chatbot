const express  = require('express');
const router   = express.Router();
const { createBooking, getMyBookings, getBookingByRef } = require('../controllers/bookingController');
const { protect } = require('../middleware/auth');

router.post('/',        protect, createBooking);   // must be logged in
router.get('/my',       protect, getMyBookings);
router.get('/ref/:ref', protect, getBookingByRef); // must be logged in + ownership checked in controller

module.exports = router;
