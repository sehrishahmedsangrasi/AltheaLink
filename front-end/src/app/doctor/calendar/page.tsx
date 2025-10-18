
'use client';
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {  getAppointments } from "../../../api/doctorApi";
import { useRouter } from "next/navigation";
import type { Appointment } from "../../../types/doctor";



type ViewType = 'month' | 'week' | 'day';

export default function CalendarPage() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Appointment | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [view, setView] = useState<ViewType>('month');
  const [loading, setLoading] = useState(true);

  const handleEventClick = (appointment: Appointment): void => {
    setSelectedEvent(appointment);
    setShowModal(true);
  };

  const closeModal = (): void => {
    setShowModal(false);
    setSelectedEvent(null);
  };

  const getStatusColor = (status: string): string => {
    switch (status?.toLowerCase()) {
      case 'booked': return '#5DC4C7';
      case 'done': return '#10B981';
      case 'missed': return '#EF4444';
      default: return '#5DC4C7';
    }
  };

  
useEffect(() => {
  const fetchAppointments = async () => {
    const stored = localStorage.getItem("doctorInfo");
    if (!stored) {
      router.push("/doctor/sign-in");
      return;
    }

    try {
      const res = await getAppointments(); 
      setAppointments(res.data || []);
    } catch (err) {
      console.error("Failed to fetch appointments:", err);
      localStorage.removeItem("doctorInfo");
      router.push("/doctor/sign-in");
    } finally {
      setLoading(false);
    }
  };

  fetchAppointments();
}, [router]);

  if (loading) {return(
      <div style={{ backgroundColor: '#E1E9F1' }} className="min-h-screen flex items-center justify-center">
        <div className="bg-white rounded-xl p-8 shadow-lg">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5DC4C7] mx-auto"></div>
          <p className="text-[#06434D] mt-4 text-center">Loading calendar...</p>
        </div>
      </div>
    );}

  const getStatusBadgeClass = (status: string): string => {
    switch (status?.toLowerCase()) {
      case 'booked':
        return 'bg-[#5DC4C7] text-white';
      case 'done':
        return 'bg-green-100 text-green-800';
      case 'missed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-[#5DC4C7] text-white';
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getDaysInMonth = (): (number | null)[] => {
    const year: number = currentDate.getFullYear();
    const month: number = currentDate.getMonth();
    const firstDay: Date = new Date(year, month, 1);
    const lastDay: Date = new Date(year, month + 1, 0);
    const daysInMonth: number = lastDay.getDate();
    const startingDayOfWeek: number = firstDay.getDay();
    
    const days: (number | null)[] = [];
    
    
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    return days;
  };

  const getWeekDays = (): Date[] => {
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day;
    startOfWeek.setDate(diff);
    
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      weekDays.push(date);
    }
    return weekDays;
  };

  const getAppointmentsForDay = (day: number | null, date?: Date): Appointment[] => {
    let dateString: string;
    
    if (date) {
      dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    } else if (day) {
      dateString = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    } else {
      return [];
    }
    
    return appointments.filter((apt: Appointment) => apt.date === dateString);
  };

  const navigateDate = (direction: number): void => {
    const newDate: Date = new Date(currentDate);
    
    if (view === 'month') {
      newDate.setMonth(currentDate.getMonth() + direction);
    } else if (view === 'week') {
      newDate.setDate(currentDate.getDate() + (direction * 7));
    } else if (view === 'day') {
      newDate.setDate(currentDate.getDate() + direction);
    }
    
    setCurrentDate(newDate);
  };

  const getViewTitle = (): string => {
    const monthNames: string[] = ["January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"];
    
    if (view === 'month') {
      return `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    } else if (view === 'week') {
      const weekDays = getWeekDays();
      const start = weekDays[0];
      const end = weekDays[6];
      if (start.getMonth() === end.getMonth()) {
        return `${monthNames[start.getMonth()]} ${start.getDate()}-${end.getDate()}, ${start.getFullYear()}`;
      } else {
        return `${monthNames[start.getMonth()]} ${start.getDate()} - ${monthNames[end.getMonth()]} ${end.getDate()}, ${start.getFullYear()}`;
      }
    } else {
      return `${monthNames[currentDate.getMonth()]} ${currentDate.getDate()}, ${currentDate.getFullYear()}`;
    }
  };

  const renderMonthView = () => {
    const dayNames: string[] = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    
    return (
      <>
        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-1 mb-4">
          {dayNames.map((day: string) => (
            <div key={day} className="p-3 text-center font-semibold rounded-lg" style={{ backgroundColor: '#E1E9F1', color: '#06434D' }}>
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-1">
          {getDaysInMonth().map((day: number | null, index: number) => {
            const dayAppointments: Appointment[] = getAppointmentsForDay(day);
            const isToday: boolean = day !== null && 
              new Date().getDate() === day && 
              new Date().getMonth() === currentDate.getMonth() &&
              new Date().getFullYear() === currentDate.getFullYear();

            return (
              <div
                  key={index}
                  className={`min-h-[100px] p-2 border border-gray-100 rounded-lg
                      ${day ? 'bg-white hover:bg-gray-50' : 'bg-gray-50'}
                      ${isToday ? 'ring-2 ring-[#5DC4C7] bg-[rgba(93,196,199,0.1)]' : ''}`}
                  >

                {day && (
                  <>
                    <div className={`text-sm font-semibold mb-1 ${isToday ? 'text-white px-2 py-1 rounded-full text-center' : ''}`}
                         style={isToday ? { backgroundColor: '#5DC4C7' } : { color: '#06434D' }}>
                      {day}
                    </div>
                    <div className="space-y-1">
                      {dayAppointments.map((apt: Appointment) => (
                        <div
                          key={apt._id}
                          className="text-xs p-1 rounded cursor-pointer hover:opacity-80 transition-opacity"
                          style={{ backgroundColor: getStatusColor(apt.status), color: 'white' }}
                          onClick={() => handleEventClick(apt)}
                        >
                          <div className="font-medium truncate">{apt.patientName}</div>
                          <div className="opacity-75">{apt.slot}</div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </>
    );
  };

  const renderWeekView = () => {
    const weekDays = getWeekDays();
    const dayNames: string[] = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    
    return (
      <div className="grid grid-cols-7 gap-1">
        {weekDays.map((date, index) => {
          const dayAppointments = getAppointmentsForDay(null, date);
          const isToday = new Date().toDateString() === date.toDateString();
          
          return (
            <div key={index} className={`min-h-[400px] p-3 border border-gray-100 rounded-lg bg-white ${isToday ? 'ring-2 ring-[#5DC4C7] bg-[rgba(93,196,199,0.1)]' : ''}`}>
              <div className="text-center mb-3">
                <div className="text-sm font-medium text-gray-600">{dayNames[date.getDay()]}</div>
                <div className={`text-lg font-bold ${isToday ? 'text-white px-2 py-1 rounded-full' : ''}`}
                     style={isToday ? { backgroundColor: '#5DC4C7' } : { color: '#06434D' }}>
                  {date.getDate()}
                </div>
              </div>
              <div className="space-y-2">
                {dayAppointments.map((apt: Appointment) => (
                  <div
                    key={apt._id}
                    className="text-sm p-2 rounded cursor-pointer hover:opacity-80 transition-opacity"
                    style={{ backgroundColor: getStatusColor(apt.status), color: 'white' }}
                    onClick={() => handleEventClick(apt)}
                  >
                    <div className="font-medium truncate">{apt.patientName}</div>
                    <div className="opacity-75">{apt.slot}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderDayView = () => {
    const dayAppointments = getAppointmentsForDay(currentDate.getDate());
    const isToday = new Date().toDateString() === currentDate.toDateString();
    
    return (
      <div className="max-w-2xl mx-auto">
        <div className={`p-6 border border-gray-100 rounded-lg bg-white ${isToday ? 'ring-2 ring-[#5DC4C7]' : ''}`}>
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold" style={{ color: '#06434D' }}>
              {formatDate(currentDate.toISOString().split('T')[0])}
            </h3>
            {isToday && (
              <span className="inline-block mt-2 px-3 py-1 rounded-full text-sm font-medium text-white" style={{ backgroundColor: '#5DC4C7' }}>
                Today
              </span>
            )}
          </div>
          
          {dayAppointments.length > 0 ? (
            <div className="space-y-3">
              {dayAppointments.map((apt: Appointment) => (
                <div
                  key={apt._id}
                  className="p-4 rounded-lg cursor-pointer hover:shadow-md transition-shadow border border-gray-200"
                  onClick={() => handleEventClick(apt)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-lg" style={{ color: '#06434D' }}>
                        {apt.patientName}
                      </h4>
                      <p className="text-gray-600">{apt.slot}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getStatusBadgeClass(apt.status)}`}>
                      {apt.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No appointments scheduled for this day</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#E1E9F1' }}>
      <div className="p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div style={{ backgroundColor: '#FFFFFF' }} className="rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-3xl font-bold mb-2" style={{ color: '#06434D' }}>
                    Appointment Calendar
                  </h1>
                  <p className="text-gray-600">
                    Manage and view your scheduled appointments
                  </p>
                </div>
                <div className="mt-4 sm:mt-0">
                  <div className="flex flex-wrap gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#5DC4C7' }}></div>
                      <span className="text-sm text-gray-600">Booked</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span className="text-sm text-gray-600">Completed</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <span className="text-sm text-gray-600">Cancelled</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Calendar */}
          <div style={{ backgroundColor: '#FFFFFF' }} className="rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Calendar Toolbar */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => navigateDate(-1)}
                    className="px-4 py-2 border-2 rounded-lg font-medium transition-all hover:text-white"
                    style={{ 
                      borderColor: '#5DC4C7', 
                      color: '#06434D',
                      backgroundColor: 'transparent'
                    }}
                    onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
                      (e.target as HTMLButtonElement).style.backgroundColor = '#5DC4C7';
                      (e.target as HTMLButtonElement).style.color = '#FFFFFF';
                    }}
                    onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
                      (e.target as HTMLButtonElement).style.backgroundColor = 'transparent';
                      (e.target as HTMLButtonElement).style.color = '#06434D';
                    }}
                  >
                    Previous
                  </button>
                  <h2 className="text-2xl font-bold" style={{ color: '#06434D' }}>
                    {getViewTitle()}
                  </h2>
                  <button
                    onClick={() => navigateDate(1)}
                    className="px-4 py-2 border-2 rounded-lg font-medium transition-all hover:text-white"
                    style={{ 
                      borderColor: '#5DC4C7', 
                      color: '#06434D',
                      backgroundColor: 'transparent'
                    }}
                    onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
                      (e.target as HTMLButtonElement).style.backgroundColor = '#5DC4C7';
                      (e.target as HTMLButtonElement).style.color = '#FFFFFF';
                    }}
                    onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
                      (e.target as HTMLButtonElement).style.backgroundColor = 'transparent';
                      (e.target as HTMLButtonElement).style.color = '#06434D';
                    }}
                  >
                    Next
                  </button>
                </div>
                <div className="flex gap-2">
                  {['month', 'week', 'day'].map((v: string) => (
                    <button
                      key={v}
                      onClick={() => setView(v as ViewType)}
                      className={`px-4 py-2 border-2 rounded-lg font-medium transition-all capitalize ${
                        view === v ? 'text-white' : 'hover:text-white'
                      }`}
                      style={{ 
                        borderColor: '#5DC4C7',
                        backgroundColor: view === v ? '#5DC4C7' : 'transparent',
                        color: view === v ? '#FFFFFF' : '#06434D'
                      }}
                      onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
                        if (view !== v) {
                          (e.target as HTMLButtonElement).style.backgroundColor = '#5DC4C7';
                          (e.target as HTMLButtonElement).style.color = '#FFFFFF';
                        }
                      }}
                      onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
                        if (view !== v) {
                          (e.target as HTMLButtonElement).style.backgroundColor = 'transparent';
                          (e.target as HTMLButtonElement).style.color = '#06434D';
                        }
                      }}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Calendar Content */}
            <div className="p-6">
              {view === 'month' && renderMonthView()}
              {view === 'week' && renderWeekView()}
              {view === 'day' && renderDayView()}
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="mt-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6"
            >
              {[
                { name: "Dashboard", route: "/doctor/dashboard", color: "from-[#5DC4C7] to-cyan-500" },
                { name: "Appointments", route: "/doctor/appointment", color:"from-[#5DC4C7] to-cyan-500" },
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
      </div>

      {/* Modal - No Black Overlay */}
      {showModal && selectedEvent && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{ backgroundColor: 'rgba(225, 233, 241, 0.8)' }}>
          <div style={{ backgroundColor: '#FFFFFF' }} className="rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-xl font-bold" style={{ color: '#06434D' }}>
                  Appointment Details
                </h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 text-2xl leading-none transition-colors"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Patient Name
                  </label>
                  <p className="font-semibold text-lg" style={{ color: '#06434D' }}>
                    {selectedEvent.patientName}
                  </p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date
                    </label>
                    <p style={{ color: '#06434D' }}>
                      {formatDate(selectedEvent.date)}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Time Slot
                    </label>
                    <p style={{ color: '#06434D' }}>
                      {selectedEvent.slot}
                    </p>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium capitalize ${getStatusBadgeClass(selectedEvent.status)}`}>
                    {selectedEvent.status}
                  </span>
                </div>
              </div>
              
              <div className="mt-8 flex justify-end gap-3">
                <button
                  onClick={closeModal}
                  className="px-6 py-2 rounded-lg font-medium transition-all text-white"
                  style={{ backgroundColor: '#5DC4C7' }}
                  onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
                    (e.target as HTMLButtonElement).style.backgroundColor = '#06434D';
                  }}
                  onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
                    (e.target as HTMLButtonElement).style.backgroundColor = '#5DC4C7';
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}