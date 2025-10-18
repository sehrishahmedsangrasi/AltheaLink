const mongoose = require('mongoose');


const appointmentSchema = new mongoose.Schema({
patientName: { type: String, required: true },
patientEmail: { type: String },
patientPhone: { type: String },
doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
date: { type: String, required: true }, // YYYY-MM-DD
slot: { type: String, required: true }, // e.g. "10:00", or slot index like "10:00-10:30"
status: { type: String, enum: ['booked','done','missed','cancelled'], default: 'booked' },
symptoms: { type: String },
createdAt: { type: Date, default: Date.now }
});


// prevent double booking: one doctor + date + slot unique
appointmentSchema.index({ doctor: 1, date: 1, slot: 1 }, { unique: true });


module.exports = mongoose.model('Appointment', appointmentSchema);