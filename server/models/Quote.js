const mongoose = require('mongoose');

const quoteSchema = new mongoose.Schema({
  user:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name:  { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true },
  phone: { type: String, default: '' },
  origin: {
    zip:   { type: String, default: '' },
    city:  { type: String, default: '' },
    state: { type: String, default: '' }
  },
  destination: {
    zip:   { type: String, default: '' },
    city:  { type: String, default: '' },
    state: { type: String, default: '' }
  },
  pricingMode: { type: String, enum: ['item_based', 'bedroom_estimate'], default: 'item_based' },
  homeSize:    { type: String, default: '' },
  items: [{
    id:    { type: String },
    qty:   { type: Number, default: 1 },
    label: { type: String, default: '' }
  }],
  services: [String],
  moveDate:  { type: Date, required: true },
  pricing: {
    pricingMode:        String,
    isLocal:            Boolean,
    moveType:           String,
    estimatedMiles:     Number,
    truckSize:          String,
    crewSize:           Number,
    totalWeight:        Number,
    totalVolume:        Number,
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
  status:    { type: String, enum: ['pending','sent','accepted','rejected','expired'], default: 'pending' },
  notes:     { type: String, default: '' },
  expiresAt: { type: Date, default: () => new Date(Date.now() + 7*24*60*60*1000) }
}, { timestamps: true });

module.exports = mongoose.model('Quote', quoteSchema);
