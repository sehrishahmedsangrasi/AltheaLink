const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const bcrypt = require('bcryptjs');


dotenv.config();
require('../config/db')();


const seed = async () => {
try {
await User.deleteMany({ role: 'admin' });
const hashed = await bcrypt.hash('Admin@123', 10);
const admin = await User.create({ name: 'Super Admin', email: 'admin@teck.com', password: hashed, role: 'admin' });
console.log('Admin seeded:', admin.email);
process.exit();
} catch (err) {
console.error(err);
process.exit(1);
}
};
seed();