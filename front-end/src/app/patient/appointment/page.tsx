

"use client";
import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { FaUserMd, FaSearch, FaFilter, FaCalendarAlt, FaMicrophone } from "react-icons/fa";
import { fetchDoctors } from "../../../api/patientApi";
import Link from "next/link";
import type { Doctor } from "../../../types/patient";
import Navbar from "../../../components/nav";


export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedSpecialization, setSelectedSpecialization] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>("name");
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [hasGreeted, setHasGreeted] = useState(false);

  
 useEffect(() => {
  fetchDoctors()
    .then((data) => {
      
      const doctorsWithIds = data.map((doc: Doctor, index: number) => ({
        ...doc,
        displayId: `D${index + 1}`,
      }));
      setDoctors(doctorsWithIds);
    })
    .finally(() => setLoading(false));
}, []);


  // Play greeting 
  const playGreeting = async () => {
    try {
      console.log("🎵 Fetching greeting from backend...");
      const res = await fetch("http://localhost:5000/api/greeting/greet");
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      console.log("Greeting response:", data);
      
      if (data.audioUrl) {
        // Stop any existing audio
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current = null;
        }

        const audioUrl = `http://localhost:5000${data.audioUrl}?t=${Date.now()}`;
        console.log("Playing audio from:", audioUrl);
        
        const audio = new Audio(audioUrl);
        audioRef.current = audio;
        
        // Wait for greeting to finish before starting recording
        return new Promise<void>((resolve) => {
          audio.onloadeddata = () => {
            console.log("✅ Audio loaded successfully");
          };
          
          audio.onplay = () => {
            console.log("▶️ Audio started playing");
          };
          
          audio.onended = () => {
            console.log("✅ Audio finished playing");
            audioRef.current = null;
            resolve();
          };
          
          audio.onerror = (e) => {
            console.error("❌ Audio playback error:", e);
            console.error("Audio error details:", audio.error);
            resolve(); 
          };
          
          audio.play().catch((err) => {
            console.error("❌ Failed to play audio:", err);
            resolve();
          });
        });
      } else {
        console.warn("No audioUrl in response");
      }
    } catch (err) {
      console.error("❌ Failed to fetch greeting:", err);
    }
  };

  //  Handle mic button click
  const handleMicClick = async () => {
  if (isRecording) {
    stopRecording();
    return;
  }

  setIsProcessing(true);

  //  Play greeting ONLY on the first mic click after page visit
  if (!hasGreeted) {
    await playGreeting();
    setHasGreeted(true);
  }

  setIsProcessing(false);
  startRecording();
};

 

  //  Start recording with WAV format for better compatibility
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      });
      
      // Try to use WAV format, fallback to webm if not available
      let mimeType = 'audio/webm;codecs=opus';
      if (MediaRecorder.isTypeSupported('audio/wav')) {
        mimeType = 'audio/wav';
      } else if (MediaRecorder.isTypeSupported('audio/webm')) {
        mimeType = 'audio/webm';
      }
      
      console.log(`🎙️ Recording with MIME type: ${mimeType}`);
      
      const recorder = new MediaRecorder(stream, { mimeType });
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
          console.log(`📦 Chunk received: ${e.data.size} bytes`);
        }
      };
      
      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: mimeType });
        console.log(`🎵 Recording complete: ${audioBlob.size} bytes, type: ${audioBlob.type}`);
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
        
        await sendAudioToBackend(audioBlob);
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      console.log("🎙️ Recording started...");
    } catch (err) {
      console.error("Failed to start recording:", err);
      alert("Microphone access denied. Please allow microphone permissions.");
    }
  };

  // 🛑 Stop recording
  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      console.log("🛑 Stopping recording...");
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };
   const specializationAliases = {
  cardiologist: ["cardiologist", "heart", "heart specialist"],
  dermatologist: ["dermatologist", "skin", "skin specialist"],
  neurologist: ["neurologist", "brain", "brain specialist"],
  pulmonologist: ["pulmonologist", "lung", "lung specialist"],
  nephrologist: ["nephrologist", "kidney", "kidney specialist"],
  obstetrician: ["obstetrician", "pregnancy", "childbirth", "obstetrics"],
  rheumatologist: ["rheumatologist", "arthritis", "joint"],
  pediatrician: ["pediatrician", "child", "kids", "child specialist"],
};


