
"use client";
import { motion } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";

import {
  getDoctorStats,
  verifyDoctorToken,
  getDoctorProfile,
  getAppointments,
  changeDoctorPassword,
  updateDoctorPicture,
} from "../../../api/doctorApi";
import type { Appointment } from "../../../types/doctor";
import { FaUserCircle, FaCalendarCheck, FaStethoscope, FaClock, FaUserMd } from "react-icons/fa";



export default function DoctorDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [doctor, setDoctor] = useState<any>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  // profile UI state
  const [panelOpen, setPanelOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [pictureUrlInput, setPictureUrlInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<string | null>(null);

  // change password state
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwdError, setPwdError] = useState<string | null>(null);
  const [pwdSuccess, setPwdSuccess] = useState<string | null>(null);
  const [pwdLoading, setPwdLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
  const validateDoctor = async () => {
    const stored = localStorage.getItem("doctorInfo");
    if (!stored) {
      router.push("/doctor/sign-in");
      return;
    }

    try {
      const { token } = JSON.parse(stored);

      
      const verify = await verifyDoctorToken(token);
      if (!verify?.valid) {
        throw new Error("Token invalid");
      }

     
      await Promise.all([fetchProfile(), fetchStats(), fetchAppointments()]);
    } catch (err) {
      console.error("Doctor validation failed:", err);
      localStorage.removeItem("doctorInfo");
      router.push("/doctor/sign-in");
    } finally {
      setLoading(false);
    }
  };

  validateDoctor();

  const handleClickOutside = (e: MouseEvent) => {
    if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
      setPanelOpen(false);
    }
  };
  document.addEventListener("mousedown", handleClickOutside);
  return () => document.removeEventListener("mousedown", handleClickOutside);
}, [router]);


  const fetchProfile = async () => {
    try {
      const res = await getDoctorProfile();
      setDoctor(res.data);
    } catch (err) {
      console.error("Error fetching doctor profile:", err);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await getDoctorStats();
      setStats(res.data);
    } catch (err) {
      console.error("Error fetching doctor stats:", err);
    }
  };

  const fetchAppointments = async () => {
    try {
      const res = await getAppointments();
      setAppointments(res.data);
    } catch (err) {
      console.error("Error fetching appointments:", err);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadMsg(null);
    const f = e.target.files?.[0] ?? null;
    if (!f) return;
    setFile(f);
    const url = URL.createObjectURL(f);
    setPreview(url);
  };

  const fileToBase64 = (f: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(f);
    });

    

  const handleUploadPicture = async () => {
    setUploadMsg(null);
    setUploading(true);
    try {
      const tokenObj = (() => {
        try {
          return JSON.parse(String(localStorage.getItem("doctorInfo")));
        } catch {
          return null;
        }
      })();
      const token = tokenObj?.token;
      if (!token) throw new Error("Not authenticated");

      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

      if (file) {
        if (cloudName && uploadPreset) {
          const fd = new FormData();
          fd.append("file", file);
          fd.append("upload_preset", uploadPreset);

          const cloudRes = await fetch(
            `https://api.cloudinary.com/v1_1/${cloudName}/upload`,
            { method: "POST", body: fd }
          );
          const cloudData = await cloudRes.json();
          if (!cloudRes.ok) {
            throw new Error(cloudData?.error?.message || "Cloud upload failed");
          }
          const secure_url = cloudData.secure_url;
          await updateDoctorPicture(secure_url);
        } else {
          const base64 = await fileToBase64(file);
          await updateDoctorPicture(base64);
        }
      } else if (pictureUrlInput.trim()) {
        await updateDoctorPicture(pictureUrlInput.trim());
      } else {
        throw new Error("Choose a file or paste an image URL first.");
      }

      await fetchProfile();
      setUploadMsg("Profile picture updated successfully.");

      setFile(null);
      setPreview(null);
      setPictureUrlInput("");
    } catch (err: any) {
      console.error("Upload failed", err);
      setUploadMsg(err?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePicture = async () => {
  setUploadMsg(null);
  setUploading(true);
  try {
    const tokenObj = (() => {
      try {
        return JSON.parse(String(localStorage.getItem("doctorInfo")));
      } catch {
        return null;
      }
    })();
    const token = tokenObj?.token;
    if (!token) throw new Error("Not authenticated");

    
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/doctor/remove/picture`, {
      method:  "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) throw new Error("Failed to remove picture");

    await fetchProfile();
    setUploadMsg("Profile picture removed successfully.");
  } catch (err: any) {
    console.error("Remove picture failed", err);
    setUploadMsg(err?.message || "Remove failed");
  } finally {
    setUploading(false);
  }
};


  const handleChangePassword = async (e: React.FormEvent) => {
  e.preventDefault();
  setPwdError(null);
  setPwdSuccess(null);

  if (!oldPassword || !newPassword || !confirmPassword) {
    setPwdError("All fields are required");
    return;
  }

  if (newPassword !== confirmPassword) {
    setPwdError("New password and confirm password do not match");
    return;
  }

  try {
    setPwdLoading(true); 
    await changeDoctorPassword(oldPassword, newPassword);
    setPwdSuccess("Password updated successfully");
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
  } catch (err: any) {
    console.error("Change password error", err);
    setPwdError(err.response?.data?.message || "Failed to change password");
  } finally {
    setPwdLoading(false); 
  }
};


  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl p-8 shadow-2xl border border-slate-200"
        >
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto"></div>
          <p className="text-slate-700 mt-4 text-center font-medium">Loading dashboard...</p>
        </motion.div>
      </div>
    );
  }

  const statCards = [
    { 
      title: "Total Appointments", 
      value: stats?.totalAppointments || 0, 
      icon: FaCalendarCheck, 
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50",
      textColor: "text-blue-600"
    },
    { 
      title: "Today's Appointments", 
      value: stats?.todayAppointments || 0, 
      icon: FaClock, 
      color: "from-emerald-500 to-emerald-600",
      bgColor: "bg-emerald-50",
      textColor: "text-emerald-600"
    },
    { 
      title: "Completed", 
      value: stats?.completedAppointments || 0, 
      icon: FaStethoscope, 
      color: "from-teal-500 to-teal-600",
      bgColor: "bg-teal-50",
      textColor: "text-teal-600"
    },
    { 
      title: "Missed", 
      value: stats?.missedAppointments || 0, 
      icon: FaUserMd, 
      color: "from-rose-500 to-rose-600",
      bgColor: "bg-rose-50",
      textColor: "text-rose-600"
    },
  ];

  const nextAppointment = appointments
    .filter((a) => a.status === "booked")
    .sort((a, b) => a.date.localeCompare(b.date) || a.slot.localeCompare(b.slot))[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl border border-slate-200 p-4 md:p-6"
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-1">
              {/* Enhanced Avatar */}
              <div className="relative flex-shrink-0" ref={panelRef}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setPanelOpen((p) => !p)}
                  className="relative rounded-full overflow-hidden border-4 border-white shadow-lg w-14 h-14 md:w-16 md:h-16 flex items-center justify-center bg-gradient-to-br from-[#5DC4C7] to-blue-500 focus:outline-none focus:ring-4 focus:ring-teal-200"
                  title="Profile (click to open)"
                >
                  {doctor?.picture ? (
                    <img src={doctor.picture} alt="profile" className="w-full h-full object-cover" />
                  ) : (
                    <FaUserCircle className="text-white w-8 h-8 md:w-10 md:h-10" />
                  )}
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 md:w-5 md:h-5 bg-emerald-500 border-2 border-white rounded-full"></div>
                </motion.button>

                {/* Enhanced Profile Panel */}
                {panelOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className="absolute right-auto mt-3 w-80 sm:w-96 bg-white shadow-2xl rounded-2xl p-4 sm:p-6 z-50 border border-slate-200 max-w-[calc(100vw-2rem)]"
                  >
                    {/* Doctor Details */}
                    <div className="flex flex-col items-center gap-3 border-b border-slate-200 pb-4">
                      {doctor?.picture ? (
                        <img src={doctor.picture} className="w-24 h-24 rounded-full object-cover border-4 border-slate-200" />
                      ) : (
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center">
                          <FaUserCircle className="w-16 h-16 text-white" />
                        </div>
                      )}
                      <div className="text-center">
                        <h2 className="font-bold text-xl text-slate-800">{doctor?.name}</h2>
                        <p className="text-sm text-slate-600 mb-1">{doctor?.email}</p>
                        <span className="inline-block px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-sm font-medium">
                          {doctor?.specialization}
                        </span>
                      </div>
                    </div>

                    {/* Change Picture Section */}
                    <div className="mt-4">
                      <label className="block text-sm font-semibold text-slate-700 mb-3">Update Profile Picture</label>
                       <div className="space-y-3">
                        {/* File Upload */}
                        <div className="flex gap-2">
                          <label className="cursor-pointer flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-slate-300 rounded-lg text-sm bg-slate-50 hover:bg-slate-100 hover:border-slate-400 transition-colors">
                            📁 Choose File
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleFileSelect}
                            />
                          </label>
                        </div>

                        {/* URL Input */}
                        <input
                          type="text"
                          placeholder="Or paste image URL here..."
                          value={pictureUrlInput}
                          onChange={(e) => setPictureUrlInput(e.target.value)}
                          className="w-full border-2 border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-teal-500 focus:outline-none transition-colors"
                        />

                        {/* Preview */}
                        {preview && (
                          <div className="mt-3">
                            <p className="text-xs text-slate-500 mb-2">Preview:</p>
                            <img
                              src={preview}
                              alt="preview"
                              className="w-32 h-32 object-cover rounded-lg border-2 border-slate-200"
                            />
                          </div>
                        )}

                        {/* Buttons */}
                        <div className="flex flex-wrap gap-2">
                          {/*  Update / Change Picture */}
                          <button
                            onClick={handleUploadPicture}
                            disabled={uploading}
                            className="flex-1 px-4 py-2 bg-gradient-to-r from-[#5DC4C7] to-cyan-500 text-white rounded-lg text-sm font-medium hover:from-[#5DC4C7] hover:to-cyan-600 disabled:opacity-50 transition-all"
                          >
                            {uploading ? "Uploading..." : "Change Picture"}
                          </button>

                          {/* Clear (Reset Form Inputs) */}
                          <button
                            onClick={() => {
                              setFile(null);
                              setPreview(null);
                              setPictureUrlInput("");
                              setUploadMsg(null);
                            }}
                            className="px-4 py-2 border-2 border-slate-200 rounded-lg text-sm hover:bg-slate-50 transition-colors"
                          >
                            Clear
                          </button>
                        </div>
                           {/* Remove from Profile */}
                          <button
                            onClick={handleRemovePicture}
                            disabled={uploading}
                            className="px-4 py-2 w-full bg-rose-500 text-white rounded-lg text-sm font-medium hover:bg-rose-600 disabled:opacity-50 transition-colors"
                          >
                            Remove Picture
                          </button>

                        {/* Upload Message */}
                        {uploadMsg && (
                          <p
                            className={`text-xs mt-2 p-2 rounded-lg ${
                              uploadMsg.includes("success")
                                ? "text-emerald-600 bg-emerald-50"
                                : "text-rose-600 bg-rose-50"
                            }`}
                          >
                            {uploadMsg}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Change Password Section */}
                    <form onSubmit={handleChangePassword} className="mt-6 pt-4 border-t border-slate-200 space-y-3">
                      <label className="text-sm font-semibold text-slate-700">Change Password</label>
                      <input
                        type="password"
                        placeholder="Current password"
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        className="w-full border-2 border-slate-200 rounded-lg p-2 text-sm focus:border-teal-500 focus:outline-none transition-colors"
                        required
                      />
                      <input
                        type="password"
                        placeholder="New password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full border-2 border-slate-200 rounded-lg p-2 text-sm focus:border-teal-500 focus:outline-none transition-colors"
                        required
                      />
                      <input
                        type="password"
                        placeholder="Confirm new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full border-2 border-slate-200 rounded-lg p-2 text-sm focus:border-teal-500 focus:outline-none transition-colors"
                        required
                      />
                      {pwdError && <p className="text-rose-600 text-xs bg-rose-50 p-2 rounded-lg">{pwdError}</p>}
                      {pwdSuccess && <p className="text-emerald-600 text-xs bg-emerald-50 p-2 rounded-lg">{pwdSuccess}</p>}
                      <button 
                        disabled={pwdLoading}
                        type="submit" 
                        className="w-full bg-gradient-to-r from-[#5DC4C7] to-cyan-500 text-white py-2 rounded-lg text-sm font-medium hover:from-[#5DC4C7] hover:to-cyan-600 transition-all"
                      >
                        {pwdLoading ? "⏳ Updating Password..." : "🔐 Update Password"}
                      </button>
                    </form>
                  </motion.div>
                )}
              </div>

              {/* Name & Info */}
              <div className="min-w-0 flex-1">
                <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-slate-800 mb-1 truncate">
                  {doctor
                    ? `Welcome, ${doctor?.name?.startsWith("Dr.") ? doctor.name : `Dr. ${doctor?.name || ""}`}`
                    : "Doctor Dashboard"}
                </h1>
                {doctor && (
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-sm md:text-base text-slate-600">
                    <span className="flex items-center gap-2">
                      <FaStethoscope className="w-3 h-3 md:w-4 md:h-4 text-[#5DC4C7] flex-shrink-0" />
                      <span className="truncate">{doctor.specialization}</span>
                    </span>
                    <span className="hidden sm:inline text-slate-400">|</span>
                    <span className="truncate">{doctor.email}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Logout Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                localStorage.removeItem("doctorInfo");
                router.push("/doctor/sign-in");
              }}
              className="px-4 py-2 md:px-6 md:py-3 rounded-xl bg-gradient-to-r from-slate-700 to-slate-800 text-white font-semibold hover:from-slate-800 hover:to-slate-900 transition-all shadow-lg text-sm md:text-base whitespace-nowrap"
            >
              Sign Out
            </motion.button>
          </div>
        </motion.div>

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
          {statCards.map((stat, idx) => {
            const IconComponent = stat.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ scale: 1.05, y: -5 }}
                className="relative overflow-hidden"
              >
                <div className={`p-4 md:p-6 rounded-2xl shadow-xl border border-slate-200 bg-white relative ${stat.bgColor} bg-opacity-50`}>
                  <div className="flex items-center justify-between mb-3 md:mb-4">
                    <div className={`p-2 md:p-3 rounded-xl ${stat.bgColor}`}>
                      <IconComponent className={`w-4 h-4 md:w-6 md:h-6 ${stat.textColor}`} />
                    </div>
                    <div className={`absolute top-0 right-0 w-20 h-20 md:w-32 md:h-32 bg-gradient-to-br ${stat.color} opacity-10 rounded-full -translate-y-10 translate-x-10 md:-translate-y-16 md:translate-x-16`}></div>
                  </div>
                  <h3 className="text-slate-600 text-xs md:text-sm font-medium mb-1 md:mb-2 leading-tight">{stat.title}</h3>
                  <p className={`text-xl md:text-3xl font-bold ${stat.textColor}`}>{stat.value}</p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Enhanced Next Appointment Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden"
        >
          <div className="bg-gradient-to-r from-[#5DC4C7] to-cyan-500 p-4 md:p-6 text-white">
            <div className="flex items-center gap-3">
              <div className="p-2 md:p-3 bg-white bg-opacity-20 rounded-xl">
                <FaCalendarCheck className="w-5 h-5 md:w-6 md:h-6 text-[#5DC4C7]" />
              </div>
              <h2 className="text-xl md:text-2xl font-bold">Next Appointment</h2>
            </div>
          </div>
          
          <div className="p-4 md:p-6">
            {nextAppointment ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <h3 className="text-lg md:text-xl font-semibold text-slate-800">{nextAppointment.patientName}</h3>
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs md:text-sm font-medium self-start">
                    Scheduled
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 text-slate-600 text-sm md:text-base">
                  <span className="flex items-center gap-2">
                    📅 {nextAppointment.date}
                  </span>
                  <span className="flex items-center gap-2">
                    🕐 {nextAppointment.slot}
                  </span>
                </div>
                {nextAppointment.symptoms && (
                  <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <p className="text-sm text-slate-600 font-medium mb-1">Symptoms:</p>
                    <p className="text-slate-800 text-sm md:text-base">{nextAppointment.symptoms}</p>
                  </div>
                )}
              </motion.div>
            ) : (
              <div className="text-center py-6 md:py-8">
                <div className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
                  <FaCalendarCheck className="w-6 h-6 md:w-8 md:h-8 text-slate-400" />
                </div>
                <p className="text-slate-500 text-base md:text-lg">No upcoming appointments</p>
                <p className="text-slate-400 text-sm mt-1">Your schedule is clear for now</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Enhanced Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6"
        >
          {[
            { name: "Appointments", route: "/doctor/appointment", color:"from-[#5DC4C7] to-cyan-500" },
            { name: "Calendar", route: "/doctor/calendar", color: "from-[#5DC4C7] to-cyan-500" },
            { name: "Availability", route: "/doctor/availability", color: "from-[#5DC4C7] to-cyan-500" },
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