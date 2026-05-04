const express  = require('express');
const router   = express.Router();
const Booking  = require('../models/Booking');
const { protect } = require('../middleware/auth');

/**
 * GET /api/tracking/:ref
 * Protected — user must be logged in.
 * Only returns the booking if it belongs to the logged-in user.
 * Admin can see any booking.
 */
router.get('/:ref', protect, async (req, res) => {
  try {
    const ref     = req.params.ref.toUpperCase();
    const booking = await Booking.findOne({ referenceNumber: ref });

    if (!booking) {
      return res.status(404).json({ error: 'No booking found with that reference number.' });
    }

    // Security check — only the owner or an admin can view
    const isOwner = booking.user && booking.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    // Also allow if email matches (for bookings created via AI chat without account)
    const emailMatch = booking.customer?.email?.toLowerCase() === req.user.email?.toLowerCase();

    if (!isOwner && !isAdmin && !emailMatch) {
      return res.status(403).json({ error: 'You do not have permission to view this booking.' });
    }

    res.json({
      referenceNumber:  booking.referenceNumber,
      status:           booking.status,
      customer:         { name: booking.customer.name },
      origin:           booking.origin,
      destination:      booking.destination,
      moveDate:         booking.moveDate,
      items:            booking.items,
      pricing:          booking.pricing,
      trackingHistory:  booking.trackingHistory,
      crew:             booking.crew,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
