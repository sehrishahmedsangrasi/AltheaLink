

"use client";
export const dynamic = "force-dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { bookAppointment } from "../../../api/patientApi";
import toast from "react-hot-toast";
import { FaMicrophone } from "react-icons/fa";

export default function BookPage() {
  const router = useRouter();
  const params = useSearchParams();

  const doctorId = params.get("doctorId");
  const date = params.get("date");
  const time = params.get("time");

  const [form, setForm] = useState({ 
    name: "", 
    email: "", 
    phone: "",
    symptoms: ""
  });
  const [loading, setLoading] = useState(false);
  
  // Voice states
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlayingGreeting, setIsPlayingGreeting] = useState(false);
  const [hasPlayedGreeting, setHasPlayedGreeting] = useState(false);

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: any) => {
    console.log({
      name: form.name,
      email: form.email,
      phone: form.phone,
      symptoms: form.symptoms,
      doctorId,
      date,
      time
    });

    e.preventDefault();
    setLoading(true);
    try {
      await bookAppointment({ 
        name: form.name,
        email: form.email,
        phone: form.phone,
        symptoms: form.symptoms,
        doctorId: doctorId!, 
        date: date!, 
        time: time! 
      });
      toast.success("Booking confirmed!");
      router.push("/patient/success");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Error booking appointment");
    } finally {
      setLoading(false);
    }
  };

  // Auto-submit when all fields are filled by voice
  const autoSubmitForm = async (extractedData?: any) => {
  setLoading(true);
  try {
    const payload = extractedData || form;

    await bookAppointment({ 
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      symptoms: payload.symptoms,
      doctorId: doctorId!, 
      date: date!, 
      time: time! 
    });

    toast.success("Booking confirmed via voice!");
    router.push("/patient/success");
  } catch (err: any) {
    toast.error(err.response?.data?.message || "Error booking appointment");
  } finally {
    setLoading(false);
  }
};


  // Format date for display
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Format time for display
  const formatTime = (timeStr: string | null) => {
    if (!timeStr) return "";
    return decodeURIComponent(timeStr);
  };

  // VOICE FUNCTIONS
 

  const handleVoiceClick = async () => {
    console.log("🎤 Voice button clicked");

    // If currently recording → stop it
    if (isRecording && mediaRecorder) {
      console.log("🛑 Stopping recording...");
      stopRecording();
      return;
    }

    // Otherwise, check if we need to play greeting
    if (isProcessing || isPlayingGreeting) {
      console.log("⚠️ Already processing or playing greeting");
      return;
    }

    // If greeting has already been played, skip it and start recording directly
    if (hasPlayedGreeting) {
      console.log("⏭️ Greeting already played, starting recording directly...");
      await startRecording();
      return;
    }

    // First time only: Play greeting then start recording
    setIsPlayingGreeting(true);

    try {
      console.log("📡 Fetching greeting audio...");
      const ttsRes = await fetch("http://localhost:5000/api/greeting/patient-info");

      if (!ttsRes.ok) throw new Error(`Greeting API error: ${ttsRes.status}`);

      const { audioUrl } = await ttsRes.json();
      const fullUrl = `http://localhost:5000${audioUrl}`;
      console.log("🔊 Playing greeting from:", fullUrl);

      const audio = new Audio(fullUrl);

      audio.onerror = (e) => {
        console.error("❌ Failed to play greeting audio", e);
        toast.error("Greeting audio could not be played.");
        setIsPlayingGreeting(false);
      };

      // When greeting ends, start recording and mark greeting as played
      audio.onended = async () => {
        console.log("✅ Greeting finished, starting recording...");
        setIsPlayingGreeting(false);
        setHasPlayedGreeting(true);
        await startRecording();
      };

      await audio.play();
    } catch (error) {
      console.error("❌ Voice click error:", error);
      toast.error("Could not start greeting. Please check backend.");
      setIsPlayingGreeting(false);
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
      toast.error("Please allow microphone access.");
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
      formData.append("existingData", JSON.stringify(form));
      console.log("📦 FormData prepared with existing form data:", form);

      const res = await fetch("http://localhost:5000/api/voice/process-patient-info", {
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
        extractedInfo,
        missingFields,
        shouldSubmit
      } = data;

      console.log(`📊 Extracted values:`, {
        extractedInfo,
        missingFields,
        shouldSubmit,
        botReply
      });

      // Update form with extracted data
      if (extractedInfo) {
        const updatedForm = {
          name: extractedInfo.name || form.name,
          email: extractedInfo.email || form.email,
          phone: extractedInfo.phone || form.phone,
          symptoms: extractedInfo.symptoms || form.symptoms
        };
        
        console.log("📝 Updating form with extracted data:", updatedForm);
        setForm(updatedForm);

        // Show toast for extracted fields
        const extractedFields = [];
        if (extractedInfo.name && extractedInfo.name !== form.name) extractedFields.push("Name");
        if (extractedInfo.email && extractedInfo.email !== form.email) extractedFields.push("Email");
        if (extractedInfo.phone && extractedInfo.phone !== form.phone) extractedFields.push("Phone");
        if (extractedInfo.symptoms && extractedInfo.symptoms !== form.symptoms) extractedFields.push("Symptoms");
        
        if (extractedFields.length > 0) {
          toast.success(`Captured: ${extractedFields.join(", ")}`);
        }
      }

      // Play bot reply audio
      if (audioUrl) {
        console.log("🔊 Playing bot reply audio");
        const botAudio = new Audio(`http://localhost:5000${audioUrl}?v=${Date.now()}`);
        
        botAudio.onended = async () => {
          console.log("✅ Bot audio finished");
          
          // If all fields captured, auto-submit after audio finishes
          if (shouldSubmit) {
            console.log("✅ ALL FIELDS CAPTURED - AUTO-SUBMITTING FORM");
            setTimeout(() => {
              autoSubmitForm(extractedInfo); // pass extracted info directly
            }, 1000);
          }

        };

        botAudio.onerror = (err) => {
          console.error("❌ Bot audio error:", err);
          // Still auto-submit if shouldSubmit is true
          if (shouldSubmit) {
            autoSubmitForm();
          }
        };
        
        try {
          await botAudio.play();
          console.log("✅ Bot audio playing");
        } catch (err) {
          console.error("❌ Audio play error:", err);
          console.warn("⚠️ Autoplay blocked for bot audio");
          // Still auto-submit if shouldSubmit is true
          if (shouldSubmit && extractedInfo) {
          autoSubmitForm(extractedInfo);
        }

        }
      } else if (shouldSubmit) {
        // No audio but should submit
        autoSubmitForm();
      }

    } catch (error) {
      console.error("❌❌❌ CRITICAL ERROR in sendAudioToBackend:", error);
      toast.error("Failed to process voice input. Please try again.");
    } finally {
      console.log("=== 🏁 SEND AUDIO TO BACKEND COMPLETED ===");
      setIsProcessing(false);
    }
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
    <div className="min-h-screen flex items-center justify-center px-4 py-8" style={{ backgroundColor: '#E1E9F1' }}>
      <div className="w-full max-w-lg">
        {/* Header Card */}
        <div className="text-center mb-6">
          <div className="inline-block p-3 rounded-2xl mb-4" style={{ backgroundColor: '#5DC4C7' }}>
            <svg className="w-12 h-12" style={{ color: '#FFFFFF' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: '#06434D' }}>
            Book Your Appointment
          </h1>
          <p className="text-sm opacity-70" style={{ color: '#06434D' }}>
            Fill in your details to confirm your booking
          </p>
        </div>

        {/* Main Form Card */}
        <div className="rounded-3xl shadow-2xl p-8 relative" style={{ backgroundColor: '#FFFFFF' }}>
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Selected Date & Time - Read Only */}
            <div className="rounded-2xl p-5 border-2" style={{ 
              backgroundColor: '#E1E9F1', 
              borderColor: '#5DC4C7' 
            }}>
              <div className="flex items-start gap-3 mb-3">
                <svg className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: '#5DC4C7' }} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
                <div className="flex-1">
                  <label className="text-xs font-semibold uppercase tracking-wide mb-1 block" style={{ color: '#06434D' }}>
                    Selected Date
                  </label>
                  <p className="text-base font-medium" style={{ color: '#06434D' }}>
                    {formatDate(date)}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: '#5DC4C7' }} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                <div className="flex-1">
                  <label className="text-xs font-semibold uppercase tracking-wide mb-1 block" style={{ color: '#06434D' }}>
                    Selected Time
                  </label>
                  <p className="text-base font-medium" style={{ color: '#06434D' }}>
                    {formatTime(time)}
                  </p>
                </div>
              </div>
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#06434D' }}>
                Full Name *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="w-5 h-5" style={{ color: '#5DC4C7' }} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
                <input
                  name="name"
                  placeholder="Enter your full name"
                  value={form.name}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3 rounded-xl border-2 transition-all duration-200 focus:outline-none focus:ring-2"
                  style={{ 
                    borderColor: '#E1E9F1',
                    color: '#06434D'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#5DC4C7';
                    e.target.style.boxShadow = '0 0 0 3px rgba(93, 196, 199, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#E1E9F1';
                    e.target.style.boxShadow = 'none';
                  }}
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#06434D' }}>
                Email Address *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="w-5 h-5" style={{ color: '#5DC4C7' }} fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                </div>
                <input
                  name="email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={form.email}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3 rounded-xl border-2 transition-all duration-200 focus:outline-none focus:ring-2"
                  style={{ 
                    borderColor: '#E1E9F1',
                    color: '#06434D'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#5DC4C7';
                    e.target.style.boxShadow = '0 0 0 3px rgba(93, 196, 199, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#E1E9F1';
                    e.target.style.boxShadow = 'none';
                  }}
                  required
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#06434D' }}>
                Phone Number *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="w-5 h-5" style={{ color: '#5DC4C7' }} fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                  </svg>
                </div>
                <input
                  name="phone"
                  type="tel"
                  placeholder="+92 0123456789"
                  value={form.phone}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3 rounded-xl border-2 transition-all duration-200 focus:outline-none focus:ring-2"
                  style={{ 
                    borderColor: '#E1E9F1',
                    color: '#06434D'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#5DC4C7';
                    e.target.style.boxShadow = '0 0 0 3px rgba(93, 196, 199, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#E1E9F1';
                    e.target.style.boxShadow = 'none';
                  }}
                  required
                />
              </div>
            </div>

            {/* Symptoms Description */}
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#06434D' }}>
                Description of Symptoms *
              </label>
              <div className="relative">
                <div className="absolute top-3 left-0 pl-4 pointer-events-none">
                  <svg className="w-5 h-5" style={{ color: '#5DC4C7' }} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                  </svg>
                </div>
                <textarea
                  name="symptoms"
                  placeholder="Please describe your symptoms in detail..."
                  value={form.symptoms}
                  onChange={handleChange}
                  rows={4}
                  className="w-full pl-12 pr-4 py-3 rounded-xl border-2 transition-all duration-200 focus:outline-none focus:ring-2 resize-none"
                  style={{ 
                    borderColor: '#E1E9F1',
                    color: '#06434D'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#5DC4C7';
                    e.target.style.boxShadow = '0 0 0 3px rgba(93, 196, 199, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#E1E9F1';
                    e.target.style.boxShadow = 'none';
                  }}
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-6 rounded-xl font-semibold text-lg shadow-lg transform transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              style={{ 
                backgroundColor: '#5DC4C7',
                color: '#FFFFFF'
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Booking...
                </span>
              ) : (
                "Confirm Appointment"
              )}
            </button>

            <p className="text-xs text-center opacity-60 mt-4" style={{ color: '#06434D' }}>
              By confirming, you agree to receive appointment reminders via email and SMS
            </p>
          </form>
        </div>
      </div>

      {/* Voice Assistant Button */}
      <div className="fixed bottom-8 right-8 z-50 flex flex-col items-center">
        <button
          onClick={handleVoiceClick}
          disabled={isProcessing || loading}
          className={`relative p-5 rounded-full shadow-xl transition-all duration-300 
            ${isRecording
              ? "bg-red-500 hover:bg-red-600 animate-pulse"
              : isProcessing || isPlayingGreeting
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-gradient-to-r from-cyan-500 to-[#5DC4C7] hover:from-[#5DC4C7] hover:to-cyan-600"
            } text-white flex items-center justify-center transform hover:scale-110 active:scale-95`}
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
          {isRecording 
            ? "Recording..." 
            : isPlayingGreeting 
            ? "Listening..." 
            : isProcessing 
            ? "Processing..." 
            : "Voice Input"}
        </p>
      </div>
    </div>
  );
}