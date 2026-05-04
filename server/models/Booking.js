const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  referenceNumber: { type: String, unique: true, required: true },
  user:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  quote: { type: mongoose.Schema.Types.ObjectId, ref: 'Quote' },
  customer: {
    name:  { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, default: '' }
  },
  origin:      { address: String, city: String, state: String, zip: String },
  destination: { address: String, city: String, state: String, zip: String },
  homeSize:    { type: String, default: 'other' },
  moveDate:    { type: Date, required: true },
  items:    [{ id: String, qty: Number, label: String }],
  services: [String],
  pricing: {
    pricingMode:        String,
    moveType:           String,
    estimatedMiles:     Number,
    isLocal:            Boolean,
    truckSize:          String,
    crewSize:           Number,
    totalWeight:        Number,
    hourlyRate:         Number,
    minHours:           Number,
    estHours:           Number,
    baseRate:           { type: Number, default: 0 },
    fuelSurcharge:      { type: Number, default: 0 },
    labor:              { type: Number, default: 0 },
    insurance:          { type: Number, default: 0 },
    specialtySurcharge: { type: Number, default: 0 },
    packingSurcharge:   { type: Number, default: 0 },
    addons:             { type: Number, default: 0 },
    total:              { type: Number, default: 0 }
  },
  status: {
    type: String,
    enum: ['pending_approval','confirmed','crew_assigned','packing','loading','in_transit','delivered','cancelled'],
    default: 'pending_approval'   // all new bookings start here — admin must approve
  },
  trackingHistory: [{
    status:    String,
    message:   String,
    location:  String,
    timestamp: { type: Date, default: Date.now }
  }],
  crew: { leadName: String, phone: String, truckNumber: String },
  notes:         String,
  adminNotes:    String,
  contactMethod: { type: String, enum: ['call','email','whatsapp','none'], default: 'none' },
  paymentStatus: { type: String, enum: ['pending','deposit_paid','fully_paid'], default: 'pending' }
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);
