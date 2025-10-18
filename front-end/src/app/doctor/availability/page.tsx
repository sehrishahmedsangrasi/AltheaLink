"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  getSlots,
  setAvailability,
  verifyDoctorToken,
} from "@/api/doctorApi";
import type { Slot } from "@/types/doctor";
import { Calendar, Clock, Save, Check, X } from "lucide-react";



function slotsToRanges(selected: string[]) {
  
  const sorted = [...selected].sort((a, b) => {
    const [ah, am] = a.split(":").map(Number);
    const [bh, bm] = b.split(":").map(Number);
    return ah * 60 + am - (bh * 60 + bm);
  });

  return sorted.map((slot) => {
    const [h, m] = slot.split(":").map(Number);
    const start = slot;
    const endMinutes = h * 60 + m + 30;

    const endH = String(Math.floor(endMinutes / 60)).padStart(2, "0");
    const endM = String(endMinutes % 60).padStart(2, "0");
    const end = `${endH}:${endM}`;

    return { start, end };
  });
}


export default function AvailabilityPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [date, setDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  ); 

  
  useEffect(() => {
    const checkAuth = async () => {
      const doctorInfo = localStorage.getItem("doctorInfo");
      if (!doctorInfo) {
        router.push("/doctor/login");
        return;
      }

      const { token } = JSON.parse(doctorInfo);
      const verify = await verifyDoctorToken(token);
      if (!verify.valid) {
        localStorage.removeItem("doctorInfo");
        router.push("/doctor/login");
        return;
      }

      
      const { data } = await getSlots(date);
      setSlots(data);
      setSelected(
        data.filter((s: Slot) => s.status === "available").map((s: Slot) => s.time)
      );

      setLoading(false);
    };

    checkAuth();
  }, [router, date]);

  
  const toggleSlot = (time: string, status: string) => {
    if (status === "booked") return; 
    setSelected((prev) =>
      prev.includes(time) ? prev.filter((t) => t !== time) : [...prev, time]
    );
  };

const handleSave = async () => {
  setSaving(true);
  try {
    const ranges = slotsToRanges(selected);

    await setAvailability(date, ranges);

    
    const { data } = await getSlots(date);
    setSlots(data);

  } catch (err) {
    console.error("Save failed:", err);
  } finally {
    setSaving(false);
  }
};


  const getSlotStyle = (slot: Slot) => {
    if (slot.status === "booked") {
      return "bg-red-100 border-red-300 text-red-700 cursor-not-allowed";
    }
    if (selected.includes(slot.time)) {
      return "bg-[#5DC4C7] border-[#5DC4C7] text-white shadow-lg transform scale-105 cursor-pointer";
    }
    return "bg-white border-gray-200 text-[#06434D] hover:border-[#5DC4C7] hover:bg-[#5DC4C7]/10 cursor-pointer";
  };

  const getSlotIcon = (slot: Slot) => {
    if (slot.status === "booked") {
      return <X className="w-4 h-4" />;
    }
    if (selected.includes(slot.time)) {
      return <Check className="w-4 h-4" />;
    }
    return <Clock className="w-4 h-4" />;
  };

  if (loading) {return(
      <div style={{ backgroundColor: '#E1E9F1' }} className="min-h-screen flex items-center justify-center">
        <div className="bg-white rounded-xl p-8 shadow-lg">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5DC4C7] mx-auto"></div>
          <p className="text-[#06434D] mt-4 text-center">Loading availability...</p>
        </div>
      </div>
    );}

  return (
    <div style={{ backgroundColor: '#E1E9F1' }} className="min-h-screen">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
            {/* Left side → Icon + Title */}
            <div className="flex items-center gap-3">
                <div className="bg-[#5DC4C7] p-2 rounded-lg">
                <Calendar className="w-6 h-6 text-white" />
                </div>
                <div>
                <h1 className="text-2xl font-bold text-[#06434D]">Manage Availability</h1>
                <p className="text-gray-600 text-sm">
                    Set your available time slots for appointments
                </p>
                </div>
            </div>

            {/* Right side → Logout button */}
           <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              localStorage.removeItem("doctorInfo");
              router.push("/doctor/sign-in");
            }}
            className="relative overflow-hidden px-4 py-2 md:px-6 md:py-3 rounded-xl bg-slate-800 text-white font-semibold shadow-lg text-sm md:text-base whitespace-nowrap group"
          >
            <span className="relative z-10">Sign Out</span>
            {/* fill effect layer */}
            <span className="absolute inset-0 bg-[var(--color-primary)] scale-x-0 origin-left transition-transform duration-300 ease-out group-hover:scale-x-100"></span>
          </motion.button>
            </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Panel - Controls */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-8">
              <h2 className="text-lg font-semibold text-[#06434D] mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#5DC4C7]" />
                Select Date
              </h2>
              
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#5DC4C7] focus:outline-none transition-colors text-[#06434D] font-medium"
              />

              {/* Legend */}
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-[#06434D] mb-3">Legend</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-[#5DC4C7] rounded"></div>
                    <span className="text-sm text-gray-600">Available</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-white border-2 border-gray-200 rounded"></div>
                    <span className="text-sm text-gray-600">Unavailable</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-red-100 border-2 border-red-300 rounded"></div>
                    <span className="text-sm text-gray-600">Booked</span>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="mt-6 p-4 bg-[#E1E9F1] rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-[#5DC4C7]">{selected.length}</div>
                    <div className="text-xs text-gray-600">Available</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-500">
                      {slots.filter(s => s.status === 'booked').length}
                    </div>
                    <div className="text-xs text-gray-600">Booked</div>
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full mt-6 px-6 py-4 bg-[#5DC4C7] text-white rounded-lg hover:bg-[#4db3b6] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 font-semibold shadow-lg hover:shadow-xl"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Availability
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Panel - Time Slots */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-lg font-semibold text-[#06434D] mb-6 flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#5DC4C7]" />
                Time Slots for {new Date(date).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </h2>

              {slots.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No time slots available for this date</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {slots.map((slot) => (
                    <div
                      key={slot.time}
                      onClick={() => toggleSlot(slot.time, slot.status)}
                      className={`
                        ${getSlotStyle(slot)}
                        border-2 rounded-lg p-4 text-center transition-all duration-200
                        flex flex-col items-center gap-2 min-h-[80px] justify-center
                        hover:shadow-md
                      `}
                    >
                      {getSlotIcon(slot)}
                      <span className="text-sm font-semibold">
                        {slot.time}
                      </span>
                      {slot.status === 'booked' && (
                        <span className="text-xs opacity-75">Booked</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-[98%]">
       <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6"
            >
              {[
                { name: "Dashboard", route: "/doctor/dashboard", color: "from-[#5DC4C7] to-cyan-500" },
                { name: "Appointments", route: "/doctor/appointment", color:"from-[#5DC4C7] to-cyan-500" },
                { name: "Calendar", route: "/doctor/calendar", color: "from-[#5DC4C7] to-cyan-500" },
              ].map((action, idx) => (
                <motion.button
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + idx * 0.1 }}
                  whileHover={{ scale: 1.05, y: -5 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => router.push(action.route)}
                  className="group relative overflow-hidden"
                >
                  <div className={`p-4 md:p-6 rounded-2xl bg-gradient-to-r ${action.color} text-white font-semibold text-base md:text-lg shadow-xl transition-all duration-300 hover:shadow-2xl`}>
                    <div className="flex items-center justify-center relative z-10">
                      <span>{action.name}</span>
                    </div>
                    <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                  </div>
                </motion.button>
              ))}
            </motion.div>
          </div>
    </div>
  );
}