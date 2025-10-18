const asyncHandler2 = require('express-async-handler');
const User = require('../models/User');
const { generateAccessToken, generateRefreshToken } = require('../utils/generateToken');
const Appointment = require('../models/Appointment');
const Availability = require('../models/Availability');
const jwt = require("jsonwebtoken");
const crypto = require("crypto");


// @access Private/Doctor
const getAppointments = asyncHandler2(async (req, res) => {
  const doctorId = req.user._id;

  // Mark past appointments as missed
  await markPastAppointmentsAsMissed(doctorId);

  const { date, status } = req.query;
  const filter = { doctor: doctorId };
  if (date) filter.date = date;
  if (status) filter.status = status;

  const appointments = await Appointment.find(filter).sort({ date: 1, slot: 1 });
  res.json(appointments);
});



// @desc Doctor sets availability (create or update availability for a date)
// @route POST /api/doctor/availability
// @access Private/Doctor
const setAvailability = asyncHandler2(async (req, res) => {
const doctorId = req.user._id;
const { date, ranges } = req.body; // ranges: [{start,end},...]
if (!ranges || !Array.isArray(ranges) || ranges.length === 0) {
res.status(400);
throw new Error('Ranges are required');
}

const avail = await Availability.findOneAndUpdate(
{ doctor: doctorId, date: date || '' },
{ doctor: doctorId, date: date || '', ranges },
{ upsert: true, new: true }
);
res.json(avail);
});


// @desc Doctor marks appointment status (done/missed)
// @route PATCH /api/doctor/appointments/:id/status
// @access Private/Doctor
const updateAppointmentStatus = asyncHandler2(async (req, res) => {
const doctorId = req.user._id;
const { id } = req.params;
const { status } = req.body;
const app = await Appointment.findById(id);
if (!app) { res.status(404); throw new Error('Appointment not found'); }
if (String(app.doctor) !== String(doctorId)) { res.status(403); throw new Error('Not authorized'); }
app.status = status;
await app.save();
res.json(app);
});

// @desc Doctor login
// @route POST /api/doctor/login
// @access Public
const doctorLogin = asyncHandler2(async (req, res) => {
  const { email, password } = req.body;

  const doctor = await User.findOne({ email });

  if (
    doctor &&
    doctor.role === "doctor" &&
    (await doctor.matchPassword(password))
  ) {
    if (!doctor.isActive) {
      res.status(403);
      throw new Error("Your account has been disabled. Please contact admin.");
    }

   //  Generate access & refresh tokens
  const accessToken = generateAccessToken(doctor._id);
  const refreshToken = generateRefreshToken(doctor._id);

  //  Hash refresh token before saving (for security)
  const hashedToken = crypto.createHash("sha256").update(refreshToken).digest("hex");
  doctor.refreshToken = hashedToken;
  await doctor.save();

  //  Send refresh token in httpOnly cookie
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/", 
  });


    res.json({
      token: accessToken,
      
    });
  } else {
    res.status(401);
    throw new Error("Invalid email or password");
  }
});
// @desc Get doctor stats
// @route GET /api/doctor/stats
// @access Private/Doctor
const getDoctorStats = asyncHandler2(async (req, res) => {
  const doctorId = req.user._id;

  // Mark past appointments as missed
  await markPastAppointmentsAsMissed(doctorId);

  const today = new Date().toISOString().split("T")[0];

  const totalAppointments = await Appointment.countDocuments({ doctor: doctorId });
  const todayAppointments = await Appointment.countDocuments({ doctor: doctorId, date: today });
  const completedAppointments = await Appointment.countDocuments({ doctor: doctorId, status: "done" });
  const missedAppointments = await Appointment.countDocuments({ doctor: doctorId, status: "missed" });

  const nextAppointment = await Appointment.findOne({
    doctor: doctorId,
    date: { $gte: today },
    status: "booked"
  }).sort({ date: 1, slot: 1 });

  res.json({
    totalAppointments,
    todayAppointments,
    completedAppointments,
    missedAppointments,
    nextAppointment
  });
});

const getDailySchedule = asyncHandler2(async (req, res) => {
  const doctorId = req.user._id;
  const { date } = req.query;
  if (!date) {
    res.status(400);
    throw new Error("Date is required (YYYY-MM-DD)");
  }

  // 48 slots: every 30 min from 00:00 to 23:30
  const slots = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
      const hour = h.toString().padStart(2, "0");
      const minute = m.toString().padStart(2, "0");
      slots.push(`${hour}:${minute}`);
    }
  }

  // doctor availability
  const availability = await Availability.findOne({ doctor: doctorId, date });
  const availableSlots = [];
  if (availability) {
    for (const range of availability.ranges) {
      const [startHour, startMinute] = range.start.split(":").map(Number);
      const [endHour, endMinute] = range.end.split(":").map(Number);
      for (const slot of slots) {
        const [sh, sm] = slot.split(":").map(Number);
        const inRange =
          sh * 60 + sm >= startHour * 60 + startMinute &&
          sh * 60 + sm < endHour * 60 + endMinute;
        if (inRange) availableSlots.push(slot);
      }
    }
  }

  // appointments for that day
  const appointments = await Appointment.find({ doctor: doctorId, date });

  const finalSlots = slots.map(slot => {
    const appt = appointments.find(a => a.slot === slot);
    return {
      time: slot,
      status: appt ? "booked" : availableSlots.includes(slot) ? "available" : "unavailable",
      appointment: appt || null
    };
  });

  res.json(finalSlots);
});

