<p align="center">
  <img src="assets/banner.png" alt="SmileCare Pro Banner" width="100%">
</p>

[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-Ready-FFCA28?style=for-the-badge&logo=firebase)](https://firebase.google.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38B2AC?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](#)

# SmileCare Pro

Enterprise dental clinic management SaaS for appointment scheduling, patient records, doctor coordination, billing, waitlists, and a public patient booking portal.

## Demo Access

This project runs in **portfolio demo mode** with a local mock database.

| Field | Value |
|-------|-------|
| Staff login URL | `/login` |
| Email | `admin@smilecare.com` |
| Password | Not required (demo) |
| Roles | Super Admin, Clinic Owner, Receptionist, Doctor / Staff |

**Public booking portal:** `/book/smilecare-clinic`

## Features

- Patient management with profiles, tags, and visit history
- Doctor scheduling with weekly availability and conflict detection
- Appointment calendar with status workflow and payment tracking
- Public online booking wizard with validation and demo payments
- Patient inquiry pipeline (CRM-style leads)
- Waitlist queue with promotion to appointments
- Reports and analytics with CSV export
- Multi-branch clinic support
- Arabic / English with RTL layout support
- Progressive Web App (PWA)
- Firebase Firestore integration (optional via environment config)

## Tech Stack

- React 19 + TypeScript
- Vite 8
- Tailwind CSS 4
- React Router 7
- Firebase (optional backend)
- Lucide React icons

## Run Locally

```bash
git clone <your-repo-url>
cd Project2_reservation_system
npm install
npm run dev
```

## Build for Production

```bash
npm run build
npm run preview
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
VITE_USE_FIRESTORE=false
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
```

## Project Structure

```
src/
├── components/     # UI pages and shared components
├── context/        # Auth, app state, toasts
├── db/             # Repository layer (mock + Firestore)
├── firebase/       # Firebase configuration
├── types/          # TypeScript domain types
└── utils/          # Adapters, validation, translations
```

## Roadmap

- Production Firebase Authentication
- Email and SMS appointment reminders
- Google Calendar two-way sync
- Insurance verification workflow
- Multi-tenant clinic onboarding

## Author

**Ebram Sherif**

GitHub: https://github.com/ebroboooo
