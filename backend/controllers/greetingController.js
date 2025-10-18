const fs = require("fs");
const path = require("path");

exports.greetUser = async (req, res) => {
  console.log("🎵 Greeting endpoint called");
  
  try {
   const botGreeting = 
  "Hello! Welcome to AltheaLink, your smart healthcare partner! You can book your appointments here. Please tell me what kind of doctor you’re looking for, for example, a heart, skin, or child specialist";

    console.log("📞 Calling ElevenLabs TTS API...");
    
    const ttsResponse = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${process.env.VOICE_ID}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": process.env.ELEVEN_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: botGreeting,
          model_id: "eleven_monolingual_v1",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
      }
    );

    if (!ttsResponse.ok) {
      const errorText = await ttsResponse.text();
      console.error("❌ ElevenLabs API error:", errorText);
      throw new Error(`ElevenLabs API error: ${ttsResponse.statusText}`);
    }

    console.log("✅ TTS response received");

    // Ensure uploads directory exists
    const uploadsDir = path.join(__dirname, "..", "uploads");
    if (!fs.existsSync(uploadsDir)) {
      console.log("📁 Creating uploads directory...");
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Save audio as proper binary stream
    const outputFilePath = path.join(uploadsDir, "bot-greeting.mp3");
    console.log("💾 Saving audio to:", outputFilePath);

    const arrayBuffer = await ttsResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(outputFilePath, buffer);

    const fileSize = fs.statSync(outputFilePath).size;
    console.log(`✅ Greeting audio saved successfully (${fileSize} bytes)`);

    res.json({
      botReply: botGreeting,
      audioUrl: `/uploads/bot-greeting.mp3`,
    });
  } catch (err) {
    console.error("❌ Greeting Error:", err);
    res.status(500).json({ error: "Failed to generate greeting", details: err.message });
  }
};

