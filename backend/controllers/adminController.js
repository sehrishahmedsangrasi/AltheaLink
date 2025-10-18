const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const Availability = require("../models/Availability");
const { generateAccessToken, generateRefreshToken } = require('../utils/generateToken');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');


const deleteDoctor = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const doctor = await User.findById(id);

  if (!doctor || doctor.role !== 'doctor') {
    res.status(404);
    throw new Error('Doctor not found');
  }

  await doctor.deleteOne(); 
  res.json({ message: 'Doctor removed' });
});


// @desc Enable / disable doctor
// @route PATCH /api/admin/doctors/:id/status
// @access Private/Admin
const toggleDoctorStatus = asyncHandler(async (req, res) => {
const { id } = req.params;
const { isActive } = req.body; 
const doctor = await User.findById(id);
if (!doctor || doctor.role !== 'doctor') {
res.status(404);
throw new Error('Doctor not found');
}
doctor.isActive = Boolean(isActive);
await doctor.save();
res.json({ _id: doctor._id, isActive: doctor.isActive });
});


// @desc Admin stats
// @route GET /api/admin/stats
// @access Private/Admin
const getStats = asyncHandler(async (req, res) => {
const totalDoctors = await User.countDocuments({ role: 'doctor' });
const popular = await User.aggregate([
{ $match: { role: 'doctor', specialization: { $exists: true, $ne: '' } } },
{ $group: { _id: '$specialization', count: { $sum: 1 } } },
{ $sort: { count: -1 } },
{ $limit: 5 }
]);
const availableDoctors = await User.find({ role: 'doctor', isActive: true }).select('name specialization');
res.json({ totalDoctors, popularSpecializations: popular, availableDoctors });
});

// @desc Admin login
// @route POST /api/admin/login
// @access Public
// @desc Admin login
// @route POST /api/admin/login
// @access Public
const adminLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (user && user.role === "admin" && (await user.matchPassword(password))) {
    // generate tokens
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // hash refresh token before saving
    const hashedToken = crypto.createHash('sha256').update(refreshToken).digest('hex');
    user.refreshToken = hashedToken;
    await user.save();

    // set HttpOnly cookie for refresh token
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


// @desc Get all doctors
// @route GET /api/admin/doctors
// @access Private/Admin
const getDoctors = asyncHandler(async (req, res) => {
  const doctors = await User.find({ role: 'doctor' });
  res.json(doctors);
});

// @desc Create doctor
// @route POST /api/admin/doctors
// @access Private/Admin
const createDoctor = asyncHandler(async (req, res) => {
  const { name, email, password, specialization, fee } = req.body; 

  const doctorExists = await User.findOne({ email });
  if (doctorExists) {
    res.status(400);
    throw new Error('Doctor already exists');
  }

  const doctor = await User.create({
    name,
    email,
    password,
    specialization,
    role: 'doctor',
    fee: fee || 0,
  });

  res.status(201).json(doctor);
});


// @desc Update doctor
// @route PUT /api/admin/doctors/:id
// @access Private/Admin
const updateDoctor = asyncHandler(async (req, res) => {
  const doctor = await User.findById(req.params.id);

  if (!doctor || doctor.role !== 'doctor') {
    res.status(404);
    throw new Error('Doctor not found');
  }

  const { name, email, password, specialization, fee } = req.body; 

  doctor.name = name || doctor.name;
  doctor.email = email || doctor.email;
  doctor.specialization = specialization || doctor.specialization;
  doctor.fee = fee !== undefined ? fee : doctor.fee; 

  if (password && password.trim() !== "") {
    doctor.password = password;
  }

  const updatedDoctor = await doctor.save();

  res.json({
    _id: updatedDoctor._id,
    name: updatedDoctor.name,
    email: updatedDoctor.email,
    specialization: updatedDoctor.specialization,
    fee: updatedDoctor.fee, 
    isActive: updatedDoctor.isActive,
  });
});



// @desc Get doctor by ID
// @route GET /api/admin/doctors/:id
// @access Private/Admin
const getDoctorById = asyncHandler(async (req, res) => {
  const doctor = await User.findById(req.params.id).select('-password');
  if (!doctor || doctor.role !== 'doctor') {
    res.status(404);
    throw new Error('Doctor not found');
  }
  res.json(doctor);
});

// @desc Refresh admin token
// @route POST /api/admin/refresh
// @access Public
const refreshAdminToken = asyncHandler(async (req, res) => {
  const tokenFromCookie = req.cookies.refreshToken;
  if (!tokenFromCookie) {
    return res.status(401).json({ message: "No refresh token" });
  }

  try {
    const decoded = jwt.verify(tokenFromCookie, process.env.JWT_REFRESH_SECRET);

    const hashedToken = crypto.createHash("sha256").update(tokenFromCookie).digest("hex");
    const admin = await User.findOne({ _id: decoded.id, refreshToken: hashedToken });

    if (!admin || admin.role !== "admin") {
      return res.status(403).json({ message: "Invalid or expired refresh token" });
    }

    //  rotate tokens
    const newAccessToken = generateAccessToken(admin._id);
    const newRefreshToken = generateRefreshToken(admin._id);
    const newHashed = crypto.createHash("sha256").update(newRefreshToken).digest("hex");

    admin.refreshToken = newHashed;
    await admin.save();

    // Cookie must be accessible globally
    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/", // ← crucial: global path
    });

    //  always respond with consistent key
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


const logoutUser = async (req, res) => {
  try {
    const cookies = req.cookies;
    if (!cookies?.jwt) return res.sendStatus(204); 
    const refreshToken = cookies.jwt;

    // Find user with this refresh token
    const user = await User.findOne({ refreshToken }).exec();
    if (!user) {
      res.clearCookie("jwt", { httpOnly: true, sameSite: "None", secure: true });
      return res.sendStatus(204);
    }

    //  Remove refresh token from DB
    await User.updateOne({ refreshToken }, { $unset: { refreshToken: 1 } });

    //  Clear cookie
    res.clearCookie("jwt", { httpOnly: true, sameSite: "None", secure: true });
    res.sendStatus(204);
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ message: "Server error during logout" });
  }
};

