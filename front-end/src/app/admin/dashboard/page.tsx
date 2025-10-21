'use client';
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation"; 
import {jwtDecode } from "jwt-decode";
import { FaUserMd, FaUserCheck, FaUserSlash } from "react-icons/fa";

import {
  getDoctors,
  getStats,
  toggleDoctorStatus,
  deleteDoctor,
  adminLogout,
   refreshAccessToken 
} from "../../../api/adminApi";
import { motion } from "framer-motion";

import type { Doctor, AdminStats } from "../../../types/admin";
import {  LayoutDashboard, UserPlus, BarChart3 } from "lucide-react";


interface JwtPayload {
  exp: number; 
  role?: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true); 
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<string | null>(null);
  const [selectedSpecialization, setSelectedSpecialization] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

const fetchDoctors = async () => {
  try {
    const res = await getDoctors();
    setDoctors(res.data);
  } catch (err: any) {
    console.error("Error fetching doctors:", err);


    if (err.response?.status === 401) {
      localStorage.removeItem("adminInfo");
      router.push("/admin/sign-in");
    }
  }
};

const fetchStats = async () => {
  try {
    const res = await getStats();
    setStats(res.data);
  } catch (err: any) {
    console.error("Error fetching stats:", err);

    if (err.response?.status === 401) {
      localStorage.removeItem("adminInfo");
      router.push("/admin/sign-in");
    }
  }
};


 useEffect(() => {
 const validateAdmin = async () => {
  const stored = localStorage.getItem("adminInfo");


  
  if (!stored) {
    router.push("/admin/sign-in");
    return;
  }

  try {
    const { token } = JSON.parse(stored);
    const decoded: JwtPayload = jwtDecode(token);


    if (decoded.exp && decoded.exp * 1000 < Date.now()) {
      console.log("Access token expired — attempting refresh...");

      try {
        const res = await refreshAccessToken(); 
        const newAccessToken = res.data?.accessToken;

        if (newAccessToken) {
          localStorage.setItem("adminInfo", JSON.stringify({ token: newAccessToken }));
          console.log("✅ Access token refreshed successfully!");
        } else {
          throw new Error("No new access token returned");
        }
      } catch (refreshErr) {
        console.error("❌ Refresh failed:", refreshErr);
        localStorage.removeItem("adminInfo");
        router.push("/admin/sign-in");
        return;
      }
    }

    
    await Promise.all([fetchDoctors(), fetchStats()]);
  } catch (err) {
    console.error("Admin token check failed:", err);
    localStorage.removeItem("adminInfo");
    router.push("/admin/sign-in");
  } finally {
    setLoading(false);
  }
};

  validateAdmin();
}, []);


  

  const filteredDoctors = doctors.filter((doc) => {
    const matchesName = doc.name.toLowerCase().includes(search.toLowerCase());
    const matchesSpecialization = selectedSpecialization
      ? doc.specialization.toLowerCase() === selectedSpecialization.toLowerCase()
      : true; 

    return matchesName && matchesSpecialization;
  });

  const doctorStatCards = [
  { 
    title: "Total Doctors", 
    value: stats?.totalDoctors || 0, 
    icon: FaUserMd, 
    color: "from-cyan-500 to-cyan-600",
    bgColor: "bg-cyan-50",
    textColor: "text-cyan-600"
  },
  { 
    title: "Active Doctors", 
    value: stats?.availableDoctors?.length || 0, 
    icon: FaUserCheck, 
    color: "from-emerald-500 to-emerald-600",
    bgColor: "bg-emerald-50",
    textColor: "text-emerald-600"
  },
  { 
    title: "Inactive Doctors", 
    value: (stats?.totalDoctors || 0) - (stats?.availableDoctors?.length || 0), 
    icon: FaUserSlash, 
    color: "from-orange-500 to-red-500",
    bgColor: "bg-orange-50",
    textColor: "text-orange-600"
  },
];
  
  const handleToggleStatus = async (id: string, isActive: boolean) => {
    try {
      await toggleDoctorStatus(id, !isActive);
      fetchDoctors();
      fetchStats();
    } catch (err) {
      console.error("Error toggling doctor status:", err);
    }
  };

  const handleDeleteDoctor = (id: string) => {
    setSelectedDoctor(id);
    setShowConfirm(true);
  };

  const confirmDelete = async () => {
    if (!selectedDoctor) return;

    try {
      
      await deleteDoctor(selectedDoctor);
      await fetchDoctors();
      await fetchStats();

    } catch (err) {
      console.error("Error deleting doctor:", err);
    } finally {
      
      setShowConfirm(false);
      setSelectedDoctor(null);
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

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">

      {/* Sidebar Overlay for mobile */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0  bg-opacity-50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-slate-900 to-slate-800 text-white flex flex-col transform transition-all duration-300 ease-out shadow-2xl
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-6 border-b border-slate-700 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#5DC4C7] to-cyan-400 rounded-xl flex items-center justify-center">
              <span className="text-lg font-bold">A</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
              Admin Panel
            </span>
          </div>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-slate-400 hover:text-white transition-colors p-1"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <a href="/admin/dashboard" className="flex items-center space-x-3 p-3 rounded-xl bg-[#5DC4C7] text-white  hover:text-white hover:bg-slate-700 transition-all hover:scale-[1.02]">
            <LayoutDashboard className="w-5 h-5" />
            <span className="font-medium">Dashboard</span>
          </a>
          <a href="/admin/add-doctor" className="flex items-center space-x-3 p-3 rounded-xl text-slate-300 hover:text-white hover:bg-slate-700 transition-all hover:scale-[1.02]">
            <UserPlus className="w-5 h-5" />
            <span className="font-medium">Add Doctors</span>
          </a>
          <a href="/admin/analytics" className="flex items-center space-x-3 p-3 rounded-xl text-slate-300 hover:text-white hover:bg-slate-700   transition-all hover:shadow-lg hover:scale-[1.02]">
            <BarChart3 className="w-5 h-5" />
            <span className="font-medium">Insights</span>
          </a>
        </nav>
        <div className="p-4 border-t border-slate-700">
          <button
            onClick={adminLogout}
            className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-slate-700 to-slate-800 text-white font-semibold hover:from-slate-800 hover:to-slate-900 transition-all shadow-lg text-sm hover:scale-105 active:scale-95"
          >
            Sign Out
          </button>
        </div>
        <div className="p-4 border-t border-slate-700">
          <div className="text-center text-slate-400 text-sm">
            Healthcare Admin v2.0
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 lg:p-8 w-full lg:w-auto overflow-hidden">
        {/* Header */}
        <header className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-3 bg-white rounded-xl shadow-md hover:shadow-lg transition-all hover:scale-105 text-slate-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div>
              <h1 className="text-3xl font-bold text-slate-800 mb-1">Dashboard</h1>
              <p className="text-slate-500">Manage your healthcare team</p>
            </div>
          </div>
          <div className="hidden md:flex items-center space-x-4">
            <div className="bg-white rounded-xl px-4 py-2 shadow-md">
              <span className="text-sm text-slate-500">Welcome back, Admin</span>
            </div>
            <button
              onClick={adminLogout}
              className="px-4 py-2 md:px-6 md:py-3 rounded-xl bg-gradient-to-r from-slate-700 to-slate-800 text-white font-semibold hover:from-slate-800 hover:to-slate-900 transition-all shadow-lg text-sm md:text-base whitespace-nowrap hover:scale-105 active:scale-95"
            >
              Sign Out
            </button>
          </div>
        </header>

        {/* Stats Section */}
       {stats && (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6 mb-8">
        {doctorStatCards.map((stat, idx) => {
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
                <h3 className="text-slate-600 text-xs md:text-sm font-medium mb-1 md:mb-2 leading-tight">
                  {stat.title}
                </h3>
                <p className={`text-xl md:text-3xl font-bold ${stat.textColor}`}>{stat.value}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    )}


        {/* Doctor Management Section */}
        <section className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-blue-50">
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-800 mb-1">Doctor Management</h2>
                <p className="text-slate-600 text-sm">Filter and manage your medical team</p>
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name..."
                  className="pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5DC4C7] focus:border-transparent w-full lg:w-80 shadow-sm"
                />
                <svg className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Specialization Filter */}
          <div className="p-6 bg-slate-50 border-b border-slate-100">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Filter by Specialization</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {[
                { name: "Cardiologist", img: "/heart.png", desc: "Heart specialist", color: "from-red-500 to-pink-500" },
                { name: "Neurologist", img: "/brainstorm.png", desc: "Brain specialist", color: "from-purple-500 to-indigo-500" },
                { name: "Pulmonologist", img: "/lungs.png", desc: "Lungs specialist", color: "from-blue-500 to-cyan-500" },
                { name: "Dermatologist", img: "/care.png", desc: "Skin specialist", color: "from-green-500 to-emerald-500" },
                { name: "Nephrologist", img: "/kidney.png", desc: "Kidney specialist", color: "from-yellow-500 to-orange-500" },
                { name: "Obstetrician", img: "/obstetrics.png", desc: "Pregnancy & childbirth", color: "from-pink-500 to-rose-500" },
                { name: "Rheumatologist", img: "/arthritis.png", desc: "Arthritis & joints", color: "from-indigo-500 to-purple-500" },
                { name: "Pediatrician", img: "/pediatric.png", desc: "Child specialist", color: "from-cyan-500 to-blue-500" },
              ].map((spec) => (
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
                      <p className="text-sm font-medium text-slate-700 text-center leading-tight">{spec.name}</p>
                    </div>

                    {/* Back side */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 text-white text-sm font-medium [transform:rotateY(180deg)] backface-hidden px-2">
                      <img src={spec.img} alt={spec.name} className="w-12 h-12 mb-2 filter brightness-0 invert" />
                      <p className="text-center">{spec.desc}</p>
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

          {/* Doctors List */}
          <div className="p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Doctors List ({filteredDoctors.length})</h3>
            
            {/* Desktop Table */}
            <div className="hidden lg:block">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 rounded-t-xl">
                      <th className="p-4 text-left text-slate-600 font-semibold rounded-tl-xl">Name</th>
                      <th className="p-4 text-left text-slate-600 font-semibold">Specialization</th>
                      <th className="p-4 text-left text-slate-600 font-semibold">Status</th>
                      <th className="p-4 text-left text-slate-600 font-semibold rounded-tr-xl">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDoctors.length > 0 ? (
                      filteredDoctors.map((doc, index) => (
                        <tr key={doc._id} className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${index === filteredDoctors.length - 1 ? 'border-b-0' : ''}`}>
                          <td className="p-4">
                            <div className="flex items-center space-x-3">
                              {doc.picture ? (
                                <img
                                  src={doc.picture}
                                  alt={doc.name}
                                  className="w-10 h-10 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                                  <span className="text-white font-semibold text-sm">
                                    {doc.name.split(" ").map((n) => n[0]).join("")}
                                  </span>
                                </div>
                              )}

                              <span className="font-medium text-slate-800">{doc.name}</span>
                            </div>
                          </td>
                          <td className="p-4 text-slate-600">{doc.specialization}</td>
                          <td className="p-4">
                            {doc.isActive ? (
                              <span className="inline-flex items-center px-3 py-1 text-sm font-medium rounded-full bg-green-100 text-green-800">
                                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                                Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-3 py-1 text-sm font-medium rounded-full bg-gray-100 text-gray-800">
                                <div className="w-2 h-2 bg-gray-500 rounded-full mr-2"></div>
                                Inactive
                              </span>
                            )}
                          </td>
                          <td className="p-4">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => router.push(`/admin/edit-doctor/${doc._id}`)}
                                className="px-4 py-2 bg-gradient-to-r from-[#5DC4C7] to-cyan-400 text-white text-sm rounded-lg hover:from-cyan-500 hover:to-cyan-600 transition-all hover:scale-105 shadow-md"
                              >
                                Edit
                              </button>

                              <button
                                onClick={() => handleToggleStatus(doc._id, doc.isActive)}
                                className={`px-4 py-2 text-white text-sm rounded-lg transition-all hover:scale-105 shadow-md ${
                                  doc.isActive
                                    ? "bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                                    : "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                                }`}
                              >
                                {doc.isActive ? "Disable" : "Enable"}
                              </button>
                              
                              <button
                                onClick={() => handleDeleteDoctor(doc._id)}
                                className="px-4 py-2 bg-gradient-to-r from-gray-500 to-slate-500 text-white text-sm rounded-lg hover:from-gray-600 hover:to-slate-600 transition-all hover:scale-105 shadow-md"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="p-8 text-center">
                          <div className="text-slate-400 text-lg mb-2">No doctors found</div>
                          <p className="text-slate-500 text-sm">Try adjusting your search or filter criteria</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden space-y-4">
              {filteredDoctors.length > 0 ? (
                filteredDoctors.map((doc) => (
                  <div key={doc._id} className="bg-slate-50 border border-slate-200 rounded-xl p-5 hover:shadow-md transition-all">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        {doc.picture ? (
                          <img
                            src={doc.picture}
                            alt={doc.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold text-base">
                              {doc.name.split(" ").map((n) => n[0]).join("")}
                            </span>
                          </div>
                        )}

                        <div>
                          <h3 className="font-semibold text-slate-800 text-lg">{doc.name}</h3>
                          <p className="text-slate-600 text-sm">{doc.specialization}</p>
                        </div>
                      </div>
                      {doc.isActive ? (
                        <span className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                          <div className="w-2 h-2 bg-gray-500 rounded-full mr-1"></div>
                          Inactive
                        </span>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => router.push(`/admin/edit-doctor/${doc._id}`)}
                        className="px-4 py-2 bg-gradient-to-r from-[#5DC4C7] to-cyan-400 text-white text-sm rounded-lg hover:from-cyan-500 hover:to-cyan-600 transition-all flex-1 shadow-md"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => handleToggleStatus(doc._id, doc.isActive)}
                        className={`px-4 py-2 text-white text-sm rounded-lg transition-all flex-1 shadow-md ${
                          doc.isActive
                            ? "bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                            : "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                        }`}
                      >
                        {doc.isActive ? "Disable" : "Enable"}
                      </button>
                      
                      <button
                        onClick={() => handleDeleteDoctor(doc._id)}
                        className="px-4 py-2 bg-gradient-to-r from-gray-500 to-slate-500 text-white text-sm rounded-lg hover:from-gray-600 hover:to-slate-600 transition-all flex-1 shadow-md"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-slate-400 text-2xl">👨‍⚕️</span>
                  </div>
                  <div className="text-slate-400 text-lg mb-2">No doctors found</div>
                  <p className="text-slate-500 text-sm">Try adjusting your search or filter criteria</p>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 overflow-hidden">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">Delete Doctor</h2>
              <p className="text-slate-600 mb-6">
                Are you sure you want to delete this doctor? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all font-medium shadow-md"
                >
                  Delete
                </button>
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-all font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}