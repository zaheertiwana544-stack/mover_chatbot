const { nanoid } = require('nanoid');
const Booking = require('../models/Booking');
const Quote   = require('../models/Quote');
const { getDistanceMiles } = require('../config/pricing');

const generateRef = () => `MV-${nanoid(8).toUpperCase()}`;

exports.createBooking = async (req, res) => {
  try {
    const {
      customer, origin, destination, moveDate,
      quoteId, items, services, notes
    } = req.body;

    if (!customer?.name || !customer?.email) {
      return res.status(400).json({ error: 'Customer name and email are required' });
    }
    if (!moveDate) return res.status(400).json({ error: 'Move date is required' });

    // Enrich origin/destination city+state from geocoding if only zip given
    let enrichedOrigin      = { ...origin };
    let enrichedDestination = { ...destination };

    if ((origin?.zip || origin?.city) && (destination?.zip || destination?.city)) {
      try {
        const { originInfo, destInfo } = await getDistanceMiles(origin, destination);
        if (originInfo?.city && !enrichedOrigin.city)           enrichedOrigin.city  = originInfo.city;
        if (originInfo?.state && !enrichedOrigin.state)         enrichedOrigin.state = originInfo.state;
        if (destInfo?.city && !enrichedDestination.city)        enrichedDestination.city  = destInfo.city;
        if (destInfo?.state && !enrichedDestination.state)      enrichedDestination.state = destInfo.state;
      } catch (_) { /* geocoding optional — don't block booking */ }
    }

    let pricing = req.body.pricing || null;

    // Pull pricing from quote if quoteId provided
    if (quoteId) {
      const quote = await Quote.findById(quoteId);
      if (quote) {
        pricing = quote.pricing;
        await Quote.findByIdAndUpdate(quoteId, { status: 'accepted' });
      }
    }

    const booking = await Booking.create({
      referenceNumber: generateRef(),
      user:        req.user?._id || null,
      quote:       quoteId || null,
      customer:    { name: customer.name, email: customer.email, phone: customer.phone || '' },
      origin:      enrichedOrigin,
      destination: enrichedDestination,
      moveDate,
      items:    items    || [],
      services: services || [],
      pricing:  pricing  || {},
      notes:    notes    || '',
      trackingHistory: [{
        status:    'pending_approval',
        message:   'Booking request received. Awaiting admin confirmation.',
        timestamp: new Date()
      }]
    });

    res.status(201).json({ booking });
  } catch (err) {
    console.error('Booking create error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

exports.getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id }).sort('-createdAt');
    res.json({ bookings });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getBookingByRef = async (req, res) => {
  try {
    const booking = await Booking.findOne({ referenceNumber: req.params.ref.toUpperCase() });
    if (!booking) return res.status(404).json({ error: 'No booking found with that reference number.' });

    // Ownership check
    const isOwner    = booking.user && booking.user.toString() === req.user._id.toString();
    const isAdmin    = req.user.role === 'admin';
    const emailMatch = booking.customer?.email?.toLowerCase() === req.user.email?.toLowerCase();

    if (!isOwner && !isAdmin && !emailMatch) {
      return res.status(403).json({ error: 'You do not have permission to view this booking.' });
    }

    res.json({ booking });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.updateBookingStatus = async (req, res) => {
  try {
    const { status, message, location } = req.body;
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status, $push: { trackingHistory: { status, message, location, timestamp: new Date() } } },
      { new: true }
    );
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    res.json({ booking });
  } catch (err) { res.status(500).json({ error: err.message }); }
};
