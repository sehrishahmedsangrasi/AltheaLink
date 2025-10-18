
const fs = require("fs");
const path = require("path");
const { ElevenLabsClient } = require("elevenlabs");
const axios = require("axios");


exports.processVoice = async (req, res) => {
  console.log("🎤 [Doctor Voice] Processing started...");

  try {
    if (!req.file) {
      console.error("❌ No audio file in request");
      return res.status(400).json({ error: "No audio file provided" });
    }

    const audioFilePath = req.file.path;
    console.log(`📁 Audio file received: ${audioFilePath}`);
    const audioBuffer = fs.readFileSync(audioFilePath);
    const audioBlob = new Blob([audioBuffer], { type: req.file.mimetype });

    // -------------------------
    // 1️⃣ Transcribe via ElevenLabs
    // -------------------------
    const elevenlabs = new ElevenLabsClient({ apiKey: process.env.ELEVEN_API_KEY });
    console.log("🔄 Sending to ElevenLabs STT...");
    const transcription = await elevenlabs.speechToText.convert({
      file: audioBlob,
      model_id: "scribe_v1",
      tag_audio_events: false,
      language_code: "eng",
      diarize: false,
    });

    let userText = transcription.text?.trim() || "";
    console.log("👤 User said:", userText);

    // -------------------------
    // 2️⃣ Normalize text using Gemini
    // -------------------------
    const normalizeText = async (text) => {
      const prompt = `
You are a text normalizer for a medical voice assistant. Extract the user's intent and doctor selection from this sentence:

Instructions:
1) Always return JSON only.
2) Fields:
   - "intent": one of ["greeting", "select_specialization", "select_doctor", "unknown"]
   - "doctor_specialization": e.g., "cardiologist", "dermatologist", etc. (empty string if not mentioned)
   - "doctor_id": numeric ID if mentioned (1-10), else empty string
   - "normalized_text": cleaned-up version of user text
3) Understand phrases like "doctor two", "dr id 4", "doctor id'd four" etc.
4) If unsure, set "intent": "unknown".

Input: "${text}"
Return JSON only.
      `;

      const tryGemini = async (model) => {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`;
        try {
          const response = await axios.post(
            url,
            { contents: [{ parts: [{ text: prompt }] }] },
            { headers: { "Content-Type": "application/json" }, timeout: 10000 }
          );

          let reply = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
          reply = reply.replace(/```json/i, "").replace(/```/g, "").trim();
          const match = reply.match(/\{[\s\S]*\}/);
          return match ? JSON.parse(match[0]) : null;
        } catch (err) {
          console.warn(`⚠️ Gemini model ${model} failed: ${err.message}`);
          return null;
        }
      };

      const models = ["gemini-2.0-flash", "gemini-2.5-flash"];
      for (const m of models) {
        const result = await tryGemini(m);
        if (result) return result;
      }
      return { intent: "unknown", doctor_specialization: "", doctor_id: "", normalized_text: text };
    };

    const normalized = await normalizeText(userText);
    console.log("✅ Gemini normalized result:", normalized);

    let botReply = "";
    let isError = false;

    // -------------------------
    // 3️⃣ Compose bot reply based on normalized data
    // -------------------------
    switch (normalized.intent) {
      case "greeting":
        botReply =
          "Hi there! Please tell me what kind of doctor you’re looking for — like heart, skin, or child specialist.";
        break;
      case "select_specialization":
        botReply = `Got it! Here are some ${normalized.doctor_specialization} specialists. Please say the doctor ID to proceed.`;
        break;
      case "select_doctor":
        botReply = `You selected Doctor ${normalized.doctor_id}. Let's proceed to appointment time selection.`;
        break;
      default:
        botReply =
          "I couldn't understand that. Please say something like 'I need a cardiologist' or 'Doctor 2'.";
        isError = true;
        break;
    }

    // -------------------------
    // 4️⃣ Convert reply to audio (TTS)
    // -------------------------
    const ttsResponse = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${process.env.VOICE_ID}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": process.env.ELEVEN_API_KEY,
          "Content-Type": "application/json",
          Accept: "audio/mpeg",
        },
        body: JSON.stringify({
          text: botReply,
          model_id: "eleven_monolingual_v1",
          voice_settings: { stability: 0.4, similarity_boost: 0.7 },
        }),
      }
    );

    if (!ttsResponse.ok) {
      const errTxt = await ttsResponse.text();
      throw new Error(`TTS failed: ${errTxt}`);
    }

    const audioBufferTTS = await ttsResponse.arrayBuffer();
    const uploadsDir = path.join(__dirname, "..", "uploads");
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
    const outputFilePath = path.join(uploadsDir, `doctor-response.mp3`);
    fs.writeFileSync(outputFilePath, Buffer.from(audioBufferTTS));

    // Cleanup
    fs.unlinkSync(audioFilePath);

    // -------------------------
    // 5️⃣ Final response
    // -------------------------
    res.json({
      botReply,
      audioUrl: `/uploads/doctor-response.mp3`,
      transcription: transcription.text,
      intent: normalized.intent,
      doctorSpecialization: normalized.doctor_specialization,
      doctorId: normalized.doctor_id,
      isError,
    });

    console.log("✅ [Doctor Voice] Processing completed!");
  } catch (err) {
    console.error("❌ Error processing doctor voice:", err);
    res.status(500).json({ error: "Doctor voice processing failed", details: err.message });
  }
};

