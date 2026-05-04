const express      = require('express');
const cors         = require('cors');
const helmet       = require('helmet');
const morgan       = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit    = require('express-rate-limit');
require('dotenv').config();

const connectDB = require('./config/db');

const authRoutes     = require('./routes/auth');
const quoteRoutes    = require('./routes/quotes');
const bookingRoutes  = require('./routes/bookings');
const trackingRoutes = require('./routes/tracking');
const chatRoutes     = require('./routes/chat');
const adminRoutes    = require('./routes/admin');

const app = express();
connectDB();

// Security
app.use(helmet());
app.use(cors({
  origin:      process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,   // required for cookies to be sent cross-origin
}));

// Cookie parser — must come before routes
app.use(cookieParser());

// Rate limiting
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200,
  message: { error: 'Too many requests. Please try again later.' } });
const chatLimiter = rateLimit({ windowMs: 60 * 1000, max: 20,
  message: { error: 'Chat rate limit exceeded.' } });

app.use('/api/', limiter);
app.use('/api/chat', chatLimiter);

// Body parsing
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// Routes
app.use('/api/auth',     authRoutes);
app.use('/api/quotes',   quoteRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/tracking', trackingRoutes);
app.use('/api/chat',     chatRoutes);
app.use('/api/admin',    adminRoutes);

// 404
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚛 MoveEasy server on port ${PORT} [${process.env.NODE_ENV}]`));
