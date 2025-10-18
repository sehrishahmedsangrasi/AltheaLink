export interface Appointment {
  _id: string;
  patientName: string;
  date: string;       
  slot: string;       
  status: "booked" | "done" | "missed" | "cancelled";
  symptoms?: string;  
}

export interface DoctorStats {
  totalAppointments: number;
  todayAppointments: number;
  missedAppointments: number;
  completedAppointments: number;
  nextAppointment?: Appointment;
}

export interface Slot {
  _id: string;
  time: string;        
  status: "available" | "booked"| "unavailable";
}
