import axios from "axios";
import { redirect } from "next/navigation";
import type { Doctor, AdminStats } from "../types/admin";

const API = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_API_URL}/api/admin`,
  withCredentials: true, // ✅ required for sending cookies
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

export const refreshAccessToken = async () => {
  return axios.post(
    `${process.env.NEXT_PUBLIC_API_URL}/api/admin/refresh`,
    {}, // no body needed
    { withCredentials: true } // 🔑 ensures cookie is sent
  );
};


// ✅ Request interceptor — always attach token if present
API.interceptors.request.use((req) => {
  const stored = localStorage.getItem("adminInfo");
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (parsed?.token) {
        req.headers.Authorization = `Bearer ${parsed.token}`;
      }
    } catch (e) {
      console.error("Invalid adminInfo JSON", stored);
      localStorage.removeItem("adminInfo");
    }
  }
  return req;
});


// ✅ Response interceptor — auto-refresh token if 401 occurs
API.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config;

    if (err.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (isRefreshing) {
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

      isRefreshing = true;
      try {
        const { data } = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/api/admin/refresh`,
          {},
          { withCredentials: true }
        );

        // ✅ Consistent with backend: 'accessToken'
        const newToken = data.accessToken;
        localStorage.setItem("adminInfo", JSON.stringify({ token: newToken }));
        API.defaults.headers.common.Authorization = `Bearer ${newToken}`;
        processQueue(null, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return API(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem("adminInfo");

        if (typeof window !== "undefined") {
          window.location.href = "/admin/sign-in";
        } else {
          redirect("/admin/sign-in");
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(err);
  }
);


// --- Admin API functions --- //

export const adminLogin = async (data: { email: string; password: string }) => {
  const { data: resData } = await API.post("/login", data);

  // ✅ Store the actual token returned by backend
  localStorage.setItem("adminInfo", JSON.stringify({ token: resData.token }));

  return resData;
};

export const adminLogout = async () => {
  try {
    await API.post("/logout", {}, { withCredentials: true });
  } finally {
    localStorage.removeItem("adminInfo");
    if (typeof window !== "undefined") {
      window.location.href = "/admin/sign-in";
    }
  }
};

export const getDoctors = () => API.get<Doctor[]>("/doctors");
export const getStats = () => API.get<AdminStats>("/stats");
export const createDoctor = (data: Doctor) => API.post<Doctor>("/doctors", data);
export const updateDoctor = (id: string, data: Partial<Doctor>) =>
  API.put<Doctor>(`/doctors/${id}`, data);
export const deleteDoctor = (id: string) => API.delete(`/doctors/${id}`);
export const toggleDoctorStatus = (id: string, isActive: boolean) =>
  API.patch(`/doctors/${id}/status`, { isActive });
export const validateToken = () => API.get<{ valid: boolean }>("/validate-token");
export const getAnalytics = () => API.get("/analytics");


export default API;
