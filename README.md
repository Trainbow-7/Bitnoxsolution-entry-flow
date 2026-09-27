<div align="center">

# 🏢 Bitnoxsolution VMS

### Visitor Management System

**A modern, role-based digital visitor management platform built for Bitnoxsolution — replacing paper registers with real-time, analytics-driven visitor tracking.**

[![License: Proprietary](https://img.shields.io/badge/License-Proprietary-red.svg)](LICENSE)
[![Stack: React + Node.js](https://img.shields.io/badge/Stack-React%20%2B%20Node.js-blue.svg)](#-tech-stack)
[![DB: PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-336791.svg)](#-tech-stack)

</div>

---

## 📋 Overview

Bitnoxsolution operates two distinct businesses from a single reception area:

| Business Unit | Description |
|---|---|
| 🎓 **Technology Training Institute** | Bootcamps, courses, student advising, labs |
| 👔 **Dry Cleaning Service** | Garments, silk/wool care, express laundry, pickups |

Previously, every visitor signed a manual paper register capturing only a name and timestamp — with zero insight into *why* they were visiting or *which* business they came for. This system replaces that entirely, capturing structured visitor data at the point of entry and giving management full, real-time visibility across both business units.

---

## ✨ Features

### 🚪 Check-In Options

| Mode | Description |
|---|---|
| **Manual Entry** | Receptionist-assisted check-in for walk-in visitors |
| **QR Self-Service** | Visitors scan a QR code on their phone and complete their own form |
| **Returning Visitor Quick Check-In** | Lightweight QR flow for frequent Tech Institute trainees — captures name, phone, and time only |
| **Barcode Scan** | Reusable visitor cards/badges for instant identity + timestamp on return visits |

### 📡 Operations & Monitoring

- 🟢 Real-time **"Currently In Office"** view
- ⏰ **Overstay alerts** — automatic popup notifications when a visitor exceeds their stated expected duration, prompting front desk follow-up
- 📌 Visitor status tracking: **In Progress → Completed / Cancelled**

### 📊 Admin & Analytics

- Executive dashboard with visitor trends, peak-hour analysis, and purpose/department breakdowns
- Staff load tracking (visitor volume per staff member)
- Searchable, filterable visitor history log
- Downloadable reports (PDF / Excel) — daily, weekly, monthly, and department-specific templates
- Full audit trail of all check-ins, check-outs, and record edits

### 🔐 Access Control

- Role-based interfaces scoped to each user's responsibilities
- **Server-side enforced permissions** — not just UI-level hiding
- Staff members only ever see visitors assigned to them; Admin has unrestricted visibility across all business units

---

## 👥 Roles & Permissions

| Role | Access |
|---|---|
| 🖥️ **Receptionist** | Check-in terminal (all modes), currently-in-office view, visitor history log |
| 👤 **Staff** | Their own assigned visitors and personal visit history only |
| 👑 **Admin / CEO** | Full platform access — dashboard, reports, staff & user management, audit log, settings |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React (TypeScript) + Vite |
| **Backend** | Node.js / Express (REST API) |
| **Database** | PostgreSQL (via Prisma ORM) |
| **Real-time** | WebSockets |
| **Auth** | JWT (role-based) |
| **UI Theme** | Dark, dashboard-style component system |

---

## 📂 Project Structure

```
bitnoxsolution-vms/
├── frontend/               # React + TypeScript client
│   └── src/
│       ├── components/     # Reusable UI components
│       ├── pages/          # Route-level page components
│       ├── api/            # API client & request helpers
│       ├── context/        # Auth context & global state
│       └── types.ts        # Shared frontend types
│
├── backend/                # Express REST API server
│   ├── prisma/             # Database schema & seed data
│   └── src/
│       ├── controllers/    # Route handler logic
│       ├── routes/         # Express route definitions
│       ├── middleware/      # Auth & permission guards
│       ├── services/       # Business logic (e.g. overstay detection)
│       └── utils/          # Helpers & audit logging
│
├── shared/                 # Types shared between frontend & backend
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [PostgreSQL](https://www.postgresql.org/) (running locally or hosted)

### Installation

```bash
# Clone the repository
git clone https://github.com/Trainbow-7/Bitnoxsolution-entry-flow.git
cd Bitnoxsolution-entry-flow

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### Environment Setup

Create a `.env` file in the `backend/` directory:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/bitnoxsolution_vms
JWT_SECRET=your_jwt_secret_here
PORT=5000
```

### Running the Project

```bash
# 1. Run database migrations
cd backend
npx prisma migrate dev

# 2. Seed the database (optional)
npm run prisma:seed

# 3. Start the backend server
npm run dev

# 4. In a separate terminal, start the frontend
cd frontend
npm run dev
```

Frontend runs at `http://localhost:5180` · Backend runs at `http://localhost:5000`

---

## 🗺️ Roadmap

- [ ] Automated staff notifications (email/SMS) on visitor arrival
- [ ] Visitor badge printing
- [ ] Automated data archiving based on configurable retention policies
- [ ] Integration with third-party CRM / accounting systems

---

## 📄 License

This project is **proprietary software** developed exclusively for **UAV HUB SYSTEMS LTD / Bitnoxsolution**.  
All rights reserved. Unauthorized use, reproduction, or distribution is strictly prohibited.

---

## 📧 Contact

For questions or support, contact the project maintainer at **tplusonice@gmail.com**
