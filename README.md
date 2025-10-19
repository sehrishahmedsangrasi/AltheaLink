# 🏥 AltheaLink — Full-Stack Healthcare Appointment System

A modern healthcare booking platform that allows patients to schedule appointments with doctors via form or **voice commands**. Built using **Next.js**, **Node.js**, and **MongoDB**, with JWT authentication, email confirmations, and AI-powered voice booking.

---

## 🚀 Overview

**AltheaLink** enables patients to book appointments easily through a web interface or Eleven Labs voice AI. Admins and doctors manage availability, appointments, and analytics through role-based dashboards.

---

## 👥 User Roles

### 🛠️ Admin
- Full control of the system.
- Add/edit/delete doctors.
- Enable/disable accounts.
- View analytics (doctor count, top specializations).

### 👨‍⚕️ Doctor
- Login required (JWT protected).
- View/manage own appointments.
- Track completed or missed visits.
- Manage daily availability slots (30-min blocks).
- Prevent double booking in real-time.

### 👩‍💻 Patient
- No login needed — open access.
- Browse doctors by specialization, date, or time.
- Book appointments via **form or voice**.
- Get instant **email confirmation**.

---

## 📅 Appointment Flow

1. **Browse Doctors** → Filter by specialization/date/time.  
2. **Book Appointment** → Fill form or use voice AI.  
3. **Backend Processing** → Validates slot and saves data.  
4. **Email Confirmation** → Sent via Nodemailer/Resend.  

---

## 🔐 Authentication & Authorization
| Role | Auth Type | Access |
|------|------------|---------|
| Admin | JWT | Full system |
| Doctor | JWT | Own dashboard |
| Patient | None | Public access |

- Secure JWT tokens (access + refresh).
- Role-protected routes:
  - `/admin/dashboard`
  - `/doctor/dashboard`

---

## 📧 Email Notifications
- Automated confirmation on booking.  
- Sent via **Nodemailer** or **Resend API**.  
- Includes appointment details (doctor, date, time).

---

## 🎙️ Voice Booking (Eleven Labs Integration)
- Voice-based booking via AI widget.  
- Collects user details (name, email, time, symptoms).  
- Sends payload to backend webhook (`/book-appointment`).  
- Checks slot availability → books or prompts reselect.

---

## 🧱 Tech Stack

| Layer | Stack |
|--------|--------|
| Frontend | Next.js + TypeScript + Tailwind + ShadCN |
| Backend | Node.js + Express.js |
| Database | MongoDB + Mongoose |
| Auth | JWT (access + refresh tokens) |
| Email | Nodemailer / Resend |
| Voice | Eleven Labs AI |
| Deployment | Vercel (Frontend), Render/Railway (Backend) |

---

## 🧩 Final Deliverables
- Responsive full-stack app  
- Role-based dashboards  
- Voice + form booking system  
- Email confirmation  
- Secure REST APIs  
- MongoDB integration  
- Deployed version (Frontend + Backend)

---

## 💡 Project by: Sehrish Sangrasi
Part of **Full-Stack Development Bootcamp (Final Project)**.
