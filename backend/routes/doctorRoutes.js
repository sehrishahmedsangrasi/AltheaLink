const express4 = require('express');
const router2 = express4.Router();
const {
  doctorLogin,
  getAppointments,
  setAvailability,
  updateAppointmentStatus,
  getDoctorStats,
  getDailySchedule,
  getDoctorProfile,
  updateDoctorPicture,
  changeDoctorPassword,
  refreshDoctorToken,
  removeDoctorPicture
} = require('../controllers/doctorController');
const { protect, doctorOnly } = require('../middlewares/auth');

// Public route
router2.post('/login', doctorLogin);
router2.post('/refresh', refreshDoctorToken); 


router2.use(protect);

// Doctor-only routes
router2.get('/appointments', doctorOnly, getAppointments);
router2.post('/availability', doctorOnly, setAvailability);
router2.patch('/appointments/:id/status', doctorOnly, updateAppointmentStatus);
router2.get('/stats', doctorOnly, getDoctorStats);
router2.get('/schedule', doctorOnly, getDailySchedule);
router2.get('/profile', doctorOnly, getDoctorProfile);
router2.patch('/profile/picture', doctorOnly, updateDoctorPicture);
router2.delete('/remove/picture', doctorOnly, removeDoctorPicture);
router2.patch("/change-password",  doctorOnly, changeDoctorPassword);

router2.get('/validate-token', doctorOnly, (req, res) => {
  res.json({ valid: true, user: req.user });
});

module.exports = router2;
