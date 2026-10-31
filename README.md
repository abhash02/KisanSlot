# KisanSlot (किसानस्लॉट) — Farmer Procurement Scheduling

[![SIH Problem Statement](https://img.shields.io/badge/SIH-SIH26032-green.svg)](#)
[![Python](https://img.shields.io/badge/Python-3.12-blue.svg)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8.3-646cff.svg)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v4-38bdf8.svg)](https://tailwindcss.com)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-336791.svg)](https://www.postgresql.org)
[![Tests](https://img.shields.io/badge/Tests-25%20passing-brightgreen.svg)](#running-automated-checks)

> **Important Demonstration Notice:**  
> KisanSlot is an educational web application MVP built for **Smart India Hackathon Problem Statement SIH26032**. It is a scheduling prototype designed to streamline farmer visits to procurement centres and prevent crowding. It is **not** an official government portal, does not process real MSP monetary transactions, and does not replace official state agricultural marketing systems.

---

## Project Overview

KisanSlot solves a key logistical problem in India's agricultural procurement: farmers travelling long distances to mandis/procurement centres only to find overcrowded facilities or no available processing capacity. KisanSlot allows:

- **Farmers** to register, browse nearby procurement centres, select available time slots, and receive a unique booking token before visiting.
- **Admins (Mandi Officers)** to create and manage procurement centres, configure time slots with capacity limits, and manage farmer queues on the day of procurement.

The system prevents overbooking at the database level using PostgreSQL transactions, maintains a complete audit trail of every booking status change, and supports Hindi/English bilingual UI designed for rural users with limited technical exposure.

---

## Architecture Overview

```
KisanSlot/
├── docker-compose.yml           # PostgreSQL 16 local database service
├── .env.example                 # Shared environment variable blueprint
├── IMPLEMENTATION_PLAN.md       # Detailed phase progress and decisions
├── frontend/                    # React 19 + TypeScript + Vite + Tailwind CSS v4
│   ├── src/
│   │   ├── components/          # Navbar, ProtectedRoute
│   │   ├── context/             # AuthContext (JWT state + sessionStorage)
│   │   ├── lib/                 # apiRequest<T>() client with JWT bearer interceptor
│   │   ├── pages/               # All pages: Home, Auth, Farmer journey, Admin portal
│   │   ├── types/               # TypeScript interfaces (auth.ts, procurement.ts)
│   │   ├── App.tsx              # Main routing setup with ProtectedRoute guards
│   │   ├── index.css            # Tailwind v4 styles
│   │   └── main.tsx             # React application root
│   ├── package.json
│   └── vite.config.ts           # Vite configuration with API reverse proxy (:5173 → :8000)
└── backend/                     # Python 3.12 + FastAPI + SQLAlchemy 2.x
    ├── alembic.ini              # Database migration configuration
    ├── alembic/                 # Migration scripts
    ├── pytest.ini               # Test configuration (pythonpath = .)
    ├── requirements.txt
    └── app/
        ├── main.py              # FastAPI entrypoint, CORS, lifespan hooks
        ├── api/
        │   ├── deps.py          # get_db, get_current_user, role guard dependencies
        │   └── v1/
        │       ├── api.py       # Main v1 router
        │       └── endpoints/   # health, auth, admin, centres, bookings
        ├── cli/                 # create_admin.py — secure admin provisioning
        ├── core/                # config.py, security.py (Argon2 + JWT)
        ├── db/                  # session.py, base.py, seed.py
        ├── models/              # SQLAlchemy ORM models
        ├── schemas/             # Pydantic v2 schemas
        ├── services/            # booking_service.py (core business logic)
        └── tests/               # Pytest test suite (25 tests)
```

---

## Database Schema

```
User
├── id (UUID PK)
├── full_name
├── mobile_number (unique, indexed, 10-digit canonical)
├── password_hash (Argon2id)
├── role (FARMER | ADMIN)
├── village (optional)
├── preferred_language (hi | en)
├── is_active
└── created_at

ProcurementCentre
├── id (UUID PK)
├── name
├── district
├── address
├── notes (optional)
├── is_active
└── created_at

ProcurementSlot
├── id (UUID PK)
├── centre_id (FK → ProcurementCentre)
├── date (DATE)
├── start_time (TIME)
├── end_time (TIME)
├── capacity (INT > 0)
├── status (OPEN | CLOSED | CANCELLED)
└── created_at

Booking
├── id (UUID PK)
├── token (unique, KS-YYYYMMDD-XXXXXX)
├── farmer_id (FK → User)
├── slot_id (FK → ProcurementSlot)
├── produce_type (Wheat | Rice/Paddy | Maize | Mustard | Potato | Other)
├── quantity_quintals (FLOAT > 0)
├── status (BOOKED | ARRIVED | IN_SERVICE | COMPLETED | CANCELLED | REJECTED)
├── admin_notes (optional)
└── created_at

BookingStatusHistory
├── id (UUID PK)
├── booking_id (FK → Booking)
├── old_status
├── new_status
├── changed_by (FK → User)
├── reason (optional)
└── changed_at
```

---

## Prerequisites

| Dependency | Version Tested | Notes |
|---|---|---|
| Python | 3.12.5 | 3.11+ required |
| Node.js | v24.18.0 | v20+ required |
| npm | 11.16.0 | Bundled with Node |
| PostgreSQL | 15+ | Via Docker or local install |

---

## Setup & Running Instructions (Windows PowerShell)

### Step 1: Copy Environment Configuration

```powershell
Copy-Item .env.example .env
# Edit .env with your SECRET_KEY and DB credentials if needed
```

The `.env.example` uses safe defaults for local development. Generate a strong `SECRET_KEY`:
```powershell
# Generate a 64-char random secret key:
python -c "import secrets; print(secrets.token_hex(32))"
```

---

### Step 2: Start PostgreSQL Database

#### Option A: Using Docker (Recommended)
```powershell
docker compose up -d
# PostgreSQL will be available on localhost:5432
```

#### Option B: Using Local PostgreSQL Installation
If Docker is not installed:
1. Install PostgreSQL from [postgresql.org](https://www.postgresql.org/download/windows/)
2. Open SQL Shell (`psql`) or PowerShell and run:
   ```sql
   CREATE USER kisanslot WITH PASSWORD 'kisanslot_secret';
   CREATE DATABASE kisanslot_db OWNER kisanslot;
   GRANT ALL PRIVILEGES ON DATABASE kisanslot_db TO kisanslot;
   ```
3. Update `DATABASE_URL` in `.env` if your port or credentials differ from the default.

---

### Step 3: Set Up Python Backend

```powershell
cd backend

# Create virtual environment (first time only)
python -m venv .venv

# Install dependencies
.venv\Scripts\pip install -r requirements.txt

# Run database migrations
.venv\Scripts\alembic upgrade head
```

---

### Step 4: Provision an Administrator Account

Administrator accounts are **never hardcoded** in source files. Create one securely:

```powershell
# Interactive mode (prompts for name, mobile, and hidden password input):
.venv\Scripts\python -m app.cli.create_admin

# Or pass arguments non-interactively (for demo/CI setup):
.venv\Scripts\python -m app.cli.create_admin --name "Mandi Officer" --mobile "9000011111" --password "AdminPass123"
```

---

### Step 5: Load Demo Data (Optional)

```powershell
# Idempotent — safe to run multiple times
.venv\Scripts\python -m app.db.seed
```

This creates:
- 1 admin account + 3 demo farmer accounts (credentials printed to terminal)
- 3 fictional procurement centres (Karnal, Ambala, Panipat districts)
- 60 time slots across the next 5 days (4 windows per day per centre)
- 4 sample bookings in different statuses: BOOKED, ARRIVED, IN_SERVICE, COMPLETED

---

### Step 6: Start the Backend API

```powershell
.venv\Scripts\uvicorn app.main:app --reload --port 8000
```

| URL | Description |
|---|---|
| `http://localhost:8000/` | API root |
| `http://localhost:8000/docs` | Interactive Swagger UI |
| `http://localhost:8000/api/v1/health` | Health + database connectivity |

---

### Step 7: Start the Frontend

Open a **second PowerShell terminal**:

```powershell
cd frontend

# Install dependencies (first time only)
npm install

# Start Vite dev server
npm run dev
```

Open: **http://localhost:5173/**

---

## API Endpoints Reference

### Public Endpoints (No Authentication Required)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/health` | System and database connectivity check |
| `POST` | `/api/v1/auth/register` | Farmer registration (mobile + name + password) |
| `POST` | `/api/v1/auth/login` | Authenticate Farmer or Admin |
| `GET` | `/api/v1/centres` | List active procurement centres (search/filter) |
| `GET` | `/api/v1/centres/{centre_id}` | Single centre detail |
| `GET` | `/api/v1/centres/{centre_id}/slots` | Available slots for a centre on a date (`?date=YYYY-MM-DD`) |

### Authenticated — Any Role

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/auth/me` | Current user profile |
| `POST` | `/api/v1/auth/logout` | Terminate session |

### Authenticated — Farmer Only

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/bookings` | Create a booking (returns unique `KS-YYYYMMDD-XXXXXX` token) |
| `GET` | `/api/v1/bookings/mine` | List own bookings |
| `GET` | `/api/v1/bookings/{booking_id}` | Own booking detail |
| `POST` | `/api/v1/bookings/{booking_id}/cancel` | Cancel own booking |
| `GET` | `/api/v1/bookings/{booking_id}/history` | Status change audit trail |

### Authenticated — Admin Only

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/admin/verify` | Verify admin permissions |
| `GET` | `/api/v1/admin/summary` | Dashboard metrics (farmers, centres, slots, bookings) |
| `POST` | `/api/v1/admin/centres` | Create procurement centre |
| `GET` | `/api/v1/admin/centres` | List all centres (including inactive) |
| `PATCH` | `/api/v1/admin/centres/{centre_id}` | Update or deactivate centre |
| `POST` | `/api/v1/admin/slots` | Create time slot |
| `GET` | `/api/v1/admin/slots` | List slots (filter by centre) |
| `PATCH` | `/api/v1/admin/slots/{slot_id}` | Edit slot (validates capacity ≥ active bookings) |
| `GET` | `/api/v1/admin/bookings` | Paginated booking list (search + filter) |
| `GET` | `/api/v1/admin/bookings/{booking_id}` | Booking detail with history |
| `PATCH` | `/api/v1/admin/bookings/{booking_id}/status` | Advance booking through workflow |

---

## Authentication Design

- **Password hashing:** Argon2id via `pwdlib` — plaintext passwords are never stored or logged.
- **Tokens:** Signed JWTs with claims: `sub` (user ID), `role`, `mobile`, `exp`, `iat`, `iss`.
- **Token storage:** `sessionStorage` in the browser — cleared automatically when the tab is closed.
- **Role enforcement:** Entirely on the backend (`get_current_active_farmer`, `get_current_active_admin` FastAPI dependencies). Frontend role checks are UI conveniences only.
- **Inactive users:** Users with `is_active = False` cannot authenticate.
- **Admin provisioning:** CLI-only (`python -m app.cli.create_admin`). No self-registration for admins.

---

## Booking Status Workflow

```
                ┌─────────────┐
                │   BOOKED    │ ◄── POST /api/v1/bookings
                └──────┬──────┘
          ┌────────────┼────────────┐
          ▼            ▼            ▼
     [ARRIVED]   [CANCELLED]   [REJECTED]  (Admin action)
          │
          ▼
    [IN_SERVICE]
          │
          ▼
    [COMPLETED]
```

- **BOOKED, ARRIVED, IN_SERVICE** consume slot capacity.
- **CANCELLED, COMPLETED** free capacity (farmer can rebook).
- Every transition creates a `BookingStatusHistory` record with timestamp and responsible user.

---

## Farmer Workflow (Step by Step)

1. Visit `http://localhost:5173/`
2. Click **"किसान पंजीकरण"** (Farmer Registration) — enter full name, 10-digit mobile, password, optional village.
3. After registration/login, land on the **Farmer Dashboard**.
4. Click **"केंद्र खोजें"** (Browse Centres) — search by name or district.
5. Select a centre → choose a date using the date tabs → view available slots with remaining capacity bars.
6. Click a slot → fill in produce type and quantity → confirm booking.
7. **Booking Confirmation page:** shows unique token `KS-YYYYMMDD-XXXXXX` — print or screenshot.
8. On the day of visit, show the token at the procurement centre.
9. Track status in **"मेरी बुकिंग"** (My Bookings) — cancel if needed.

---

## Admin Workflow (Step by Step)

1. Visit `http://localhost:5173/admin/login`
2. Log in with admin credentials (created via CLI).
3. **Admin Dashboard** — view live summary: farmers, centres, slots, bookings.
4. **Centre Management** — create centres (name, district, address), edit, deactivate.
5. **Slot Management** — create time slots for active centres; set capacity; open/close/cancel slots.
6. **Queue Management** — on procurement day:
   - Search by token number or farmer mobile.
   - Filter by centre, date, status.
   - Mark farmer ARRIVED → IN_SERVICE → COMPLETED.
   - Reject or cancel with a reason if needed.
7. **Reports** — view produce type breakdown and status distribution.

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `postgresql+psycopg://kisanslot:kisanslot_secret@localhost:5432/kisanslot_db` | PostgreSQL connection string |
| `SECRET_KEY` | *(generate with `secrets.token_hex(32)`)* | JWT signing key — **must be changed in production** |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `480` | JWT expiry (8 hours) |
| `BACKEND_CORS_ORIGINS` | `http://localhost:5173` | Allowed frontend origins |
| `APP_ENV` | `development` | Environment name |

---

## Running Automated Checks

### Backend Tests

```powershell
cd backend
.venv\Scripts\pytest
```

**Current result: 25 passed in ~110 seconds** (Argon2 hashing is intentionally slow; this is correct).

> Tests use SQLite in-memory via dependency injection — no live PostgreSQL required to run them.

```
test_health.py              2 passed
test_auth.py               13 passed
test_centres_and_slots.py   5 passed
test_bookings.py            5 passed
TOTAL                      25 passed
```

### Frontend Type Check + Production Build

```powershell
cd frontend
npm run build
```

**Current result: Passed** — zero TypeScript errors, zero build warnings, 2055 modules, ~1.09s.

---

## Recommended Demo Sequence (SIH Evaluation)

```powershell
# 1. Start PostgreSQL (docker compose up -d or local PostgreSQL)

# 2. Run migrations
cd backend
.venv\Scripts\alembic upgrade head

# 3. Create an admin account
.venv\Scripts\python -m app.cli.create_admin --name "Admin Officer" --mobile "7987285097" --password "Admin@123"

# 4. Load demo data (3 centres, 60 slots, 4 sample bookings, 3 demo farmers)
.venv\Scripts\python -m app.db.seed

# 5. Start backend API
.venv\Scripts\uvicorn app.main:app --reload --port 8000

# 6. In a second terminal — start frontend
cd frontend
npm run dev
```

Open **http://localhost:5173** and demonstrate:

| Step | Action | Expected Result |
|---|---|---|
| 1 | Home page | Bilingual landing, SIH notice, two portal buttons |
| 2 | Farmer register (new mobile) | Immediate login, dashboard |
| 3 | Browse Centres | 3 demo centres listed with district and slot count |
| 4 | Select centre → pick tomorrow → select 8AM–10AM slot | Slot card with capacity bar |
| 5 | Book: Wheat, 45 quintals | Confirmation page with `KS-YYYYMMDD-XXXXXX` token |
| 6 | Print token | Browser print dialog |
| 7 | My Bookings | Status = BOOKED; cancel option available |
| 8 | Admin login (7987285097 / Admin@123) | Admin dashboard with summary metrics |
| 9 | Admin Queue → search by token | Farmer's booking appears |
| 10 | Mark ARRIVED → IN_SERVICE → COMPLETED | Status progresses; history trail visible |
| 11 | Admin Reports | Produce type and status distribution charts |
| 12 | Attempt to reduce slot capacity below active bookings | 400 error with explanation |

---

## Known Limitations

| Limitation | Notes |
|---|---|
| **Live PostgreSQL required** | Seed script and actual data persistence require PostgreSQL 15+. Tests run without it via SQLite in-memory. |
| **No email/SMS notifications** | Out of scope for prototype. Token is displayed on screen and can be printed. |
| **No MSP/price calculation** | KisanSlot is a scheduling tool, not a trading platform. Pricing is determined by the mandi on arrival. |
| **sessionStorage only** | JWT token cleared on browser tab close. This is an intentional security decision, not a bug. |
| **Reports are frontend-only** | The Reports page aggregates from the booking list query; there is no dedicated `/api/v1/admin/reports` endpoint. |
| **Row-level locking** | `SELECT ... FOR UPDATE` works in PostgreSQL. The SQLite test environment has a graceful fallback for test compatibility. |
| **Docker not required** | Local PostgreSQL installation is fully supported (see Step 2 Option B above). |

---

## Technology Stack

| Layer | Technology | Version |
|---|---|---|
| Frontend Framework | React | 19 |
| Build Tool | Vite | 8.3 |
| UI Styling | Tailwind CSS | v4 |
| Language | TypeScript | 5.x |
| Backend Framework | FastAPI | 0.115+ |
| Language | Python | 3.12 |
| ORM | SQLAlchemy | 2.x |
| Database Driver | psycopg | 3 (binary) |
| Database | PostgreSQL | 15+ |
| Migrations | Alembic | 1.x |
| Password Hashing | pwdlib (Argon2) | — |
| Authentication | python-jose (JWT) | — |
| Testing | pytest + httpx | — |
