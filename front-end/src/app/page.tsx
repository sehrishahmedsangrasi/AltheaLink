"use client";
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Navbar from "../components/nav";
import { getTopDoctors } from "../api/patientApi";
import { useRouter } from "next/navigation";

// Doctor Card Component with mobile flip support
const DoctorCard: React.FC<{ doc: any; router: any }> = ({ doc, router }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleCardClick = () => {
    setIsFlipped(!isFlipped);
  };

  return (
    <div
      className="group [perspective:1000px] transition-transform duration-500 hover:scale-105 cursor-pointer"
      onClick={handleCardClick}
    >
      <div
        className={`relative w-full h-64 rounded-xl shadow-lg border border-gray-200 bg-white [transform-style:preserve-3d] transition-transform duration-700 md:group-hover:[transform:rotateY(180deg)] ${
          isFlipped ? "[transform:rotateY(180deg)]" : ""
        }`}
      >
        {/* Front Side */}
        <div className="absolute inset-0 flex flex-col items-center justify-center backface-hidden p-4">
          {doc.image ? (
            <img
              src={doc.image}
              alt={doc.name}
              className="w-20 h-20 rounded-full mb-4 border-2 border-[#5DC4C7] object-cover"
            />
          ) : (
            <div className="w-20 h-20 rounded-full mb-4 border-2 border-[#5DC4C7] bg-[#5DC4C7] flex items-center justify-center text-white text-xl font-semibold">
              {doc.name
                ?.split(" ")
                .map((n: string) => n[0])
                .join("")
                .slice(0, 3)
                .toUpperCase()}
            </div>
          )}

          <h3 className="text-lg font-semibold text-slate-800">{doc.name}</h3>
          <p className="text-primary text-sm">{doc.specialization}</p>
          <p className="mt-2 text-gray-600 text-sm">
            Patients: <span className="font-semibold">{doc.patientCount || 0}</span>
          </p>
          <p className="text-xs text-gray-400 mt-2 md:hidden">Tap to see more</p>
        </div>

        {/* Back Side */}
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-[#5DC4C7] to-cyan-600 text-white text-center p-4 rounded-xl [transform:rotateY(180deg)] backface-hidden">
          <h3 className="text-lg font-semibold mb-2">{doc.name}</h3>
          <p className="text-sm mb-3">{doc.specialization}</p>
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/patient/doctors/${doc.doctorId}`);
            }}
            className="px-4 py-2 bg-white text-[#5DC4C7] rounded-md font-medium hover:bg-cyan-50 transition"
          >
            Book Appointment
          </button>
          <p className="text-xs mt-3 opacity-80 md:hidden">Tap again to flip back</p>
        </div>
      </div>
    </div>
  );
};

const Home: React.FC = () => {
  const [topDoctors, setTopDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchTopDocs = async () => {
      try {
        const res = await getTopDoctors();
        setTopDoctors(res);
      } catch (err) {
        console.error("Error fetching top doctors:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTopDocs();
  }, []);

  const fadeInUp = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8 } },
  };

  return (
    <div className="bg-background min-h-screen text-dark relative">
      <Navbar />

      {/* Hero Section - Fully Responsive */}
      <motion.section
        className="flex flex-col lg:flex-row items-center justify-center w-full lg:min-h-[85vh] bg-[#FDFEFD] px-4 sm:px-6 md:px-8 lg:px-14 py-16 sm:py-20 lg:py-0"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeInUp}
      >
        {/* Left Text + Buttons */}
        <div className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-left gap-4 sm:gap-6 max-w-2xl lg:max-w-none">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-light tracking-wider text-dark font-sans leading-tight">
            Your <span className="text-primary font-semibold">Gateway</span> to Digital Care
          </h1>

          <p className="text-dark text-base sm:text-lg md:text-xl font-light tracking-wide max-w-md lg:max-w-lg">
            Connect with top-rated doctors, book appointments easily, and manage your health efficiently.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-2 sm:mt-4 w-full sm:w-auto">
            <button
              className="relative overflow-hidden text-base sm:text-lg font-medium px-6 sm:px-8 py-3 bg-primary text-white rounded group w-full sm:w-auto"
              onClick={() => router.push("/patient/appointment")}
            >
              <span className="absolute top-0 left-0 h-full w-0 bg-dark transition-all duration-500 ease-out group-hover:w-full"></span>
              <span className="relative z-10">Find a Doctor</span>
            </button>

            <button
              className="relative overflow-hidden text-base sm:text-lg font-medium px-6 sm:px-8 py-3 border border-dark text-dark rounded group w-full sm:w-auto"
              onClick={() => router.push("/patient/appointment")}
            >
              <span className="absolute top-0 left-0 h-full w-0 bg-dark transition-all duration-500 ease-out group-hover:w-full"></span>
              <span className="relative z-10 group-hover:text-white transition-colors duration-500">
                Book Appointment
              </span>
            </button>
          </div>
        </div>

        {/* Right Image */}
        <div className="hidden lg:flex lg:flex-1 justify-end w-full">
          <img
            src="./bg-main11.png"
            alt="Hero Illustration"
            className="max-h-[80vh] w-auto max-w-full object-contain border-0 rounded-2xl"
          />
        </div>
      </motion.section>

      {/* About Us Section - Responsive */}
      <motion.section
        className="flex flex-col md:flex-row py-16 sm:py-20 md:py-32 px-4 sm:px-6 md:px-12 lg:px-20 items-center bg-gray-50 gap-8 md:gap-12"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeInUp}
      >
        <div className="md:w-1/2 text-center md:text-left">
          <motion.div
            className="w-full mb-8 md:mb-0"
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0, transition: { duration: 0.8 } }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
              We are revolutionising healthcare
            </h2>
            <p className="text-base sm:text-lg mb-6">
              Getz Pharma is an international research-driven, branded generic manufacturing company with a global outlook. It currently operates in 45+ countries, with 8,000+ employees worldwide.
            </p>
            <button
              className="relative overflow-hidden text-base sm:text-lg md:text-xl font-semibold px-6 sm:px-8 py-3 bg-primary text-white rounded-full group"
              onClick={() => router.push("/about-us")}
            >
              <span className="absolute top-0 left-0 h-full w-0 bg-dark transition-all duration-500 ease-out group-hover:w-full"></span>
              <span className="relative z-10">ABOUT US</span>
            </button>
          </motion.div>
        </div>

        <div className="md:w-1/2 w-full">
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {/* Col 1 - 2 images bottom */}
            <motion.div
              className="flex flex-col justify-end gap-2 sm:gap-4"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0, transition: { duration: 0.8, delay: 0.1 } }}
              viewport={{ once: true }}
            >
              <motion.img
                src="./d1.jpg"
                alt="Doctor"
                className="w-[90%] h-auto rounded-lg shadow-lg"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1, transition: { duration: 0.6 } }}
                viewport={{ once: true }}
              />
              <motion.img
                src="./d3.webp"
                alt="Doctor"
                className="w-[90%] h-auto rounded-lg shadow-lg"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1, transition: { duration: 0.6, delay: 0.2 } }}
                viewport={{ once: true }}
              />
            </motion.div>

            {/* Col 2 - 1 image top */}
            <motion.div
              className="flex flex-col justify-start"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0, transition: { duration: 0.8, delay: 0.3 } }}
              viewport={{ once: true }}
            >
              <motion.img
                src="./d2.webp"
                alt="Doctor"
                className="w-[90%] h-auto rounded-lg shadow-lg"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1, transition: { duration: 0.6 } }}
                viewport={{ once: true }}
              />
            </motion.div>

            {/* Col 3 - 2 images top & bottom */}
            <motion.div
              className="flex flex-col justify-between"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0, transition: { duration: 0.8, delay: 0.5 } }}
              viewport={{ once: true }}
            >
              <motion.img
                src="./d4.webp"
                alt="Doctor"
                className="w-[90%] h-auto rounded-lg shadow-lg"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1, transition: { duration: 0.6 } }}
                viewport={{ once: true }}
              />
              <motion.img
                src="./d5.jpg"
                alt="Doctor"
                className="w-[90%] h-auto rounded-lg shadow-lg"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1, transition: { duration: 0.6, delay: 0.2 } }}
                viewport={{ once: true }}
              />
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Most Popular Doctors - Responsive */}
      <motion.section
        className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 md:px-12 lg:px-20 bg-gray-50"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeInUp}
      >
        <h2 className="text-2xl sm:text-3xl font-bold mb-8 sm:mb-12 text-center text-dark">
          Most Popular Doctors
        </h2>

        {loading ? (
          <p className="text-center text-gray-500">Loading top doctors...</p>
        ) : topDoctors.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {topDoctors.map((doc, idx) => (
              <DoctorCard key={idx} doc={doc} router={router} />
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500">No top doctors found.</p>
        )}
      </motion.section>

      {/* Features Section - Responsive */}
      <motion.section
        className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 md:px-12 lg:px-20 bg-white"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeInUp}
      >
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-8 sm:mb-12 text-center text-dark">
          Why Choose Us?
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 text-center">
          {/* Card 1 */}
          <motion.div
            className="p-6 sm:p-8 bg-background rounded-xl shadow-lg hover:shadow-2xl transform hover:-translate-y-3 hover:scale-105 transition-all duration-500"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{
              opacity: 1,
              y: 0,
              transition: { duration: 0.8, delay: 0.1 },
            }}
            viewport={{ once: true }}
          >
            <h3 className="font-semibold text-lg sm:text-xl mb-3 text-dark">Easy Booking</h3>
            <p className="text-sm sm:text-base text-gray-600">
              Book appointments in seconds with real-time availability.
            </p>
          </motion.div>

          {/* Card 2 */}
          <motion.div
            className="p-6 sm:p-8 bg-background rounded-xl shadow-lg hover:shadow-2xl transform hover:-translate-y-3 hover:scale-105 transition-all duration-500"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{
              opacity: 1,
              y: 0,
              transition: { duration: 0.8, delay: 0.3 },
            }}
            viewport={{ once: true }}
          >
            <h3 className="font-semibold text-lg sm:text-xl mb-3 text-dark">Verified Doctors</h3>
            <p className="text-sm sm:text-base text-gray-600">
              All doctors are verified and rated by real patients.
            </p>
          </motion.div>

          {/* Card 3 */}
          <motion.div
            className="p-6 sm:p-8 bg-background rounded-xl shadow-lg hover:shadow-2xl transform hover:-translate-y-3 hover:scale-105 transition-all duration-500"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{
              opacity: 1,
              y: 0,
              transition: { duration: 0.8, delay: 0.5 },
            }}
            viewport={{ once: true }}
          >
            <h3 className="font-semibold text-lg sm:text-xl mb-3 text-dark">Secure & Reliable</h3>
            <p className="text-sm sm:text-base text-gray-600">
              Your data is safe and all communications are encrypted.
            </p>
          </motion.div>
        </div>
      </motion.section>

      {/* Footer - Responsive */}
      <footer className="bg-dark text-white py-6 sm:py-8 px-4 sm:px-6 text-center">
        <p className="text-sm sm:text-base">&copy; 2025 AltheaLink. All Rights Reserved.</p>
        <div className="flex flex-wrap justify-center gap-3 sm:gap-4 mt-4">
          <a href="#" className="hover:text-primary transition text-sm sm:text-base">
            Facebook
          </a>
          <a href="#" className="hover:text-primary transition text-sm sm:text-base">
            Twitter
          </a>
          <a href="#" className="hover:text-primary transition text-sm sm:text-base">
            LinkedIn
          </a>
        </div>
      </footer>
    </div>
  );
};

export default Home;