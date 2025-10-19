
"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { FaCalendarAlt, FaClock, FaArrowLeft, FaUserMd, FaMicrophone } from "react-icons/fa";
import { fetchDoctorSlots } from "../../../../api/patientApi";

export default function DoctorDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [slots, setSlots] = useState<string[]>([]);
  const [date, setDate] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    setDate(today);
  }, []);

  useEffect(() => {
    if (date) {
      handleFetchSlots();
    }
  }, [date]);

  const handleVoiceClick = async () => {
    //  If currently recording → stop it
    if (isRecording && mediaRecorder) {
      stopRecording();
      return;
    }

    //  Otherwise, start the greeting audio + start recording
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      const ttsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/greeting/date-prompt`);

      if (!ttsRes.ok) throw new Error(`TTS API error: ${ttsRes.status}`);

      const { audioUrl } = await ttsRes.json();
      const fullUrl = `${process.env.NEXT_PUBLIC_API_URL}${audioUrl}`;

      const audio = new Audio(fullUrl);

      audio.onerror = (e) => {
        console.error("Failed to play greeting audio", e);
        alert("Greeting audio could not be played.");
        setIsProcessing(false);
      };

      // When greeting ends, start recording
      audio.onended = async () => {
        await startRecording();
        setIsProcessing(false);
      };

      await audio.play();
    } catch (error) {
      console.error("Voice click error:", error);
      alert("Could not start greeting. Please check backend audio route.");
      setIsProcessing(false);
    }
  };

  const startRecording = async () => {
    console.log("🎙️ === START RECORDING FUNCTION CALLED ===");
    try {
      console.log("🎤 Requesting microphone access...");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log("✅ Microphone access granted");
      
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (e: BlobEvent) => {
        console.log("📦 Audio chunk received, size:", e.data.size);
        chunks.push(e.data);
      };

      recorder.onstop = async () => {
        console.log("🛑 === RECORDING STOPPED ===");
        const audioBlob = new Blob(chunks, { type: "audio/webm" });
        console.log("💾 Audio blob created, size:", audioBlob.size, "bytes");
        console.log("📤 Calling sendAudioToBackend...");
        await sendAudioToBackend(audioBlob);

        // Stop tracks
        stream.getTracks().forEach((track) => track.stop());
        setMediaRecorder(null);
        setIsRecording(false);
        console.log("✅ Recording cleanup completed");
      };

      setMediaRecorder(recorder);
      recorder.start();
      setIsRecording(true);
      console.log("🎙️ Recording STARTED successfully");
    } catch (err) {
      console.error("❌ Mic access error:", err);
      alert("Please allow microphone access.");
      setIsProcessing(false);
    }
  };

  const stopRecording = () => {
    console.log("🛑 === STOP RECORDING FUNCTION CALLED ===");
    console.log("📊 MediaRecorder state:", mediaRecorder?.state || "null");
    
    if (!mediaRecorder) {
      console.warn("⚠️ No active recorder to stop.");
      setIsRecording(false);
      setIsProcessing(false);
      return;
    }

    if (mediaRecorder.state !== "inactive") {
      console.log("🛑 Stopping active recording...");
      mediaRecorder.stop();
      setIsRecording(false);
      console.log("✅ Recording stopped");
    } else {
      console.log("⚠️ Recorder already inactive.");
    }
  };

  const sendAudioToBackend = async (audioBlob: Blob) => {
    console.log("=== 🎙️ SEND AUDIO TO BACKEND STARTED ===");
    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append("audio", audioBlob);
      formData.append("availableSlots", JSON.stringify([]));
      console.log("📦 FormData prepared, sending to backend...");

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/voice/process-date`, {
        method: "POST",
        body: formData,
      });

      console.log(`📡 Backend response status: ${res.status}`);
      if (!res.ok) throw new Error(`Backend error: ${res.status}`);
      
      const data = await res.json();
      console.log("🎧 Voice backend FULL result:", JSON.stringify(data, null, 2));

      const {
        botReply,
        audioUrl,
        extractedDate,
        extractedTime,
      } = data;

      console.log(`📊 Extracted values:`, {
        extractedDate,
        extractedTime,
        botReply,
        audioUrl
      });

      // Step 1: Set the date if extracted
      if (extractedDate) {
        console.log(`✅ Date extracted: ${extractedDate}`);
        setDate(extractedDate);
        
        // Step 2: Fetch slots for the extracted date
        if (extractedTime) {
          console.log(`⏰ Time also extracted: ${extractedTime}`);
          console.log(`🔍 Fetching slots for doctorId: ${id}, date: ${extractedDate}`);
          
          try {
            const fetchedSlots = await fetchDoctorSlots(id as string, extractedDate);
            console.log("📅 Fetched slots result:", fetchedSlots);
            console.log(`📊 Number of slots fetched: ${fetchedSlots?.length || 0}`);
            setSlots(fetchedSlots || []);

            // Step 3: Check if the extracted time is available
            const isSlotAvailable = fetchedSlots && fetchedSlots.includes(extractedTime);
            console.log(`🔍 Checking if "${extractedTime}" is in:`, fetchedSlots);
            console.log(`✅ Slot available: ${isSlotAvailable}`);
            
            if (!isSlotAvailable) {
              //  Slot not available — trigger fallback TTS
              console.warn("⚠️⚠️⚠️ SLOT NOT AVAILABLE - TRIGGERING TTS ⚠️⚠️⚠️");

              try {
                const ttsMessage = `Sorry, the time slot ${extractedTime} is not available. Please select from the available slots shown on screen.`;
                console.log("📢 TTS Message:", ttsMessage);
                
                const ttsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/greeting/slot-unavailable-tts`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ message: ttsMessage }),
                });

                console.log(`📡 TTS API response status: ${ttsRes.status}`);
                if (!ttsRes.ok) throw new Error(`TTS backend error: ${ttsRes.status}`);
                
                const ttsData = await ttsRes.json();
                console.log("🤖 TTS API response:", ttsData);

                if (ttsData.audioUrl) {
                  const audioPath = `${process.env.NEXT_PUBLIC_API_URL}${ttsData.audioUrl}?v=${Date.now()}`;
                  console.log("🔊 Playing unavailable slot audio from:", audioPath);
                  const audio = new Audio(audioPath);
                  audio.load();
                  
                  try {
                    await audio.play();
                    console.log("✅✅✅ UNAVAILABLE SLOT AUDIO PLAYED SUCCESSFULLY ✅✅✅");
                  } catch (err) {
                    console.error("❌ Audio play error:", err);
                    console.warn("⚠️ Autoplay blocked for unavailable slot audio");
                  }
                } else {
                  console.warn("⚠️ No audioUrl in TTS response");
                }
              } catch (ttsError) {
                console.error("❌❌❌ TTS REQUEST FAILED:", ttsError);
              }
              
              console.log("🛑 Exiting early - not navigating to booking page");
              return; // Exit early - don't navigate
            }

            // ✅ Slot is available - confirm with TTS then proceed
            console.log("✅✅✅ SLOT IS AVAILABLE - PLAYING CONFIRMATION ✅✅✅");
            setSelectedSlot(extractedTime);

            try {
              const confirmMessage = `Great! Your appointment is confirmed for ${extractedDate} at ${extractedTime}. Let's proceed to the next step.`;
              console.log("📢 Confirmation Message:", confirmMessage);
              
              const confirmRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/greeting/slot-confirmed-tts`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                  message: confirmMessage,
                  date: extractedDate,
                  time: extractedTime
                }),
              });

              console.log(` Confirmation TTS response status: ${confirmRes.status}`);
              if (!confirmRes.ok) throw new Error(`Confirmation TTS error: ${confirmRes.status}`);
              
              const confirmData = await confirmRes.json();
              console.log("🤖 Confirmation TTS response:", confirmData);

              if (confirmData.audioUrl) {
                const audioPath =`${process.env.NEXT_PUBLIC_API_URL}${confirmData.audioUrl}?v=${Date.now()}`;
                console.log("🔊 Playing confirmation audio from:", audioPath);
                const audio = new Audio(audioPath);
                audio.load();
                
                // Wait for audio to finish, then navigate
                audio.onended = () => {
                  console.log("✅ Confirmation audio finished");
                  const bookingUrl = `/patient/book?doctorId=${id}&date=${extractedDate}&time=${extractedTime}`;
                  console.log("🚀 Navigating to:", bookingUrl);
                  router.push(bookingUrl);
                };

                audio.onerror = (err) => {
                  console.error("❌ Confirmation audio error:", err);
                  // Navigate anyway if audio fails
                  const bookingUrl = `/patient/book?doctorId=${id}&date=${extractedDate}&time=${extractedTime}`;
                  router.push(bookingUrl);
                };
                
                try {
                  await audio.play();
                  console.log("✅ Confirmation audio playing");
                } catch (err) {
                  console.error("❌ Audio play error:", err);
                  // Navigate anyway if autoplay blocked
                  const bookingUrl = `/patient/book?doctorId=${id}&date=${extractedDate}&time=${extractedTime}`;
                  router.push(bookingUrl);
                }
              } else {
                console.warn("⚠️ No audioUrl in confirmation response");
                // Navigate anyway if no audio
                const bookingUrl = `/patient/book?doctorId=${id}&date=${extractedDate}&time=${extractedTime}`;
                router.push(bookingUrl);
              }
            } catch (confirmError) {
              console.error("❌❌❌ Confirmation TTS FAILED:", confirmError);
              // Navigate anyway if confirmation fails
              const bookingUrl = `/patient/book?doctorId=${id}&date=${extractedDate}&time=${extractedTime}`;
              router.push(bookingUrl);
            }
            
          } catch (slotError) {
            console.error("❌ Error fetching slots:", slotError);
            alert("Failed to fetch available slots.");
          }
        } else {
          console.log("⚠️ No time extracted, only date");
        }
      } else {
        console.log("⚠️ No date extracted from voice input");
      }

      // ✅ Play standard bot reply if no time was extracted
      if (audioUrl && !extractedTime) {
        console.log("🔊 Playing standard bot reply (no time extracted)");
        const botAudio = new Audio(`${process.env.NEXT_PUBLIC_API_URL}${audioUrl}?v=${Date.now()}`);
        botAudio.play().catch(err => console.warn("Bot audio play error:", err));
      }

    } catch (error) {
      console.error("❌❌❌ CRITICAL ERROR in sendAudioToBackend:", error);
      alert("Failed to process voice input. Please try again.");
    } finally {
      console.log("=== 🏁 SEND AUDIO TO BACKEND COMPLETED ===");
      setIsProcessing(false);
    }
  };

  const handleFetchSlots = async () => {
    if (!date) return;
    setLoading(true);
    setSelectedSlot(null);
    try {
      const data = await fetchDoctorSlots(id as string, date);
      console.log("Fetched data:", data);
      setSlots(data || []);
    } catch (error) {
      console.error("Error fetching slots:", error);
      setSlots([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSlotClick = (slot: string) => {
    setSelectedSlot(slot);
    router.push(`/patient/book?doctorId=${id}&date=${date}&time=${slot}`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorder && mediaRecorder.state !== "inactive") {
        mediaRecorder.stop();
      }
    };
  }, [mediaRecorder]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#5DC4C7] to-cyan-600 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <button
              onClick={() => router.back()}
              className="flex hover:text-slate-800 items-center gap-2 text-white transition-colors mb-4 bg-opacity-20 backdrop-blur-sm px-4 py-2 rounded-lg"
            >
              <FaArrowLeft />
              <span>Back to Doctors</span>
            </button>
            <div className="flex items-center gap-4">
              <div className="bg-opacity-20 backdrop-blur-sm rounded-full p-4">
                <FaUserMd className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2">Book Your Appointment</h1>
                <p className="text-cyan-50 text-lg">Select a date to view available time slots</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Date Selection Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6 md:p-8 mb-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-gradient-to-br from-[#5DC4C7] to-cyan-500 rounded-xl p-3">
              <FaCalendarAlt className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800">Choose Appointment Date</h2>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Select Date
              </label>
              <input
                type="date"
                value={date}
                min={today}
                onChange={(e) => setDate(e.target.value)}
                className="w-full border-2 border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#5DC4C7] focus:border-transparent text-slate-700 font-medium"
              />
            </div>
          </div>

          {date && (
            <div className="mt-4 p-4 bg-gradient-to-r from-cyan-50 to-blue-50 border border-[#5DC4C7] rounded-xl">
              <p className="text-slate-700 font-medium">
                📅 Selected Date: <span className="text-[#5DC4C7] font-bold">{formatDate(date)}</span>
              </p>
            </div>
          )}
        </motion.div>

        {/* Loading State */}
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-2xl shadow-lg border border-slate-100 p-12 text-center"
          >
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#5DC4C7] mx-auto mb-4"></div>
            <p className="text-slate-600 text-lg font-medium">Loading available slots...</p>
          </motion.div>
        )}

        {/* Available Slots */}
        {!loading && slots && slots.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6 md:p-8"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-[#5DC4C7] to-cyan-500 rounded-xl p-3">
                  <FaClock className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">Available Time Slots</h2>
                  <p className="text-slate-600">Click on a slot to book your appointment</p>
                </div>
              </div>
              <div className="bg-gradient-to-r from-cyan-50 to-blue-50 border border-[#5DC4C7] rounded-xl px-4 py-2">
                <span className="text-[#5DC4C7] font-bold text-lg">{slots.length}</span>
                <span className="text-slate-600 ml-1">slots</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {slots.map((slot, index) => (
                <motion.button
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleSlotClick(slot)}
                  className={`group relative overflow-hidden border-2 rounded-xl p-4 transition-all duration-300 ${
                    selectedSlot === slot
                      ? 'border-[#5DC4C7] bg-gradient-to-br from-[#5DC4C7] to-cyan-500 text-white shadow-lg'
                      : 'border-slate-200 bg-white hover:border-[#5DC4C7] hover:bg-gradient-to-br hover:from-cyan-50 hover:to-blue-50'
                  }`}
                >
                  <div className="absolute top-0 right-0 w-16 h-16 bg-white opacity-10 rounded-full -translate-y-8 translate-x-8"></div>
                  <div className="relative z-10 flex flex-col items-center">
                    <FaClock className={`w-5 h-5 mb-2 ${
                      selectedSlot === slot ? 'text-white' : 'text-[#5DC4C7]'
                    }`} />
                    <span className={`text-lg font-bold ${
                      selectedSlot === slot ? 'text-white' : 'text-slate-800'
                    }`}>
                      {slot}
                    </span>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* No Slots Available */}
        {!loading && date && slots && slots.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-2xl shadow-lg border border-slate-100 p-12 text-center"
          >
            <div className="w-24 h-24 bg-gradient-to-br from-orange-100 to-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FaClock className="w-12 h-12 text-orange-500" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-2">No Slots Available</h3>
            <p className="text-slate-600 mb-6">
              Unfortunately, there are no available time slots for the selected date.
            </p>
            <p className="text-slate-500 text-sm">
              Please try selecting a different date or check back later.
            </p>
          </motion.div>
        )}
      </div>

      {/* Voice Assistant Button */}
      <motion.div 
        className="fixed bottom-8 right-8 z-50"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <button
          onClick={handleVoiceClick}
          disabled={isProcessing}
          className={`relative p-5 rounded-full shadow-xl transition-all duration-300 
            ${isRecording
              ? "bg-red-500 hover:bg-red-600 animate-pulse"
              : isProcessing
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-gradient-to-r from-cyan-500 to-[#5DC4C7] hover:from-[#5DC4C7] hover:to-cyan-600"
            } text-white flex items-center justify-center`}
        >
          <FaMicrophone className="w-6 h-6" />
          {isRecording && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500"></span>
            </span>
          )}
        </button>
        <p className="text-xs text-center mt-2 text-slate-600 font-medium select-none">
          {isRecording ? "Recording..." : isProcessing ? "Processing..." : "Voice Booking"}
        </p>
      </motion.div>
    </div>
  );
}