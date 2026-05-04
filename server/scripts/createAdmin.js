/**
 * Run once to create your admin account:
 *   cd server
 *   node scripts/createAdmin.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User     = require('../models/User');

const ADMIN = {
  name:     'Admin',
  email:    'admin@moveeasy.com',
  password: 'Admin@123456',
  role:     'admin'
};

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');
  const existing = await User.findOne({ email: ADMIN.email });
  if (existing) {
    await User.findByIdAndUpdate(existing._id, { role: 'admin' });
    console.log(`Upgraded "${ADMIN.email}" to admin role`);
  } else {
    await User.create(ADMIN);
    console.log(`Admin created: ${ADMIN.email} / ${ADMIN.password}`);
  }
  await mongoose.disconnect();
  process.exit(0);
}

run().catch(err => { console.error('Error:', err.message); process.exit(1); });
