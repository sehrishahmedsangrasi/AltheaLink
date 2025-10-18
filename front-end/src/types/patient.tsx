// types/patient.ts

export interface Doctor {
  _id: string;
  name: string;
  email: string;
  specialization?: string;
  phone?: string;
  picture?: string | null;
  isActive: boolean;
  createdAt: string;
  role: "doctor";
  displayId?: string;
  patientCount?: number;
  fee?: number;
}

export interface AvailabilityRange {
  start: string; 
  end: string;   
}

export interface Availability {
  _id: string;
  doctor: string; 
  date: string;   
  ranges: AvailabilityRange[];
  createdAt: string;
}

export type AppointmentStatus = "booked" | "done" | "missed" | "cancelled";

export interface Appointment {
  _id: string;
  patientName: string;
  patientEmail?: string;
  patientPhone?: string;
  doctor: string; 
  date: string;   
  slot: string;   
  symptoms?: string;
  status: AppointmentStatus;
  createdAt: string;
}

export interface SlotResponse {
  slots: string[];
}
