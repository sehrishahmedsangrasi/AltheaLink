"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { jwtDecode, JwtPayload } from "jwt-decode";
import axios from "axios";
import { validateToken, adminLogout} from "@/api/adminApi"; 
import {  LayoutDashboard, UserPlus, BarChart3 } from "lucide-react";

export default function AddDoctor() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    specialization: "",
    fee: "",
  });
  const [passwordStrength, setPasswordStrength] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  
  useEffect(() => {
    const checkAuth = async () => {
      const stored = localStorage.getItem("adminInfo");
      if (!stored) {
        router.replace("/admin/sign-in");
        return;
      }

      try {
        const { token } = JSON.parse(stored);
        const decoded: JwtPayload = jwtDecode(token);

        
        if (decoded.exp && decoded.exp * 1000 < Date.now()) {
          localStorage.removeItem("adminInfo");
          router.replace("/admin/sign-in");
          return;
        }

      
        await validateToken();

        setAuthChecked(true); 
      } catch (err) {
        console.error("Invalid token", err);
        localStorage.removeItem("adminInfo");
        router.replace("/admin/sign-in");
      }
    };

    checkAuth();
  }, [router]);


  
  if (!authChecked) {
    return null; 
  }


  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });

    if (name === "password") {
      setPasswordStrength(checkStrength(value));
    }
  };

  // Password strength checker
  const checkStrength = (password: string) => {
    if (password.length < 6) return "Weak";
    if (/[A-Z]/.test(password) && /\d/.test(password) && /[!@#$%^&*]/.test(password)) {
      return "Strong";
    }
    return "Medium";
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const stored = localStorage.getItem("adminInfo");
      if (!stored) {
        router.push("/admin/sign-in");
        return;
      }

      const { token } = JSON.parse(stored);

      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/doctors`,
        {
          name: form.name,
          email: form.email,
          password: form.password,
          specialization: form.specialization,
          fee: form.fee,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess(true);

      setTimeout(() => {
        setSuccess(false);
        router.push("/admin/dashboard");
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create doctor. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen  bg-gradient-to-br from-slate-50 to-blue-50 text-[var(--color-text)] relative">
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
          <a href="/admin/dashboard" className="flex items-center space-x-3 p-3 rounded-xl text-slate-300 hover:text-white hover:bg-slate-700 transition-all hover:scale-[1.02]">
            <LayoutDashboard className="w-5 h-5" />
            <span className="font-medium">Dashboard</span>
          </a>
          <a href="/admin/add-doctor" className="flex items-center space-x-3 p-3 rounded-xl bg-[#5DC4C7] text-white shadow-md transition-all hover:shadow-lg hover:scale-[1.02]">
            <UserPlus className="w-5 h-5" />
            <span className="font-medium">Add Doctors</span>
          </a>
          <a href="/admin/analytics" className="flex items-center space-x-3 p-3 rounded-xl text-slate-300 hover:text-white hover:bg-slate-700 transition-all hover:scale-[1.02]">
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
      <main className="flex-1 p-4 lg:p-8 w-full lg:w-auto">
        <header className="flex justify-between items-center mb-6 lg:mb-8">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 bg-[var(--color-primary)] text-white rounded hover:bg-[var(--color-dark)]"
            >
              ☰
            </button>
            <h1 className="text-xl lg:text-3xl font-bold">Add Doctor</h1>
          </div>
        </header>

        {error && <p className="text-red-500 mb-4 text-sm lg:text-base">{error}</p>}

        {/* Form */}
        <div className="max-w-2xl mx-auto lg:mx-0">
          <form onSubmit={handleSubmit} className="space-y-6 lg:space-y-8">
            <div>
              <label className="block text-sm font-semibold mb-2">Full Name</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                className="w-full px-4 py-3 lg:py-2 border rounded-lg focus:ring focus:ring-[var(--color-primary)] text-base lg:text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Specialization</label>

              {/* Dropdown Wrapper */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowDropdown((prev) => !prev)}
                  className="w-full px-4 py-3 lg:py-2 border rounded-lg bg-[var(--color-background)] flex justify-between items-center focus:ring focus:ring-[var(--color-primary)] text-base lg:text-sm text-left"
                >
                  {form.specialization ? form.specialization : "Select Specialization"}
                  <span className="ml-2 text-sm lg:text-xs">▼</span>
                </button>

                {/* Dropdown Menu */}
                {showDropdown && (
                  <div className="absolute left-0 top-full w-full mt-2 bg-white border rounded-lg shadow-lg max-h-64 lg:max-h-64 overflow-y-auto z-20">
                    {[
                      { name: "Cardiologist", img: "/heart.png", desc: "Heart specialist" },
                      { name: "Neurologist", img: "/brainstorm.png", desc: "Brain specialist" },
                      { name: "Pulmonologist", img: "/lungs.png", desc: "Lungs specialist" },
                      { name: "Dermatologist", img: "/care.png", desc: "Skin specialist" },
                      { name: "Nephrologist", img: "/kidney.png", desc: "Kidney specialist" },
                      { name: "Obstetrician", img: "/Obstetrics.png", desc: "Pregnancy & childbirth" },
                      { name: "Rheumatologist", img: "/arthritis.png", desc: "Arthritis & joints" },
                      { name: "Pediatrician", img: "/pediatric.png", desc: "Child specialist" },
                    ].map((spec) => (
                      <div
                        key={spec.name}
                        onClick={() => {
                          setForm({ ...form, specialization: spec.name });
                          setShowDropdown(false);
                        }}
                        className={`flex items-center p-4 lg:p-3 cursor-pointer relative group transition ${
                          form.specialization === spec.name
                            ? "bg-blue-100 border-l-4 border-blue-500"
                            : "hover:bg-gray-100"
                        }`}
                      >
                        <img src={spec.img} alt={spec.name} className="w-8 h-8 mr-3 flex-shrink-0" />
                        <div className="flex flex-col lg:flex-row lg:items-center">
                          <span className="text-base lg:text-sm font-medium">{spec.name}</span>
                          <span className="text-sm text-gray-500 lg:hidden">{spec.desc}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Close dropdown when clicking outside */}
              {showDropdown && (
                <div 
                  className="fixed inset-0 z-10"
                  onClick={() => setShowDropdown(false)}
                />
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="w-full px-4 py-3 lg:py-2 border rounded-lg focus:ring focus:ring-[var(--color-primary)] text-base lg:text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Password</label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                className="w-full px-4 py-3 lg:py-2 border rounded-lg focus:ring focus:ring-[var(--color-primary)] text-base lg:text-sm"
                required
              />
              {form.password && (
                <p
                  className={`text-sm mt-1 ${
                    passwordStrength === "Weak"
                      ? "text-red-500"
                      : passwordStrength === "Medium"
                      ? "text-yellow-500"
                      : "text-green-600"
                  }`}
                >
                  Strength: {passwordStrength}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                className="w-full px-4 py-3 lg:py-2 border rounded-lg focus:ring focus:ring-[var(--color-primary)] text-base lg:text-sm"
                required
              />
            </div>
            <div>
            <label className="block text-sm font-semibold mb-2">Consultation Fee (PKR)</label>
            <input
              type="number"
              name="fee"
              value={form.fee}
              onChange={handleChange}
              className="w-full px-4 py-3 lg:py-2 border rounded-lg focus:ring focus:ring-[var(--color-primary)] text-base lg:text-sm"
              required
            />
          </div>


            <div className="flex justify-center lg:justify-end pt-4">
              <button
                type="submit"
                disabled={loading}
                className="relative w-full lg:w-auto px-6 py-3 lg:py-2 rounded-lg bg-[var(--color-primary)] font-semibold overflow-hidden group disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {/* Hover background effect */}
                <span className="absolute top-0 left-0 h-full w-0 bg-[var(--color-dark)] transition-all duration-500 ease-out group-hover:w-full"></span>

                {/* Button text */}
                <span className="relative z-10 text-white text-base lg:text-sm">
                  {loading ? "Adding..." : "Add Doctor"}
                </span>
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* Success Popup */}
      {success && (
        <div className="fixed bottom-6 right-4 lg:right-6 left-4 lg:left-auto bg-primary text-white px-4 lg:px-6 py-3 rounded-lg shadow-lg z-50 animate-bounce text-sm lg:text-base">
          Doctor added successfully!
        </div>
      )}
    </div>
  );
}