// @desc Admin analytics dashboard data
// @route GET /api/admin/analytics
// @access Private/Admin
const getAnalytics = asyncHandler(async (req, res) => {
  try {
    //  1. Most popular doctors (by patientCount)
    const popularDoctors = await User.find({ role: "doctor" })
      .sort({ patientCount: -1 })
      .limit(5)
      .select("name specialization patientCount");

    //  2. Most popular specializations (by total patients)
    const popularSpecializations = await User.aggregate([
      { $match: { role: "doctor", specialization: { $exists: true, $ne: "" } } },
      { $group: { _id: "$specialization", totalPatients: { $sum: "$patientCount" } } },
      { $sort: { totalPatients: -1 } },
      { $limit: 5 },
    ]);

    //  3. Appointments trend (last month)
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const monthlyAppointments = await Appointment.aggregate([
      { $match: { createdAt: { $gte: lastMonth } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    //  4. Total unique patients (from appointments)
    //  5. Total unique patients (based on email or name)
    const uniquePatientsAgg = await Appointment.aggregate([
      {
        $project: {
          patientKey: {
            $cond: [
              { $ne: ["$patientEmail", ""] },
              "$patientEmail",
              "$patientName"
            ]
          }
        }
      },
      { $group: { _id: "$patientKey" } }
    ]);

    const totalPatients = uniquePatientsAgg.length;

    

    // 5. Availability analytics
    const availabilityData = await Availability.aggregate([
      {
        $project: {
          doctor: 1,
          date: 1,
          slotsCount: { $size: "$ranges" },
        },
      },
      {
        $group: {
          _id: "$doctor",
          totalSlots: { $sum: "$slotsCount" },
        },
      },
    ]);

    // Total slots
    const totalSlots = availabilityData.reduce((sum, d) => sum + d.totalSlots, 0);
    const avgSlotsPerDoctor = availabilityData.length
      ? (totalSlots / availabilityData.length).toFixed(1)
      : 0;

    // Most and least available doctors
    const sortedAvailability = [...availabilityData].sort(
      (a, b) => b.totalSlots - a.totalSlots
    );
    const mostAvailableDoctor = sortedAvailability[0];
    const leastAvailableDoctor = sortedAvailability[sortedAvailability.length - 1];

    // Lookup names for those doctors
    const mostAvailable =
      mostAvailableDoctor &&
      (await User.findById(mostAvailableDoctor._id).select("name specialization"));
    const leastAvailable =
      leastAvailableDoctor &&
      (await User.findById(leastAvailableDoctor._id).select("name specialization"));

    // 6. Overall counts
    const totalDoctors = await User.countDocuments({ role: "doctor" });
    const totalAppointments = await Appointment.countDocuments();

    res.status(200).json({
      totalDoctors,
      totalPatients,
      totalAppointments,
      popularDoctors,
      popularSpecializations,
      monthlyAppointments,
      totalSlots,
      avgSlotsPerDoctor,
      mostAvailableDoctor: mostAvailable || null,
      leastAvailableDoctor: leastAvailable || null,
    });
  } catch (err) {
    console.error("❌ Error in getAnalytics:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});


module.exports = {
adminLogin,
getDoctors,
createDoctor,
updateDoctor,
deleteDoctor,
toggleDoctorStatus,
getStats,
getDoctorById,
refreshAdminToken,
logoutUser,
getAnalytics
};