const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/adminController');
const { protect, adminOnly } = require('../middlewares/auth');


router.post('/login', adminLogin);
router.post("/refresh", refreshAdminToken);


router.use(protect, adminOnly); 


router.get('/doctors', getDoctors);
router.post('/doctors', createDoctor);
router.put('/doctors/:id', updateDoctor);
router.delete('/doctors/:id', deleteDoctor);
router.patch('/doctors/:id/status', toggleDoctorStatus);
router.get('/stats', getStats);
router.get('/doctors/:id', getDoctorById);
router.get('/validate-token', (req, res) => {
  res.json({ valid: true, user: req.user });
});
router.post("/logout", logoutUser);
router.get("/analytics", getAnalytics);
module.exports = router;