// @desc Get doctor profile
// @route GET /api/doctor/profile
// @access Private/Doctor
const getDoctorProfile = asyncHandler2(async (req, res) => {
  const doctor = await User.findById(req.user._id).select("-password"); 
  if (!doctor || doctor.role !== "doctor") {
    res.status(404);
    throw new Error("Doctor not found");
  }
  res.json({
    _id: doctor._id,
    name: doctor.name,
    email: doctor.email,
    specialization: doctor.specialization,
    role: doctor.role,
    isActive: doctor.isActive,
    picture: doctor.picture || null, 
  });
});


const markPastAppointmentsAsMissed = async (doctorId) => {
  const today = new Date().toISOString().split("T")[0];
  await Appointment.updateMany(
    { doctor: doctorId, status: "booked", date: { $lt: today } },
    { status: "missed" }
  );
};

// @desc Update doctor profile picture
// @route PATCH /api/doctor/profile/picture
// @access Private/Doctor
const updateDoctorPicture = asyncHandler2(async (req, res) => {
  const doctorId = req.user._id;
  const { picture } = req.body; 
  if (!picture) {
    res.status(400);
    throw new Error("Picture URL is required");
  }

  const doctor = await User.findById(doctorId);
  if (!doctor || doctor.role !== "doctor") {
    res.status(404);
    throw new Error("Doctor not found");
  }

  doctor.picture = picture; 
  await doctor.save();

  res.json({
    message: "Profile picture updated successfully",
    picture: doctor.picture,
  });
});

// @desc Change doctor password
// @route PATCH /api/doctor/profile/password
// @access Private/Doctor
const changeDoctorPassword = asyncHandler2(async (req, res) => {
  const doctorId = req.user._id;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    res.status(400);
    throw new Error("Both current and new password are required");
  }

  const doctor = await User.findById(doctorId);
  if (!doctor || doctor.role !== "doctor") {
    res.status(404);
    throw new Error("Doctor not found");
  }

  //  Check current password
  const isMatch = await doctor.matchPassword(currentPassword);
  if (!isMatch) {
    res.status(401);
    throw new Error("Current password is incorrect");
  }

  // Update password (pre-save hook will hash it)
  doctor.password = newPassword;
  await doctor.save();

  res.json({ message: "Password updated successfully" });
});

// @desc Refresh doctor access token
// @route POST /api/doctor/refresh
// @access Public
const refreshDoctorToken = asyncHandler2(async (req, res) => {
  const tokenFromCookie = req.cookies.refreshToken;
  if (!tokenFromCookie) {
    return res.status(401).json({ message: "No refresh token" });
  }

  try {
    const decoded = jwt.verify(tokenFromCookie, process.env.JWT_REFRESH_SECRET);

    const hashedToken = crypto.createHash("sha256").update(tokenFromCookie).digest("hex");
    const doctor = await User.findOne({ _id: decoded.id, refreshToken: hashedToken });

    if (!doctor || doctor.role !== "doctor") {
      return res.status(403).json({ message: "Invalid or expired refresh token" });
    }

    //  Rotate tokens (issue new ones)
    const newAccessToken = generateAccessToken(doctor._id);
    const newRefreshToken = generateRefreshToken(doctor._id);
    const newHashed = crypto.createHash("sha256").update(newRefreshToken).digest("hex");

    doctor.refreshToken = newHashed;
    await doctor.save();

    // Set new refresh cookie
    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    });

    res.json({ accessToken: newAccessToken });
  } catch (err) {
    console.log("❌ Refresh failed:", err.message);
    if (err.name === "TokenExpiredError") {
      const hashed = crypto.createHash("sha256").update(tokenFromCookie).digest("hex");
      await User.updateOne({ refreshToken: hashed }, { $unset: { refreshToken: "" } });
    }
    res.status(403).json({ message: "Invalid or expired refresh token" });
  }
});

// @desc Remove doctor profile picture
// @route DELETE /api/doctor/profile/picture
// @access Private/Doctor
const removeDoctorPicture = asyncHandler2(async (req, res) => {
  const doctorId = req.user._id;

  const doctor = await User.findById(doctorId);
  if (!doctor || doctor.role !== "doctor") {
    res.status(404);
    throw new Error("Doctor not found");
  }

  // If no picture exists
  if (!doctor.picture) {
    res.status(400);
    throw new Error("No profile picture to remove");
  }

  // Set picture to null
  doctor.picture = null;
  await doctor.save();

  res.json({
    message: "Profile picture removed successfully",
  });
});



module.exports = { 
  doctorLogin,
  getAppointments,
  setAvailability, 
  updateAppointmentStatus, 
  getDoctorStats, 
  getDailySchedule, 
  getDoctorProfile, 
  markPastAppointmentsAsMissed, 
  updateDoctorPicture ,
  changeDoctorPassword, 
  refreshDoctorToken, 
  removeDoctorPicture};