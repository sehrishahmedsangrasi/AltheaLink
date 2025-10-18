

export interface Doctor {
  _id: string;
  name: string;
  email: string;
  specialization: string;
  role: "doctor" | "admin";
  isActive: boolean;
  createdAt: string;
  picture?: string;
  displayId?: string;
}



export interface PopularSpecialization {
  _id: string; 
  count: number;
}


export interface AdminStats {
  totalDoctors: number;
  popularSpecializations: PopularSpecialization[];
  availableDoctors: {
    _id: string;
    name: string;
    specialization?: string;
  }[];
}

export interface AdminLoginResponse {
  _id: string;
  name: string;
  email: string;
  role: "admin";
  token: string;
}