//  Send audio to backend
const sendAudioToBackend = async (audioBlob: Blob) => {
  setIsProcessing(true);
  try {
    console.log(`📤 Sending audio to backend: ${audioBlob.size} bytes`);

    const formData = new FormData();
    formData.append("audio", audioBlob, "recording.webm");

    const res = await fetch("http://localhost:5000/api/voice/process", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      throw new Error("Failed to process audio");
    }

    const data = await res.json();
    console.log("✅ Backend response:", data);
    console.log("Bot reply:", data.botReply);
    console.log("Intent:", data.intent);
    console.log("Is error:", data.isError);

    //  Handle recognized intent from backend
    if (data.intent === "select_specialization") {
      const lower = data.transcription?.toLowerCase() || "";
      let matchedSpecialization = null;

      // Loop through all aliases
      for (const [spec, aliases] of Object.entries(specializationAliases)) {
        if (aliases.some(alias => lower.includes(alias))) {
          matchedSpecialization = spec;
          break;
        }
      }

      if (matchedSpecialization) {
        console.log("🎯 Selecting specialization:", matchedSpecialization);
        setSelectedSpecialization(matchedSpecialization);
      } else {
        console.warn("⚠️ No specialization matched in transcription:", lower);
      }
    } 
    else if (data.intent === "select_doctor") {
      const doctorIdFromBackend = data.doctorId; // Use normalized ID from backend
      console.log("🧠 Normalized doctor ID from backend:", doctorIdFromBackend);

      if (doctorIdFromBackend) {
        const shortId = `D${doctorIdFromBackend}`;
        const realId = idMap[shortId];

        if (realId) {
          console.log(`✅ Auto-booking Doctor ${shortId} (${realId})`);
          handleBook(realId);
        } else {
          console.warn("⚠️ No doctor found for short ID:", shortId);
        }
      } else {
        console.warn("⚠️ Could not extract doctor ID from backend data:", data);
      }
    }

    //  Play the bot’s TTS reply
    if (data.audioUrl) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      const audio = new Audio(`http://localhost:5000${data.audioUrl}?t=${Date.now()}`);
      audioRef.current = audio;

      audio.play().catch(err => console.error("🎧 Audio play error:", err));
      audio.onerror = e => console.error("🎧 Playback error:", e);
      audio.onended = () => {
        audioRef.current = null;
      };
    }

  } catch (err) {
    console.error("❌ Failed to send audio:", err);
    alert("Failed to process voice command. Please try again.");
  } finally {
    setIsProcessing(false);
  }
};


  
    //  Map short IDs (D1, D2, etc.) to real doctor _ids
    const idMap = (doctors || []).reduce((acc: Record<string, string>, doc: any) => {
    if (doc.displayId && doc._id) acc[doc.displayId] = doc._id;
    return acc;
  }, {});




    const handleBook = (doctorId: string) => {
    console.log("Booking appointment for Doctor ID:", doctorId);
    window.location.href = `/patient/doctors/${doctorId}`;
  };



  const specializations = [
    { name: "Cardiologist", img: "/heart.png", desc: "Heart specialist", color: "from-red-500 to-pink-500" },
    { name: "Neurologist", img: "/brainstorm.png", desc: "Brain specialist", color: "from-purple-500 to-indigo-500" },
    { name: "Pulmonologist", img: "/lungs.png", desc: "Lungs specialist", color: "from-blue-500 to-cyan-500" },
    { name: "Dermatologist", img: "/care.png", desc: "Skin specialist", color: "from-green-500 to-emerald-500" },
    { name: "Nephrologist", img: "/kidney.png", desc: "Kidney specialist", color: "from-yellow-500 to-orange-500" },
    { name: "Obstetrician", img: "/Obstetrics.png", desc: "Pregnancy & childbirth", color: "from-pink-500 to-rose-500" },
    { name: "Rheumatologist", img: "/arthritis.png", desc: "Arthritis & joints", color: "from-indigo-500 to-purple-500" },
    { name: "Pediatrician", img: "/pediatric.png", desc: "Child specialist", color: "from-cyan-500 to-blue-500" },
  ];
 
  const filteredDoctors = doctors
    .filter((doc) => {
      const matchesName = doc.name.toLowerCase().includes(search.toLowerCase());
      const matchesSpec = selectedSpecialization
        ? doc.specialization?.toLowerCase() === selectedSpecialization.toLowerCase()
        : true;
      return matchesName && matchesSpec;
    })
    .sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      return 0;
    });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl p-8 shadow-2xl border border-slate-200"
        >
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto"></div>
          <p className="text-slate-700 mt-4 text-center font-medium">Loading doctors...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50">
      <Navbar whiteBg={true} />
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[#5DC4C7] to-cyan-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="flex justify-center mb-4">
              <div className="bg-opacity-20 backdrop-blur-sm rounded-full p-4">
                <FaUserMd className="w-12 h-12" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Our Expert Doctors</h1>
            <p className="text-lg md:text-xl text-cyan-50 max-w-2xl mx-auto">
              Find the right healthcare professional for your needs
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filter Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6 mb-8"
        >
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search doctors by name..."
                className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5DC4C7] focus:border-transparent shadow-sm"
              />
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <FaFilter className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="pl-12 pr-8 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5DC4C7] focus:border-transparent shadow-sm appearance-none bg-white cursor-pointer w-full lg:w-auto"
              >
                <option value="name">Sort by Name</option>
              </select>
            </div>
          </div>

          {/* Specialization Filter with Flip Cards */}
          <div>
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Filter by Specialization</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {specializations.map((spec) => (
                <div
                  key={spec.name}
                  onClick={() =>
                    setSelectedSpecialization(
                      selectedSpecialization === spec.name ? null : spec.name
                    )
                  }
                  className={`group [perspective:1000px] cursor-pointer transition-all duration-300 hover:scale-105 ${
                    selectedSpecialization === spec.name ? 'scale-105' : ''
                  }`}
                >
                  <div
                    className={`relative w-full h-32 rounded-xl shadow-md border-2 transition-transform duration-500 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)] ${
                      selectedSpecialization === spec.name
                        ? "border-[#5DC4C7] shadow-lg bg-gradient-to-br from-cyan-50 to-blue-50"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    {/* Front side */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center backface-hidden">
                      <img src={spec.img} alt={spec.name} className="w-12 h-12 mb-2 filter drop-shadow-sm" />
                      <p className="text-sm font-medium text-slate-700 text-center leading-tight px-2">{spec.name}</p>
                    </div>

                    {/* Back side */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center rounded-xl bg-gradient-to-br from-[#5DC4C7] to-cyan-600 text-white text-sm font-medium [transform:rotateY(180deg)] backface-hidden px-2 shadow-lg">
                      <img src={spec.img} alt={spec.name} className="w-12 h-12 mb-2 filter brightness-0 invert drop-shadow-md" />
                      <p className="text-center font-semibold">{spec.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {selectedSpecialization && (
              <div className="mt-4 flex items-center justify-between bg-gradient-to-r from-cyan-50 to-blue-50 border border-[#5DC4C7] rounded-xl p-3">
                <span className="text-slate-800 font-medium">
                  Showing: {selectedSpecialization}
                </span>
                <button
                  onClick={() => setSelectedSpecialization(null)}
                  className="text-[#5DC4C7] hover:text-slate-800 font-medium text-sm transition-colors"
                >
                  Clear filter
                </button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Voice Assistant Button */}
        <motion.div 
          className="fixed bottom-8 right-8 z-50"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <button
            onClick={handleMicClick}
            disabled={isProcessing}
            className={`relative p-5 rounded-full shadow-2xl transition-all duration-300 ${
              isRecording
                ? "bg-red-500 hover:bg-red-600 animate-pulse"
                : isProcessing
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-[#5DC4C7] to-cyan-600 hover:from-cyan-600 hover:to-cyan-700"
            } text-white`}
          >
            <FaMicrophone className="w-6 h-6" />
            {isRecording && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500"></span>
              </span>
            )}
          </button>
          <p className="text-xs text-center mt-2 text-slate-600 font-medium">
            {isRecording ? "Recording..." : isProcessing ? "Processing..." : "Voice Search"}
          </p>
        </motion.div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-slate-600 font-medium">
            Showing <span className="text-[#5DC4C7] font-bold">{filteredDoctors.length}</span>{" "}
            {filteredDoctors.length === 1 ? "doctor" : "doctors"}
          </p>
        </div>

        {/* Doctors Grid */}
        {filteredDoctors.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDoctors.map((doc, index) => (
              <motion.div
                key={doc._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -8, scale: 1.02 }}
              >
                <Link
                  href={`/patient/doctors/${doc._id}`}
                  className="block bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden hover:shadow-2xl transition-all duration-300"
                >
                  {/* Card Header with Gradient */}
                  <div className="bg-gradient-to-r from-[#5DC4C7] to-cyan-500 p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -translate-y-16 translate-x-16"></div>
                    <div className="relative z-10 flex items-center space-x-4">
                      {doc.picture ? (
                        <img
                          src={doc.picture}
                          alt={doc.name}
                          className="w-16 h-16 rounded-full object-cover border-4 border-white shadow-lg"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg">
                          <span className="text-[#5DC4C7] font-bold text-xl">
                            {doc.name.split(" ").map((word) => word[0]).join("")}
                          </span>
                        </div>
                      )}
                      <div>
                        <h2 className="text-xl font-bold text-white">{doc.name}</h2>
                        <p className="text-cyan-50 text-sm">{doc.specialization}</p>
                      </div>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-6">
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">Specialization</span>
                        <span className="font-semibold text-slate-800">{doc.specialization || "General"}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">Doctor ID</span>
                        <span className="font-semibold text-slate-800">{doc?.displayId || "N/A"}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">Patients Served</span>
                        <span className="font-semibold text-slate-800">{doc?.patientCount || "0"}</span>
                      </div>
                       <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">Fee</span>
                        <span className="font-bold text-red-400 ">{doc?.fee || "0"}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">Status</span>
                        <span className={`font-semibold ${doc.isActive ? 'text-green-600' : 'text-gray-600'}`}>
                          {doc.isActive ? 'Available' : 'Unavailable'}
                        </span>
                      </div>
                    </div>

                    {/* Book Button */}
                    <div className="w-full py-3 bg-gradient-to-r from-[#5DC4C7] to-cyan-500 text-white font-semibold rounded-xl hover:from-cyan-600 hover:to-cyan-700 transition-all shadow-md flex items-center justify-center gap-2">
                      <FaCalendarAlt />
                      <span>Book Appointment</span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-2xl shadow-lg border border-slate-100 p-12 text-center"
          >
            <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FaUserMd className="w-12 h-12 text-slate-400" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-2">No Doctors Found</h3>
            <p className="text-slate-600 mb-6">
              Try adjusting your search or filter criteria
            </p>
            <button
              onClick={() => {
                setSearch("");
                setSelectedSpecialization(null);
              }}
              className="px-6 py-3 bg-gradient-to-r from-[#5DC4C7] to-cyan-500 text-white font-semibold rounded-xl hover:from-cyan-600 hover:to-cyan-700 transition-all shadow-md"
            >
              Clear Filters
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}