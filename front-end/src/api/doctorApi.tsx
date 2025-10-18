import axios from "axios";

// ✅ Doctor API instance
const API = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_API_URL}/api/doctor`,
  withCredentials: true, // 👈 include cookies automatically (important for refresh)
});

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

// ✅ Automatically attach JWT access token
API.interceptors.request.use((req) => {
  const user = localStorage.getItem("doctorInfo");
  if (user) {
    req.headers.Authorization = `Bearer ${JSON.parse(user).token}`;
  }
  return req;
});

// ✅ Handle 401 errors (access token expired → try refresh)
API.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config;

    if (err.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (isRefreshing) {
        // Wait until refresh is done
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(API(originalRequest));
            },
            reject,
          });
        });
      }

      const user = localStorage.getItem("doctorInfo");
      if (!user) {
        window.location.href = "/doctor/sign-in";
        return Promise.reject(err);
      }

      try {
        isRefreshing = true;

        // ✅ No need to send body → cookie is auto included (withCredentials)
        const { data } = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/api/doctor/refresh`,
          {},
          { withCredentials: true }
        );

        // ✅ Update access token in localStorage
        const parsed = JSON.parse(user);
        const newUser = { ...parsed, token: data.accessToken };
        localStorage.setItem("doctorInfo", JSON.stringify(newUser));

        // ✅ Update headers
        API.defaults.headers.common.Authorization = `Bearer ${data.accessToken}`;
        processQueue(null, data.accessToken);

        // Retry original request
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return API(originalRequest);
      } catch (refreshError) {
        console.error("❌ Doctor refresh failed:", refreshError);
        processQueue(refreshError, null);
        localStorage.removeItem("doctorInfo");
        window.location.href = "/doctor/sign-in";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(err);
  }
);

//
// ----------------- DOCTOR API FUNCTIONS ----------------- //
//

import type { Appointment, DoctorStats } from "../types/doctor";

// ✅ Login
export const doctorLogin = (data: { email: string; password: string }) =>
  API.post("/login", data);

// ✅ Logout
export const doctorLogout = async () => {
  try {
    await API.post("/logout", {}, { withCredentials: true });
  } finally {
    localStorage.removeItem("doctorInfo");
    window.location.href = "/doctor/sign-in";
  }
};

// ✅ Appointments
export const getAppointments = () => API.get<Appointment[]>("/appointments");
export const updateAppointmentStatus = (
  id: string,
  status: "done" | "missed"
) => API.patch(`/appointments/${id}/status`, { status });

// ✅ Stats
export const getDoctorStats = () => API.get<DoctorStats>("/stats");

// ✅ Schedule
export const getSlots = (date: string) => API.get(`/schedule?date=${date}`);

// ✅ Availability
export const setAvailability = (
  date: string,
  ranges: { start: string; end: string }[]
) => API.post("/availability", { date, ranges });

// ✅ Profile
export const getDoctorProfile = () => API.get("/profile");

// ✅ Picture update
export const updateDoctorPicture = (pictureUrl: string) =>
  API.patch("/profile/picture", { picture: pictureUrl });

// ✅ Change password
export const changeDoctorPassword = (
  currentPassword: string,
  newPassword: string
) =>
  API.patch("/profile/password", {
    currentPassword,
    newPassword,
  });

// ✅ Verify token (optional helper)
export const verifyDoctorToken = async (token: string) => {
  try {
    const { data } = await API.get("/validate-token", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  } catch {
    return { valid: false };
  }
};

export default API;