exports.processDateVoice = async (req, res) => {
  console.log("🎤 [Date Prompt] Voice processing started...");

  try {
    if (!req.file) {
      console.error("❌ No audio file in request");
      return res.status(400).json({ error: "No audio file provided" });
    }

    const audioFilePath = req.file.path;
    console.log(`📁 Audio file received: ${audioFilePath}`);

    // -------------------------
    // 1️⃣ Transcribe via ElevenLabs
    // -------------------------
    const elevenlabs = new ElevenLabsClient({ apiKey: process.env.ELEVEN_API_KEY });
    const audioBuffer = fs.readFileSync(audioFilePath);
    const audioBlob = new Blob([audioBuffer], { type: req.file.mimetype });

    console.log("🔄 Sending to ElevenLabs STT...");
    const transcription = await elevenlabs.speechToText.convert({
      file: audioBlob,
      model_id: "scribe_v1",
      tag_audio_events: false,
      language_code: "eng",
      diarize: false,
    });

    const userText = transcription.text?.trim() || "";
    console.log("👤 User said:", userText);

    // -------------------------
    // 2️⃣ Normalize text using Gemini (FUTURE-SAFE YEAR LOGIC)
    // -------------------------
    const normalizeText = async (text) => {
  const currentDate = new Date().toISOString().split("T")[0];
  const prompt = `
    You are a date/time normalizer. Given an input sentence (from speech-to-text), extract the date and time.

    Important instructions:
    1) ALWAYS output a single JSON object and nothing else.

    2) Fields:
      - "date": in "YYYY-MM-DD" or empty string if not found
      - "time": in 24-hour "HH:mm" or empty string
      - "year_specified": true if the user explicitly mentioned a 4-digit year, otherwise false
      - "note": short explanation if assumptions made

    3) YEAR LOGIC:
      - CURRENT_DATE = ${currentDate}.
      - If the user did NOT mention a year:
        → pick the *next logical future occurrence* of the mentioned month/day.
          Example: CURRENT_DATE = 2025-10-15
          "January 5" → 2026-01-05
          "October 20" → 2025-10-20
      - If the user mentioned a year, use it exactly.

    4) RELATIVE DATES:
      - Support "today", "tomorrow", "next Monday", "next week", etc., relative to CURRENT_DATE.

    5) TIME LOGIC:
      - Accept phrases like "2 PM", "2 p.m.", "four thirty p.m.", "half past two", "14:00", etc.
      - If the user says "2 o'clock" or any time **without AM or PM**, assume **morning (AM)** unless the context clearly suggests afternoon.
      - Return in 24-hour format (e.g., 02:00 for 2 AM, 14:00 for 2 PM).

    6) If uncertain, leave the field empty and add a short note explaining.

    Input: "${text}"

    Return ONLY JSON.
    `;

      const tryGemini = async (model) => {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`;
        try {
          const response = await axios.post(
            url,
            { contents: [{ parts: [{ text: prompt }] }] },
            { headers: { "Content-Type": "application/json" }, timeout: 10000 }
          );

          let reply = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
          reply = reply.replace(/```json/i, "").replace(/```/g, "").trim();
          const match = reply.match(/\{[\s\S]*\}/);
          const jsonText = match ? match[0] : reply;

          const parsed = JSON.parse(jsonText);
          if (parsed.date || parsed.time) return parsed;
          throw new Error("Empty Gemini result");
        } catch (err) {
          console.warn(`⚠️ ${model} failed: ${err.message}`);
          return null;
        }
      };

      const models = ["gemini-2.0-flash", "gemini-2.5-flash"];
      for (const m of models) {
        const result = await tryGemini(m);
        if (result) return result;
      }
      return { date: "", time: "", year_specified: false, note: "normalizer unavailable" };
    };

    //  ACTUAL CALL TO GEMINI
    let extractedDate = "";
    let extractedTime = "";

    try {
      const normalized = await normalizeText(userText);
      extractedDate = normalized.date || "";
      extractedTime = normalized.time || "";
      console.log("✅ Normalized result:", normalized);
    } catch (err) {
      console.warn("⚠️ Normalization failed completely:", err.message);
    }

    // -------------------------
    // 3️⃣ Fallback if Gemini fails
    // -------------------------
    if (!extractedDate) {
      const now = new Date();
      if (/today/i.test(userText)) extractedDate = now.toISOString().split("T")[0];
      else if (/tomorrow/i.test(userText)) {
        now.setDate(now.getDate() + 1);
        extractedDate = now.toISOString().split("T")[0];
      } else if (/next week/i.test(userText)) {
        now.setDate(now.getDate() + 7);
        extractedDate = now.toISOString().split("T")[0];
      }
    }

    if (!extractedTime) {
      const timeMatch = userText.match(/(\d{1,2})(?:[:.](\d{2}))?\s*(AM|PM|A\.M\.|P\.M\.)?/i);
      if (timeMatch) {
        let [_, hour, minute, period] = timeMatch;
        hour = parseInt(hour);
        minute = minute ? parseInt(minute) : 0;
        if (/PM/i.test(period) && hour < 12) hour += 12;
        if (/AM/i.test(period) && hour === 12) hour = 0;
        extractedTime = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
      }
    }

    // -------------------------
    // 4️⃣ Validate slots
    // -------------------------
    const availableSlots = req.body.availableSlots ? JSON.parse(req.body.availableSlots) : [];
    console.log("📅 Available slots:", availableSlots);
    const isSlotAvailable = extractedTime ? availableSlots.includes(extractedTime) : false;

    // -------------------------
    // 5️⃣ Bot reply
    // -------------------------
    let botReply = "";
    let intent = "";
    let isError = false;

    if (!extractedDate && !extractedTime) {
      botReply =
        "I couldn't catch the date or time clearly. Please say something like 'October 15th at 2 PM' or 'tomorrow at 10 AM'.";
      intent = "error";
      isError = true;
    } else if (extractedTime && !isSlotAvailable && availableSlots.length > 0) {
      botReply = `I'm sorry, but ${extractedTime} is not available. The available times are ${availableSlots.join(
        ", "
      )}. Please choose another slot.`;
      intent = "slot_unavailable";
      isError = true;
    } else {
      const parts = [];
      if (extractedDate) parts.push(`date: ${extractedDate}`);
      if (extractedTime) parts.push(`time: ${extractedTime}`);
      botReply = `Got it! I’ve noted ${parts.join(" and ")}.`;

      if (extractedDate && extractedTime) {
        botReply += " I'll proceed with the booking now.";
      } else if (extractedDate && !extractedTime) {
        botReply += " Please also tell me the time for your appointment.";
      } else if (extractedTime && !extractedDate) {
        botReply += " Please also tell me the date for your appointment.";
      }

      intent = "select_date";
    }

    // -------------------------
    // 6️⃣ Convert reply to audio (TTS)
    // -------------------------
    const ttsResponse = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${process.env.VOICE_ID}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": process.env.ELEVEN_API_KEY,
          "Content-Type": "application/json",
          Accept: "audio/mpeg",
        },
        body: JSON.stringify({
          text: botReply,
          model_id: "eleven_monolingual_v1",
          voice_settings: { stability: 0.4, similarity_boost: 0.7 },
        }),
      }
    );

    if (!ttsResponse.ok) {
      const errTxt = await ttsResponse.text();
      throw new Error(`TTS failed: ${errTxt}`);
    }

    const audioBufferTTS = await ttsResponse.arrayBuffer();
    const uploadsDir = path.join(__dirname, "..", "uploads");
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
    const outputFilePath = path.join(uploadsDir, `date-response.mp3`);
    fs.writeFileSync(outputFilePath, Buffer.from(audioBufferTTS));
    fs.unlinkSync(audioFilePath);

    // -------------------------
    // 7️⃣ Final response
    // -------------------------
    res.json({
      botReply,
      audioUrl: `/uploads/date-response.mp3`,
      transcription: transcription.text,
      intent,
      isError,
      extractedDate,
      extractedTime,
      isSlotAvailable,
    });

    console.log("✅ [Date Prompt] Voice processing completed!");
  } catch (err) {
    console.error("❌ Error processing date voice:", err);
    res.status(500).json({ error: "Date voice processing failed", details: err.message });
  }
};




exports.processPatientInfoVoice = async (req, res) => {
  console.log("🎤 [Patient Info] Voice processing started...");

  try {
    if (!req.file) {
      console.error("❌ No audio file in request");
      return res.status(400).json({ error: "No audio file provided" });
    }

    const audioFilePath = req.file.path;
    console.log(`📁 Audio file received: ${audioFilePath}`);

    // -------------------------
    // 1️⃣ Transcribe via ElevenLabs
    // -------------------------
    const elevenlabs = new ElevenLabsClient({ apiKey: process.env.ELEVEN_API_KEY });
    const audioBuffer = fs.readFileSync(audioFilePath);
    const audioBlob = new Blob([audioBuffer], { type: req.file.mimetype });

    console.log("🔄 Sending to ElevenLabs STT...");
    const transcription = await elevenlabs.speechToText.convert({
      file: audioBlob,
      model_id: "scribe_v1",
      tag_audio_events: false,
      language_code: "eng",
      diarize: false,
    });

    const userText = transcription.text?.trim() || "";
    console.log("👤 User said:", userText);

    // Get existing form data from request (for partial updates)
    const existingData = req.body.existingData ? JSON.parse(req.body.existingData) : {};
    console.log("📋 Existing form data:", existingData);

    // -------------------------
    // 2️⃣ Extract & Normalize using Gemini
    // -------------------------
    const extractPatientInfo = async (text, existing) => {
      const prompt = `
    You are a patient information extractor and normalizer. Given a speech-to-text transcript, extract the following fields:

    IMPORTANT: Return ONLY a valid JSON object with these exact fields:
    {
      "name": string (full name) or empty string,
      "email": string (valid email format) or empty string,
      "phone": string (valid phone format with country code) or empty string,
      "symptoms": string (description of medical symptoms) or empty string,
      "missing_fields": array of field names that are missing or invalid,
      "note": string (short explanation)
    }

    EXTRACTION RULES:

    1) NAME:
      - Extract full name (first name + last name minimum)
      - Capitalize properly (e.g., "john doe" → "John Doe")
      - If only first name given, mark as incomplete

    2) EMAIL:
      - Convert speech-to-text email carefully:
        * "at" or "at the rate" → @
        * "dot" → .
        * "gmail dot com" → gmail.com
        * Numbers: "one" → 1, "two" → 2, etc.
      - Examples:
        * "john dot doe at gmail dot com" → john.doe@gmail.com
        * "user one two three at yahoo dot com" → user123@yahoo.com
      - Validate email format (must have @ and domain)
      - If invalid, leave empty and add to missing_fields

    3) PHONE:
      - Convert spoken numbers to digits:
        * "zero" → 0, "one" → 1, "two" → 2, etc.
        * "double five" → 55
        * "triple nine" → 999
      - Format: +[country code] [number]
      - Default country code for Pakistan: +92
      - Examples:
        * "zero three one two three four five six seven eight nine" → +92 0312-3456789
        * "plus nine two three zero zero one two three four five six seven" → +92 3001234567
      - Remove spaces and format properly
      - If incomplete or invalid, leave empty and add to missing_fields

    4) SYMPTOMS:
      - Extract medical symptoms, complaints, or health issues
      - Keep as descriptive text
      - Examples: "fever and cough", "headache for 3 days", "chest pain"
      - If not mentioned, leave empty and add to missing_fields

    5) MISSING FIELDS:
      - List all fields that are: empty, invalid, or incomplete
      - Examples: ["email", "phone"] if these weren't extracted

    6) EXISTING DATA:
      - Current form data: ${JSON.stringify(existing)}
      - ONLY extract NEW information from the transcript
      - DO NOT overwrite existing valid data with empty values
      - If existing data has a field and transcript doesn't mention it, keep existing value

    User transcript: "${text}"

    Return ONLY the JSON object. No markdown, no extra text.
    `;

      const tryGemini = async (model) => {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`;
        try {
          const response = await axios.post(
            url,
            { contents: [{ parts: [{ text: prompt }] }] },
            { headers: { "Content-Type": "application/json" }, timeout: 15000 }
          );

          let reply = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
          reply = reply.replace(/```json/i, "").replace(/```/g, "").trim();
          const match = reply.match(/\{[\s\S]*\}/);
          const jsonText = match ? match[0] : reply;

          const parsed = JSON.parse(jsonText);
          
          // Merge with existing data
          const merged = {
            name: parsed.name || existing.name || "",
            email: parsed.email || existing.email || "",
            phone: parsed.phone || existing.phone || "",
            symptoms: parsed.symptoms || existing.symptoms || "",
            missing_fields: parsed.missing_fields || [],
            note: parsed.note || ""
          };

          return merged;
        } catch (err) {
          console.warn(`⚠️ ${model} failed: ${err.message}`);
          return null;
        }
      };

      const models = ["gemini-2.0-flash-exp", "gemini-2.0-flash"];
      for (const m of models) {
        const result = await tryGemini(m);
        if (result) return result;
      }
      
      return { 
        name: existing.name || "",
        email: existing.email || "",
        phone: existing.phone || "",
        symptoms: existing.symptoms || "",
        missing_fields: ["name", "email", "phone", "symptoms"],
        note: "Gemini extraction unavailable" 
      };
    };

    // ACTUAL CALL TO GEMINI
    let extractedInfo = {
      name: "",
      email: "",
      phone: "",
      symptoms: "",
      missing_fields: [],
      note: ""
    };

    try {
      extractedInfo = await extractPatientInfo(userText, existingData);
      console.log("✅ Extracted patient info:", extractedInfo);
    } catch (err) {
      console.warn("⚠️ Extraction failed:", err.message);
    }

    // -------------------------
    // 3️⃣ Validate extracted data
    // -------------------------
    const missingFields = [];
    
    if (!extractedInfo.name || extractedInfo.name.split(" ").length < 2) {
      missingFields.push("name");
    }
    
    if (!extractedInfo.email || !extractedInfo.email.includes("@") || !extractedInfo.email.includes(".")) {
      missingFields.push("email");
    }
    
    if (!extractedInfo.phone || extractedInfo.phone.length < 10) {
      missingFields.push("phone");
    }
    
    if (!extractedInfo.symptoms || extractedInfo.symptoms.length < 5) {
      missingFields.push("symptoms");
    }

    extractedInfo.missing_fields = missingFields;

    // -------------------------
    // 4️⃣ Generate bot reply based on extraction
    // -------------------------
    let botReply = "";
    let intent = "";
    let shouldSubmit = false;

    if (missingFields.length === 0) {
      // ✅ All fields captured successfully
      botReply = `Perfect! I have all your information. Let me submit your appointment now. Your name is ${extractedInfo.name}, email is ${extractedInfo.email}, phone number is ${extractedInfo.phone}, and your symptoms are: ${extractedInfo.symptoms}. Thank you for choosing althealink.`;
      intent = "all_fields_captured";
      shouldSubmit = true;
    } else if (missingFields.length === 4) {
      // ❌ Nothing captured
      botReply = "I couldn't understand that clearly. Please tell me your full name, email address, phone number, and your symptoms. You can say something like: My name is John Doe, email is john dot doe at gmail dot com, phone is zero three one two three four five six seven eight nine, and I have fever and cough.";
      intent = "no_fields_captured";
    } else {
      // ⚠️ Partial capture - ask for missing fields only
      const missingFieldNames = missingFields.map(field => {
        if (field === "name") return "full name";
        if (field === "email") return "email address";
        if (field === "phone") return "phone number";
        if (field === "symptoms") return "symptoms";
        return field;
      });

      const capturedFields = [];
      if (!missingFields.includes("name")) capturedFields.push(`name: ${extractedInfo.name}`);
      if (!missingFields.includes("email")) capturedFields.push(`email: ${extractedInfo.email}`);
      if (!missingFields.includes("phone")) capturedFields.push(`phone: ${extractedInfo.phone}`);
      if (!missingFields.includes("symptoms")) capturedFields.push(`symptoms: ${extractedInfo.symptoms}`);

      botReply = `Got it! I captured ${capturedFields.join(", ")}. However, I still need your ${missingFieldNames.join(" and ")}. Please tell me ${missingFieldNames.length === 1 ? "that" : "those"} now.`;
      intent = "partial_fields_captured";
    }

    console.log("🤖 Bot reply:", botReply);
    console.log("📊 Missing fields:", missingFields);
    console.log("✅ Should submit:", shouldSubmit);

    // -------------------------
    // 5️⃣ Convert reply to audio (TTS)
    // -------------------------
    const ttsResponse = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${process.env.VOICE_ID}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": process.env.ELEVEN_API_KEY,
          "Content-Type": "application/json",
          Accept: "audio/mpeg",
        },
        body: JSON.stringify({
          text: botReply,
          model_id: "eleven_monolingual_v1",
          voice_settings: { stability: 0.4, similarity_boost: 0.7 },
        }),
      }
    );

    if (!ttsResponse.ok) {
      const errTxt = await ttsResponse.text();
      throw new Error(`TTS failed: ${errTxt}`);
    }

    const audioBufferTTS = await ttsResponse.arrayBuffer();
    const uploadsDir = path.join(__dirname, "..", "uploads");
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
    const outputFilePath = path.join(uploadsDir, `patient-info-response.mp3`);
    fs.writeFileSync(outputFilePath, Buffer.from(audioBufferTTS));
    
    // Clean up uploaded audio file
    fs.unlinkSync(audioFilePath);

    // -------------------------
    // 6️⃣ Final response
    // -------------------------
    res.json({
      botReply,
      audioUrl: `/uploads/${path.basename(outputFilePath)}`,
      transcription: transcription.text,
      intent,
      shouldSubmit,
      extractedInfo: {
        name: extractedInfo.name,
        email: extractedInfo.email,
        phone: extractedInfo.phone,
        symptoms: extractedInfo.symptoms
      },
      missingFields: extractedInfo.missing_fields
    });

    console.log("✅ [Patient Info] Voice processing completed!");
  } catch (err) {
    console.error("❌ Error processing patient info voice:", err);
    res.status(500).json({ 
      error: "Patient info voice processing failed", 
      details: err.message 
    });
  }
};


