const mongoose = require('mongoose');

const chatSessionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  sessionId: { type: String, required: true, unique: true },
  messages: [{
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
  }],
  // Lead capture from chat
  leadData: {
    name: String,
    email: String,
    phone: String,
    intent: { type: String, enum: ['quote', 'booking', 'tracking', 'general'] }
  },
  resolved: { type: Boolean, default: false },
  convertedToBooking: { type: Boolean, default: false },
  bookingRef: String
}, { timestamps: true });

module.exports = mongoose.model('ChatSession', chatSessionSchema);
