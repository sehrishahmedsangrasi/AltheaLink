const express = require("express");
const router = express.Router();
const { greetUser, datePrompt, slotUnavailableTTS, slotConfirmedTTS, getPatientInfoGreeting } = require("../controllers/greetingController");

router.get("/greet", greetUser);
router.get("/date-prompt", datePrompt);
router.post("/slot-unavailable-tts", slotUnavailableTTS);
router.post("/slot-confirmed-tts", slotConfirmedTTS);
router.get("/patient-info", getPatientInfoGreeting);

console.log("✅ Greeting routes loaded");
module.exports = router;
