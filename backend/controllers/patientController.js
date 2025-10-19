const asyncHandler3 = require('express-async-handler');
const User= require('../models/User');
const Appointment2 = require('../models/Appointment'); 
const Availability2 = require('../models/Availability'); 
const sendEmail = require("../utils/sendEmail");



// @desc Browse doctors with filters and availability
// @route GET /api/public/doctors
// @access Public
const browseDoctors = asyncHandler3(async (req, res) => {
const { specialization, name } = req.query;
const filter = { role: 'doctor', isActive: true };
if (specialization) filter.specialization = { $regex: specialization, $options: 'i' };
if (name) filter.name = { $regex: name, $options: 'i' };
const doctors = await User.find(filter).select('-password');
res.json(doctors);
});


// helper: generate 30-min slots between start & end
function generateSlots(start, end) {
const toMinutes = s => { const [h,m]=s.split(':').map(Number); return h*60 + m; };
const fromMinutes = m => { const h=Math.floor(m/60); const min=m%60; return `${String(h).padStart(2,'0')}:${String(min).padStart(2,'0')}`; };
const s = toMinutes(start), e = toMinutes(end);
const slots = [];
for (let t = s; t < e; t += 30) slots.push(fromMinutes(t));
return slots;
}


// @desc Get available slots for a doctor on a date
// @route GET /api/public/doctors/:id/slots?date=YYYY-MM-DD
// @access Public
const getAvailableSlots = asyncHandler3(async (req, res) => {
const { id } = req.params; // doctor id
const { date } = req.query;
if (!date) { res.status(400); throw new Error('date is required'); }
const avail = await Availability2.findOne({ doctor: id, date }) || await Availability2.findOne({ doctor: id, date: '' });
if (!avail) return res.json({ slots: [] });
// collect all slots from ranges
let allSlots = [];
for (const r of avail.ranges) allSlots = allSlots.concat(generateSlots(r.start, r.end));
// remove booked
const booked = await Appointment2.find({ doctor: id, date }).select('slot -_id');
const bookedSet = new Set(booked.map(b => b.slot));
const available = allSlots.filter(s => !bookedSet.has(s));
res.json({ slots: available });
});


// @desc Book an appointment (public)
// @route POST /api/public/book
// @access Public
const bookAppointment = asyncHandler3(async (req, res) => {
  const { name, email, phone, doctorId, date, time, symptoms } = req.body;

  if (!name || !doctorId || !date || !time) {
    res.status(400);
    throw new Error("Missing required fields");
  }

  try {
    // Create appointment first
    const appt = await Appointment2.create({
      patientName: name,
      patientEmail: email,
      patientPhone: phone,
      doctor: doctorId,
      date,
      slot: time,
      symptoms,
    });

    await User.findByIdAndUpdate(doctorId, { $inc: { patientCount: 1 } });

    const doctor = await User.findById(doctorId).select("name email");

    // Send response immediately - don't wait for email
    res.status(201).json({ 
      message: "Appointment booked successfully", 
      appt 
    });

    // Send email asynchronously (fire and forget)
    const emailHTML = `
      <div style="font-family:sans-serif;">
        <h2>Appointment Confirmed ✅</h2>
        <p>Hi <b>${name}</b>,</p>
        <p>Your appointment has been successfully booked.</p>
        <p><b>Doctor:</b> ${doctor.name}</p>
        <p><b>Date:</b> ${date}</p>
        <p><b>Time:</b> ${time}</p>
        <p>Thank you for choosing CareConnect. We look forward to seeing you soon!</p>
        <br/>
        <p style="font-size:12px;color:gray;">CareConnect © 2025</p>
      </div>
    `;

    // Send email without blocking response
    sendEmail(email, "Your Appointment is Confirmed!", emailHTML)
      .then(() => {
        console.log(`✅ Confirmation email sent to ${email}`);
      })
      .catch((err) => {
        console.error(`❌ Failed to send email to ${email}:`, err.message);
        // Consider logging to a monitoring service or retry queue
      });

  } catch (err) {
    if (err.code === 11000) {
      res.status(409);
      throw new Error("Selected slot already booked");
    }
    throw err;
  }
});

const getTopDoctors = asyncHandler3(async (req, res) => {
  try {
    // Step 1️⃣: Aggregate to get top 3 doctors by appointment count
    const topDoctors = await Appointment2.aggregate([
      {
        $group: {
          _id: "$doctor", 
          appointmentCount: { $sum: 1 },
        },
      },
      { $sort: { appointmentCount: -1 } },
      { $limit: 3 },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "doctorInfo",
        },
      },
      { $unwind: "$doctorInfo" },
      {
        $project: {
          _id: 0,
          doctorId: "$doctorInfo._id",
          name: "$doctorInfo.name",
          email: "$doctorInfo.email",
          specialization: "$doctorInfo.specialization",
          image: "$doctorInfo.picture", 
          appointmentCount: 1,
        },
      },
    ]);

    // Step 2️⃣: For each top doctor, calculate unique patient count
    for (const doc of topDoctors) {
      const uniquePatientsAgg = await Appointment2.aggregate([
        {
          $match: { doctor: doc.doctorId },
        },
        {
          $project: {
            patientKey: {
              $cond: [
                { $ne: ["$patientEmail", ""] },
                "$patientEmail",
                "$patientName",
              ],
            },
          },
        },
        { $group: { _id: "$patientKey" } },
      ]);

      doc.patientCount = uniquePatientsAgg.length; 
    }

    // Step 3️⃣: Return final data
    res.status(200).json(topDoctors);
  } catch (error) {
    console.error("❌ Error fetching top doctors:", error);
    res.status(500).json({ message: "Server Error" });
  }
});


module.exports = { browseDoctors, getAvailableSlots, bookAppointment, getTopDoctors };