exports.datePrompt = async (req, res) => {
  console.log("📅 Date prompt endpoint called");

  try {
    // -------------------------------
    // 1️⃣ Default bot reply
    // -------------------------------
    const botReply = "Please tell me the date, month, and time in 24 hours fromat for your appointment.";

    // -------------------------------
    // 2️⃣ Ensure uploads directory exists
    // -------------------------------
    const uploadsDir = path.join(__dirname, "..", "uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const outputFilePath = path.join(uploadsDir, "date-prompt.mp3");

    // -------------------------------
    // 3️⃣ Generate TTS audio only if it doesn't exist
    // -------------------------------
    if (!fs.existsSync(outputFilePath)) {
      console.log("📞 Generating date-prompt audio via ElevenLabs...");

      const ttsResponse = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${process.env.VOICE_ID}`,
        {
          method: "POST",
          headers: {
            "xi-api-key": process.env.ELEVEN_API_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: botReply,
            model_id: "eleven_monolingual_v1",
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75,
            },
          }),
        }
      );

      if (!ttsResponse.ok) {
        const errorText = await ttsResponse.text();
        console.error("❌ ElevenLabs API error:", errorText);
        throw new Error(`ElevenLabs API error: ${ttsResponse.statusText}`);
      }

      const arrayBuffer = await ttsResponse.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      fs.writeFileSync(outputFilePath, buffer);
      console.log("✅ Date prompt audio saved successfully");
    } else {
      console.log("📂 Using existing date-prompt.mp3");
    }

    // -------------------------------
    // 4️⃣ Respond with bot reply and audio
    // -------------------------------
    res.json({
      botReply,
      audioUrl: "/uploads/date-prompt.mp3",
    });

  } catch (err) {
    console.error("❌ Date Prompt Error:", err);
    res.status(500).json({
      error: "Failed to generate date prompt",
      details: err.message,
    });
  }
};

exports.slotUnavailableTTS = async (req, res) => {
  console.log("🎵 Slot Unavailable TTS endpoint called");

  try {
    //  Message from frontend or fallback text
    const userMessage =
      req.body.message ||
      "Sorry, this slot is not available. Please select from the available slots.";

    console.log("🗨️ TTS Message:", userMessage);

    //  Define file path (no timestamp)
    const uploadsDir = path.join(__dirname, "..", "uploads");
    const fileName = "slot-unavailable.mp3";
    const outputFilePath = path.join(uploadsDir, fileName);

    //  Check if file already exists
    if (fs.existsSync(outputFilePath)) {
      console.log("✅ Existing TTS file found, skipping ElevenLabs request");
      return res.json({
        botReply: userMessage,
        audioUrl: `/uploads/${fileName}`,
      });
    }

    //  Otherwise, call ElevenLabs TTS API
    console.log("📞 Calling ElevenLabs TTS API...");
    const ttsResponse = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${process.env.VOICE_ID}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": process.env.ELEVEN_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: userMessage,
          model_id: "eleven_monolingual_v1",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
      }
    );

    if (!ttsResponse.ok) {
      const errorText = await ttsResponse.text();
      console.error("❌ ElevenLabs API error:", errorText);
      throw new Error(`ElevenLabs API error: ${ttsResponse.statusText}`);
    }

    console.log("✅ TTS response received");

    //  Ensure uploads directory exists
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

    //  Save the audio file
    const arrayBuffer = await ttsResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(outputFilePath, buffer);

    const fileSize = fs.statSync(outputFilePath).size;
    console.log(`✅ Audio saved successfully (${fileSize} bytes)`);

    //  Send back the result
    res.json({
      botReply: userMessage,
      audioUrl: `/uploads/${fileName}`,
    });
  } catch (err) {
    console.error("❌ Slot Unavailable TTS Error:", err);
    res.status(500).json({
      error: "Failed to generate slot unavailable TTS",
      details: err.message,
    });
  }
};

exports.slotConfirmedTTS = async (req, res) => {
  console.log("🎵 Slot Confirmed TTS endpoint called");

  try {
    //  Message from frontend with date and time
    const { date, time } = req.body;
    const userMessage =
      req.body.message ||
      `Great! Your appointment is confirmed for ${date} at ${time}. Let's proceed to the next step.`;

    console.log("🗨️ TTS Message:", userMessage);

    // Define file path (no timestamp for caching)
    const uploadsDir = path.join(__dirname, "..", "uploads");
    const fileName = "slot-confirmed.mp3";
    const outputFilePath = path.join(uploadsDir, fileName);

   
    //  Otherwise, call ElevenLabs TTS API
    console.log("📞 Calling ElevenLabs TTS API...");
    const ttsResponse = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${process.env.VOICE_ID}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": process.env.ELEVEN_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: userMessage,
          model_id: "eleven_monolingual_v1",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
      }
    );

    if (!ttsResponse.ok) {
      const errorText = await ttsResponse.text();
      console.error("❌ ElevenLabs API error:", errorText);
      throw new Error(`ElevenLabs API error: ${ttsResponse.statusText}`);
    }

    console.log("✅ TTS response received");

    //  Ensure uploads directory exists
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

    //  Save the audio file
    const arrayBuffer = await ttsResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(outputFilePath, buffer);

    const fileSize = fs.statSync(outputFilePath).size;
    console.log(`✅ Audio saved successfully (${fileSize} bytes)`);

    // Send back the result
    res.json({
      botReply: userMessage,
      audioUrl: `/uploads/${fileName}`,
    });
  } catch (err) {
    console.error("❌ Slot Confirmed TTS Error:", err);
    res.status(500).json({
      error: "Failed to generate slot confirmed TTS",
      details: err.message,
    });
  }
};

exports.getPatientInfoGreeting = async (req, res) => {
  console.log("🎙️ [Patient Info Greeting] Started...");
  
  try {
    const greetingText = "Please tell me your full name, email address, phone number, and describe your symptoms. You can say it all at once, or tell me one at a time and also tell spelling of email address in order to be saved errors.";

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
          text: greetingText,
          model_id: "eleven_monolingual_v1",
          voice_settings: { stability: 0.4, similarity_boost: 0.7 },
        }),
      }
    );

    if (!ttsResponse.ok) {
      const errTxt = await ttsResponse.text();
      throw new Error(`TTS failed: ${errTxt}`);
    }

    const audioBuffer = await ttsResponse.arrayBuffer();
    const uploadsDir = path.join(__dirname, "..", "uploads");
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
    const outputFilePath = path.join(uploadsDir, "patient-greeting.mp3");
    fs.writeFileSync(outputFilePath, Buffer.from(audioBuffer));

    res.json({
      audioUrl: `/uploads/patient-greeting.mp3`,
      message: greetingText
    });

    console.log("✅ [Patient Info Greeting] Completed!");
  } catch (err) {
    console.error("❌ Error generating greeting:", err);
    res.status(500).json({ 
      error: "Greeting generation failed", 
      details: err.message 
    });
  }
};