"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";  
import { motion } from "framer-motion";
import Lottie from "lottie-react";
import loginAnim from "../../../animations/signin.json";
import Navbar from '../../../components/nav';


export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter(); 

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); 
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/doctor/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include", 
      });
      const data = await res.json();
      if (res.status === 403) {
      setError(data.message || "Your account has been disabled. Please contact admin.");
      return;
    }

    if (res.status === 401) {
      setError(data.message || "Invalid email or password.");
      return;
    }

    if (!res.ok) {
      setError(data.message || "Something went wrong. Please try again.");
      return;
    }
      if (res.ok) {
      
      localStorage.setItem(
        "doctorInfo",
        JSON.stringify({
          ...data,                
          token: data.token,      
          refreshToken: data.refreshToken, 
        })
      );

  
      router.push("/doctor/dashboard");

      setEmail("");
      setPassword("");
    }

    } catch (error) {
      setError("Something went wrong. Please try again.");
    }
  };

  
  const desktopAnimPositions = [
    { top: "0.05%", left: "21%", size: "750px" },
    { top: "0.05%", right: "-28%", size: "700px" },
    { top: "0.05%", left: "-28%", size: "700px" },
  ];

  const mobileAnimPositions = [
    { top: "0%", left: "-7%", size: "500px" },
    { top: "60%", left: "-7%", size: "500px" },
  ];

  return (
    <div className="relative flex items-center justify-center min-h-screen overflow-hidden bg-gray-50">
      <Navbar />
      {/* Desktop Background Animations */}
      <div className="hidden lg:block">
        {desktopAnimPositions.map((pos, i) => (
          <div
            key={`desktop-${i}`}
            className="absolute opacity-60"
            style={{
              top: pos.top,
              left: pos.left,
              right: pos.right,
              width: pos.size,
              height: pos.size,
            }}
          >
            <Lottie animationData={loginAnim} loop={true} />
          </div>
        ))}
      </div>

      {/* Mobile Background Animations */}
      <div className="lg:hidden">
        {mobileAnimPositions.map((pos, i) => (
          <div
            key={`mobile-${i}`}
            className="absolute opacity-60"
            style={{
              top: pos.top,
              left: pos.left,
              width: pos.size,
              height: pos.size,
            }}
          >
            <Lottie animationData={loginAnim} loop={true} />
          </div>
        ))}
      </div>

      {/* Login Card */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="bg-white rounded-2xl shadow-2xl p-6 lg:p-8 mt-[4.5rem] w-[350px] lg:w-[400px] mx-4 lg:mx-0 relative z-10"
      >
        <h2 className="text-2xl lg:text-3xl font-bold text-center mb-6 text-primary">
          Sign in as Doctor
        </h2>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            className="w-full px-4 py-3 lg:py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-base lg:text-sm"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full px-4 py-3 lg:py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-base lg:text-sm"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && (
            <p className="text-red-600 text-sm font-medium">{error}</p>
          )}

          <button
            type="submit"
            className="relative w-full py-3 lg:py-2 rounded-lg bg-primary font-semibold overflow-hidden group cursor-pointer"
          >
            <span className="absolute top-0 left-0 h-full w-0 bg-dark transition-all duration-500 ease-out group-hover:w-full"></span>
            <span className="relative z-10 text-white">Sign in</span>
          </button>
        </form>
      </motion.div>
    </div>
  );
}
