"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Menu, X, Home, Phone } from "lucide-react";

interface NavbarProps {
  whiteBg?: boolean; 
}

const Navbar: React.FC<NavbarProps> = ({ whiteBg = false }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Home", href: "/", icon: Home },
    { name: "About", href: "/about-us", icon: Phone },
    { name: "Book Appointment", href: "/patient/appointment", icon: Calendar },
  ];

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          whiteBg
            ? "bg-white shadow-lg py-3" 
            : isScrolled
            ? "bg-white/95 backdrop-blur-md shadow-md py-3" 
            : "bg-transparent py-4" 
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <motion.div
              className="flex items-center cursor-pointer -mt-[8px] -mb-[10px] "
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="w-22 h-22 rounded-lg flex items-center justify-center -mt-[6px]">
                <img 
                  src="/logos.png" 
                  alt="Logo" 
                  className="w-22 h-22 object-contain" 
                />
                
              </div>

              
            </motion.div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link, idx) => (
                <motion.a
                  key={link.name}
                  href={link.href}
                  className="text-dark hover:text-primary transition-colors duration-300 font-medium relative group"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  {link.name}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
                </motion.a>
              ))}
            </div>

            {/* Desktop CTA Buttons */}
            <div className="hidden md:flex items-center gap-3">
              <motion.a
                href="/doctor/sign-in"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-2 text-dark font-medium hover:text-primary transition-colors duration-300"
              >
                Doctor Login
              </motion.a>
              <motion.a
                href="/admin/sign-in"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative overflow-hidden text-[1rem] font-medium px-5 py-2.5 bg-primary text-white rounded-lg shadow-md group transition-all duration-300"
                >
                {/* Animated fill background */}
                <span className="absolute top-0 left-0 h-full w-0 bg-dark transition-all duration-500 ease-out group-hover:w-full"></span>

                {/* Button text */}
                <span className="relative z-10">Admin Login</span>
                </motion.a>

            </div>

            {/* Mobile Menu Button */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-dark"
            >
              {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </motion.button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 bg-white md:hidden"
          >
            <div className="flex flex-col items-center justify-center h-full px-6 pb-20">
              <div className="space-y-6 mb-12">
                {navLinks.map((link, idx) => (
                  <motion.a
                    key={link.name}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex items-center gap-4 text-dark hover:text-primary transition-colors duration-300"
                  >
                    <div className="w-12 h-12 bg-background rounded-xl flex items-center justify-center">
                      <link.icon size={24} className="text-primary" />
                    </div>
                    <span className="text-2xl font-semibold">{link.name}</span>
                  </motion.a>
                ))}
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col gap-4 w-full max-w-sm">
                <a
                  href="/doctor/sign-in"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full py-4 text-dark font-semibold border-2 border-dark rounded-xl hover:bg-dark hover:text-white transition-all duration-300 text-center"
                >
                  Doctor Login
                </a>
                <a
                  href="/admin/sign-in"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full py-4 bg-primary text-white font-semibold rounded-xl hover:bg-dark transition-all duration-300 shadow-lg text-center"
                >
                  Admin Login
                </a>
              </div>

              {/* Footer */}
              <p className="absolute bottom-8 text-sm text-gray-500">
                Your Health, Our Priority
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Spacer */}
      <div className="h-20"></div>
    </>
  );
};

export default Navbar;
