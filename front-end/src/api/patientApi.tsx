import axios from "axios";

export const patientAPI = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_API_URL}/api/public`,
});

// --- API Functions --- //

export const fetchDoctors = async () => {
  const { data } = await patientAPI.get("/doctors");
  return data;
};


export const fetchDoctorSlots = async (id: string, date: string) => {
  const { data } = await patientAPI.get(`/doctors/${id}/slots`, { params: { date } });
  return data.slots; // ✅ return only array
};


export const bookAppointment = async (formData: {
  name: string;
  email: string;
  phone: string;
  doctorId: string;
  date: string;
  time: string;
  symptoms?: string;
}) => {
  const { data } = await patientAPI.post("/book", formData);
  return data;
};

export const getTopDoctors = async () => {
  const res = await patientAPI.get("/top-doctors");
  return res.data;
};
