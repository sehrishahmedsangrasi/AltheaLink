const express5 = require('express');
const router3 = express5.Router();
const { browseDoctors, getAvailableSlots, bookAppointment, getTopDoctors } = require('../controllers/patientController');


router3.get('/doctors', browseDoctors);
router3.get('/doctors/:id/slots', getAvailableSlots);
router3.post('/book', bookAppointment);
router3.get("/top-doctors", getTopDoctors);


module.exports = router3;