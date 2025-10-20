"use client";
import React, { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import Navbar from "../../components/nav";
import { useRouter } from "next/navigation";
const AboutUs = () => {
  const containerRef = useRef(null);
  const router = useRouter();

  const fadeInUp = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8 } },
  };

  
  const [stats, setStats] = useState({
    patients: 0,
    doctors: 0,
    clinics: 0,
    countries: 0
  });

  useEffect(() => {
    const targets = { patients: 50000, doctors: 1200, clinics: 300, countries: 45 };
    const duration = 2000;
    const steps = 60;
    const interval = duration / steps;

    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      setStats({
        patients: Math.floor(targets.patients * progress),
        doctors: Math.floor(targets.doctors * progress),
        clinics: Math.floor(targets.clinics * progress),
        countries: Math.floor(targets.countries * progress)
      });
      if (step >= steps) clearInterval(timer);
    }, interval);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 min-h-screen text-[#06434D] -mt-[80px]" ref={containerRef}>
      <Navbar whiteBg={true} />
      {/* Hero Section */}
      <motion.section
        className="relative h-screen flex items-center justify-center overflow-hidden bg-gradient-to-r from-[#5DC4C7] to-cyan-600"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 bg-white rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>
        
        <motion.div
          className="text-center z-10 px-6"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
        >
          <h1 className="text-6xl md:text-7xl font-bold text-white mb-6">About Us</h1>
          <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto">
            Transforming healthcare through innovation, compassion, and excellence
          </p>
          <motion.div
            className="mt-8"
            animate={{ y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <svg className="w-8 h-8 mx-auto text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Our Story Section */}
      <motion.section
        className="py-24 px-6 md:px-20 bg-white relative overflow-hidden"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeInUp}
      >
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ x: -50, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-5xl font-bold mb-6 text-[#06434D]">Our Story</h2>
            <p className="text-lg text-gray-700 mb-4 leading-relaxed">
              Founded with a vision to simplify healthcare access, we began our journey in 2015. What started as a simple booking platform has evolved into a comprehensive healthcare appointment ecosystem.
            </p>
            <p className="text-lg text-gray-700 leading-relaxed">
              Today, we're proud to connect millions of patients with trusted doctors across 45+ countries, making quality healthcare just a click away.
            </p>
          </motion.div>
          
          <motion.div
            className="relative"
            initial={{ x: 50, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <div className="grid grid-cols-2 gap-4">
              <motion.img
                src="./d1.jpg"
                alt="Healthcare"
                className="w-full h-64 object-cover rounded-lg shadow-xl"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.3 }}
              />
              <motion.img
                src="./d2.webp"
                alt="Medical team"
                className="w-full h-64 object-cover rounded-lg shadow-xl mt-8"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Why Patients Trust Us Section with Test Tubes */}
      <motion.section
        className="py-24 px-6 md:px-20 relative overflow-hidden bg-gradient-to-br from-cyan-50 to-blue-100"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeInUp}
      >
        {/* Animated Test Tubes Background */}
        <div className="absolute inset-0 overflow-hidden opacity-15">
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -40, 0],
                rotate: [0, 15, -15, 0],
              }}
              transition={{
                duration: 4 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            >
              {/* Test Tube Shape */}
              <svg width="40" height="80" viewBox="0 0 40 80" fill="none">
                <rect x="12" y="0" width="16" height="10" fill="#5DC4C7" rx="2"/>
                <rect x="10" y="8" width="20" height="65" fill="#5DC4C7" rx="4"/>
                <rect x="10" y="50" width="20" height="23" fill="#06434D" opacity="0.3" rx="4"/>
                <ellipse cx="20" cy="73" rx="10" ry="4" fill="#5DC4C7"/>
              </svg>
            </motion.div>
          ))}
        </div>

        <div className="max-w-6xl mx-auto relative z-10">
          <motion.h2
            className="text-5xl font-bold mb-12 text-center text-[#06434D]"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Why Patients Trust Us
          </motion.h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { 
                title: "Instant Booking", 
                desc: "Book appointments 24/7 with real-time availability", 
                svg: <svg className="w-16 h-16 mx-auto mb-4 text-[#5DC4C7]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              },
              { 
                title: "Verified Doctors", 
                desc: "All healthcare providers are thoroughly verified", 
                svg: <svg className="w-16 h-16 mx-auto mb-4 text-[#5DC4C7]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              },
              { 
                title: "Global Network", 
                desc: "Access healthcare professionals in 45+ countries", 
                svg: <svg className="w-16 h-16 mx-auto mb-4 text-[#5DC4C7]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              }
            ].map((item, idx) => (
              <motion.div
                key={idx}
                className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-slate-100"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.2 }}
                viewport={{ once: true }}
                whileHover={{ y: -10 }}
              >
                {item.svg}
                <h3 className="text-2xl font-bold mb-3 text-[#06434D]">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Stats Section */}
      <motion.section
        className="py-24 px-6 md:px-20 bg-gradient-to-r from-[#5DC4C7] to-cyan-600 text-white"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeInUp}
      >
        <div className="max-w-6xl mx-auto">
          <h2 className="text-5xl font-bold mb-16 text-center">Our Impact in Numbers</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: stats.patients, label: "Patients Served", suffix: "+" },
              { value: stats.doctors, label: "Expert Doctors", suffix: "+" },
              { value: stats.clinics, label: "Healthcare Facilities", suffix: "+" },
              { value: stats.countries, label: "Countries", suffix: "+" }
            ].map((stat, idx) => (
              <motion.div
                key={idx}
                className="text-center"
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                transition={{ delay: idx * 0.1, type: "spring" }}
                viewport={{ once: true }}
              >
                <motion.div
                  className="text-5xl md:text-6xl font-bold mb-2"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {stat.value.toLocaleString()}{stat.suffix}
                </motion.div>
                <div className="text-lg text-white/80">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Mission & Vision Section */}
      <motion.section
        className="py-24 px-6 md:px-20 bg-white"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeInUp}
      >
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12">
          <motion.div
            className="bg-gradient-to-br from-cyan-50 to-blue-50 p-10 rounded-3xl shadow-xl relative overflow-hidden group border border-slate-100"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.3 }}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#5DC4C7] rounded-full -translate-y-16 translate-x-16 opacity-20 group-hover:scale-150 transition-transform duration-500"></div>
            <h3 className="text-4xl font-bold mb-6 text-[#06434D] relative z-10">Our Mission</h3>
            <p className="text-lg text-gray-700 leading-relaxed relative z-10">
              To bridge the gap between patients and healthcare providers through technology. We make finding and booking appointments with qualified doctors effortless, ensuring everyone has access to quality healthcare when they need it.
            </p>
          </motion.div>
          
          <motion.div
            className="bg-gradient-to-br from-cyan-50 to-blue-50 p-10 rounded-3xl shadow-xl relative overflow-hidden group border border-slate-100"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.3 }}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#06434D] rounded-full -translate-y-16 translate-x-16 opacity-20 group-hover:scale-150 transition-transform duration-500"></div>
            <h3 className="text-4xl font-bold mb-6 text-[#06434D] relative z-10">Our Vision</h3>
            <p className="text-lg text-gray-700 leading-relaxed relative z-10">
              To become the world's most trusted healthcare appointment platform, where booking a doctor's visit is as simple as ordering food online. We envision a future where no one misses out on healthcare due to booking hassles.
            </p>
          </motion.div>
        </div>
      </motion.section>

      {/* Team Section */}
      <motion.section
        className="py-24 px-6 md:px-20 bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeInUp}
      >
        <div className="max-w-6xl mx-auto">
          <h2 className="text-5xl font-bold mb-4 text-center text-[#06434D]">Meet Our Leadership</h2>
          <p className="text-center text-gray-600 mb-16 text-lg">Guided by experience, driven by passion</p>
          
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { name: "Sarah Mitchell", role: "Chief Executive Officer", img: "./d4.webp" },
              { name: "Dr. Sehrish Chen", role: "Medical Advisor", img: "./dd4.jpg" },
              { name: "Emily Rodriguez", role: "Head of Technology", img: "./d5.jpg" },
              { name: "James Wilson", role: "Customer Success Lead", img: "./d1.jpg" }
            ].map((member, idx) => (
              <motion.div
                key={idx}
                className="group relative"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="relative overflow-hidden rounded-2xl shadow-lg border border-slate-100">
                  <img
                    src={member.img}
                    alt={member.name}
                    className="w-full h-80 object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  {/* Mobile: Always visible names at bottom */}
                  <div className="md:hidden absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#5DC4C7] to-transparent p-6 text-white">
                    <h4 className="text-xl font-bold mb-1">{member.name}</h4>
                    <p className="text-sm text-white/90">{member.role}</p>
                  </div>
                  
                  {/* Desktop: Hover effect with overlay */}
                  <div className="hidden md:block absolute inset-0 bg-gradient-to-t from-[#5DC4C7] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="hidden md:block absolute bottom-0 left-0 right-0 p-6 text-white transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                    <h4 className="text-xl font-bold mb-1">{member.name}</h4>
                    <p className="text-sm text-white/80">{member.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Call to Action */}
      <motion.section
        className="py-24 px-6 md:px-20 bg-gradient-to-r from-[#5DC4C7] to-cyan-600 text-white text-center"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeInUp}
      >
        <motion.h2
          className="text-5xl font-bold mb-6"
          initial={{ scale: 0.8, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true }}
        >
          Ready to Book Your Appointment?
        </motion.h2>
        <p className="text-xl mb-10 text-white/90 max-w-2xl mx-auto">
          Join thousands of satisfied patients who trust us for their healthcare needs. Book with verified doctors in just a few clicks.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <motion.button
            className="px-8 py-4 bg-white text-[#06434D] rounded-full font-semibold text-lg hover:bg-cyan-50 transition-all shadow-lg"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
           onClick={() => router.push("/patient/appointment")}
          >
            Find a Doctor
          </motion.button>
          <motion.button
            className="px-8 py-4 border-2 border-white text-white rounded-full font-semibold text-lg hover:bg-white hover:text-[#5DC4C7] transition-all shadow-lg"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push("/doctor/sign-in")}
          >
            Are You a Doctor?
          </motion.button>
        </div>
      </motion.section>

      {/* Footer */}
      <footer className="bg-white text-cyan-600 py-12 px-6 text-center">
        <p className="text-lg">&copy; 2025 Teck Starck. All Rights Reserved.</p>
        <div className="flex justify-center gap-6 mt-6">
          <a href="#" className="hover:text-[#5DC4C7] transition text-lg">Facebook</a>
          <a href="#" className="hover:text-[#5DC4C7] transition text-lg">Twitter</a>
          <a href="#" className="hover:text-[#5DC4C7] transition text-lg">LinkedIn</a>
        </div>
      </footer>
    </div>
  );
};

export default AboutUs;