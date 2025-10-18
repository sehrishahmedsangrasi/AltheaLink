const express = require("express");
const multer = require("multer");
const { processVoice, processDateVoice, processPatientInfoVoice  } = require("../controllers/voiceController");

const router = express.Router();
const upload = multer({ dest: "uploads/" });

console.log('🎙️ Voice routes loaded successfully');

router.post("/process", upload.single("audio"), processVoice);
router.post("/process-date", upload.single("audio"), processDateVoice);
router.post("/process-patient-info", upload.single("audio"), processPatientInfoVoice);


module.exports = router;
