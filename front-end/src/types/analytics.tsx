export interface DoctorAnalytics {
  _id: string;
  name: string;
  specialization: string;
  patientCount: number;
}

export interface SpecializationAnalytics {
  _id: string;
  totalPatients: number;
}

export interface AppointmentAnalytics {
  _id: string; 
  count: number;
}

export interface AnalyticsData {
  totalDoctors: number;
  totalPatients: number;
  totalAppointments: number;
  popularDoctors: DoctorAnalytics[];
  popularSpecializations: SpecializationAnalytics[];
  monthlyAppointments: AppointmentAnalytics[];
}
