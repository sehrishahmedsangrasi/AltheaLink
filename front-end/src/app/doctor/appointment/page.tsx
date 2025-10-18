"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { getAppointments, updateAppointmentStatus, verifyDoctorToken } from "../../../api/doctorApi";
import { format } from "date-fns";
import {jwtDecode} from "jwt-decode";
import type { Appointment } from "../../../types/doctor";

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterDate, setFilterDate] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const router = useRouter();

  const fetchAppointments = async () => {
    try {
      const response = await getAppointments();
      console.log("Appointments response:", response.data);
      setAppointments(response.data);
    } catch (err) {
      console.error("Error fetching appointments:", err);
    }
  };

  useEffect(() => {
    const validateDoctor = async () => {
      const stored = localStorage.getItem("doctorInfo");
      if (!stored) {
        router.push("/doctor/sign-in");
        return;
      }

      try {
        const { token } = JSON.parse(stored);
        const decoded: any = jwtDecode(token);

      
        if (decoded.exp * 1000 < Date.now()) {
          localStorage.removeItem("doctorInfo");
          router.push("/doctor/sign-in");
          return;
        }

    
        const verify = await verifyDoctorToken(token);
        if (!verify?.valid) {
          localStorage.removeItem("doctorInfo");
          router.push("/doctor/sign-in");
          return;
        }

        
        await fetchAppointments();
      } catch (err) {
        console.error("Doctor verification failed:", err);
        localStorage.removeItem("doctorInfo");
        router.push("/doctor/sign-in");
      } finally {
        setLoading(false);
      }
    };

    validateDoctor();
  }, [router]);

  const handleStatusUpdate = async (id: string, status: "done" | "missed") => {
    try {
      await updateAppointmentStatus(id, status);
      setAppointments((prev) =>
        prev.map((appt) => (appt._id === id ? { ...appt, status } : appt))
      );
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  const filteredAppointments = appointments.filter((appt) => {
    const statusMatch = filterStatus ? appt.status === filterStatus : true;
    const dateMatch = filterDate ? appt.date === filterDate : true;
    return statusMatch && dateMatch;
  });

  if (loading) {return(
      <div style={{ backgroundColor: '#E1E9F1' }} className="min-h-screen flex items-center justify-center">
        <div className="bg-white rounded-xl p-8 shadow-lg">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5DC4C7] mx-auto"></div>
          <p className="text-[#06434D] mt-4 text-center">Loading appointments...</p>
        </div>
      </div>
    );}

  return (
  <div className="min-h-screen flex flex-col p-6 bg-[var(--color-white)] text-[var(--color-text)]">
    
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Appointments</h1>
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

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <input
          type="date"
          className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
        />
        <select
          className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="" >All Status</option>
          <option value="booked">Booked</option>
          <option value="done">Done</option>
          <option value="missed">Missed</option>
        </select>
      </div>

      {/* Appointments Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded-2xl shadow-lg overflow-hidden">
          <thead className="bg-[var(--color-primary)] text-white">
            <tr>
              <th className="py-3 px-4 text-left">Patient</th>
              <th className="py-3 px-4 text-left">Date</th>
              <th className="py-3 px-4 text-left">Slot</th>
              <th className="py-3 px-4 text-left">Symptoms</th>
              <th className="py-3 px-4 text-left">Status</th>
              <th className="py-3 px-4 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAppointments.map((appt) => (
              <motion.tr
                key={appt._id}
                whileHover={{ scale: 1.02 }}
                className="border-b last:border-none"
              >
                <td className="py-3 px-4">{appt.patientName}</td>
                <td className="py-3 px-4">{format(new Date(appt.date), "dd MMM yyyy")}</td>
                <td className="py-3 px-4">{appt.slot}</td>
                <td className="py-3 px-4">{appt.symptoms}</td>
                <td className="py-3 px-4 capitalize">{appt.status}</td>
                <td className="py-3 px-4 flex gap-2">
                  {appt.status === "booked" && (
                    <>
                      <button
                        onClick={() => handleStatusUpdate(appt._id, "done")}
                        className="px-3 py-1 rounded-lg bg-green-500 text-white hover:bg-green-600 transition"
                      >
                        Done
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(appt._id, "missed")}
                        className="px-3 py-1 rounded-lg bg-red-500 text-white hover:bg-red-600 transition"
                      >
                        Missed
                      </button>
                    </>
                  )}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

    {/* Bottom Navigation Buttons */}
 
      <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           className="grid grid-cols-1 sm:grid-cols-3 gap-2 md:gap-6"
      >
              {[
                { name: "Dashboard", route: "/doctor/dashboard", color: "from-[#5DC4C7] to-cyan-500" },
                { name: "Availability", route: "/doctor/availability", color:"from-[#5DC4C7] to-cyan-500" },
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
);

}
