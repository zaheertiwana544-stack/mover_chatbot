const Booking     = require('../models/Booking');
const Quote       = require('../models/Quote');
const User        = require('../models/User');
const ChatSession = require('../models/ChatSession');

exports.getDashboardStats = async (req, res) => {
  try {
    const sixMonthsAgo  = new Date(); sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const thirtyDaysAgo = new Date(Date.now() - 30*24*60*60*1000);
    const sevenDaysAgo  = new Date(Date.now() -  7*24*60*60*1000);

    const [
      totalBookings, activeBookings, totalQuotes, totalUsers,
      revenue, recentBookings, recentQuotes, totalSessions, recentSessions,
      bookingsByMonth, statusBreakdown, topRoutes, quoteConversionData, chatByDay
    ] = await Promise.all([
      Booking.countDocuments(),
      Booking.countDocuments({ status: { $nin: ['delivered','cancelled'] } }),
      Quote.countDocuments(),
      User.countDocuments({ role: 'customer' }),
      Booking.aggregate([{ $match:{ status:{ $ne:'cancelled' } } },{ $group:{ _id:null, total:{ $sum:'$pricing.total' } } }]),
      Booking.countDocuments({ createdAt:{ $gte: thirtyDaysAgo } }),
      Quote.countDocuments({ createdAt:{ $gte: thirtyDaysAgo } }),
      ChatSession.countDocuments(),
      ChatSession.countDocuments({ createdAt:{ $gte: sevenDaysAgo } }),
      Booking.aggregate([
        { $match:{ createdAt:{ $gte: sixMonthsAgo } } },
        { $group:{ _id:{ $month:'$createdAt' }, count:{ $sum:1 }, revenue:{ $sum:'$pricing.total' } } },
        { $sort:{ '_id':1 } }
      ]),
      Booking.aggregate([{ $group:{ _id:'$status', count:{ $sum:1 } } }]),
      Booking.aggregate([
        { $group:{ _id:{ from:'$origin.state', to:'$destination.state' }, count:{ $sum:1 }, avgRevenue:{ $avg:'$pricing.total' } } },
        { $sort:{ count:-1 } }, { $limit:5 }
      ]),
      Quote.aggregate([{ $group:{ _id:'$status', count:{ $sum:1 } } }]),
      ChatSession.aggregate([
        { $match:{ createdAt:{ $gte: sevenDaysAgo } } },
        { $group:{ _id:{ $dateToString:{ format:'%Y-%m-%d', date:'$createdAt' } }, sessions:{ $sum:1 }, messages:{ $sum:{ $size:'$messages' } } } },
        { $sort:{ '_id':1 } }
      ])
    ]);

    const acceptedQuotes = quoteConversionData.find(q => q._id === 'accepted')?.count || 0;
    const conversionRate = totalQuotes > 0 ? Math.round((acceptedQuotes / totalQuotes) * 100) : 0;
    const totalMsgCount  = await ChatSession.aggregate([{ $group:{ _id:null, total:{ $sum:{ $size:'$messages' } } } }]);
    const avgMessagesPerSession = totalSessions > 0 ? Math.round((totalMsgCount[0]?.total || 0) / totalSessions * 10) / 10 : 0;

    res.json({
      stats: { totalBookings, activeBookings, totalQuotes, totalUsers, totalRevenue: revenue[0]?.total || 0,
               recentBookings, recentQuotes, totalSessions, recentSessions, conversionRate, avgMessagesPerSession },
      bookingsByMonth, statusBreakdown, topRoutes, quoteConversionData, chatByDay
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getAllBookings = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { referenceNumber: new RegExp(search, 'i') },
        { 'customer.name': new RegExp(search, 'i') },
        { 'customer.email': new RegExp(search, 'i') }
      ];
    }
    const [bookings, total] = await Promise.all([
      Booking.find(filter).sort('-createdAt').skip((page-1)*limit).limit(Number(limit)),
      Booking.countDocuments(filter)
    ]);
    res.json({ bookings, total, pages: Math.ceil(total / limit) });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getAllQuotes = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const [quotes, total] = await Promise.all([
      Quote.find().sort('-createdAt').skip((page-1)*limit).limit(Number(limit)),
      Quote.countDocuments()
    ]);
    res.json({ quotes, total, pages: Math.ceil(total / limit) });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ role: 'customer' }).sort('-createdAt');
    res.json({ users });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// Admin updates booking status + tracking + crew info
exports.updateBooking = async (req, res) => {
  try {
    const { status, message, location, adminNotes, crew, paymentStatus } = req.body;
    const updateData  = {};
    const pushData    = {};

    if (status) {
      updateData.status = status;
      pushData.trackingHistory = {
        status,
        message:   message || statusDefaultMessage(status),
        location:  location || '',
        timestamp: new Date()
      };
    }
    if (adminNotes    !== undefined) updateData.adminNotes    = adminNotes;
    if (paymentStatus !== undefined) updateData.paymentStatus = paymentStatus;
    if (crew)                        updateData.crew          = crew;

    if (Object.keys(pushData).length) updateData.$push = pushData;

    const booking = await Booking.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    res.json({ booking });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getChatLeads = async (req, res) => {
  try {
    const leads = await ChatSession.find().sort('-createdAt').limit(100);
    res.json({ leads });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

function statusDefaultMessage(status) {
  const msgs = {
    pending_approval: 'Your booking request is under review. We will contact you to confirm.',
    confirmed:     'Your booking has been confirmed.',
    crew_assigned: 'Your moving crew has been assigned and will contact you shortly.',
    packing:       'Our crew has arrived and packing has begun.',
    loading:       'Items are being loaded onto the truck.',
    in_transit:    'Your belongings are on the way to the destination.',
    delivered:     'Your move is complete. All items have been delivered.',
    cancelled:     'This booking has been cancelled.'
  };
  return msgs[status] || `Status updated to ${status}.`;
}
