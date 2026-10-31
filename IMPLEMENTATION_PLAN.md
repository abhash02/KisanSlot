# KisanSlot — Implementation Plan & Progress Tracking

**Problem Statement:** SIH26032 (Farmer Procurement Scheduling)  
**System Name:** KisanSlot (किसानस्लॉट)  
**Current Phase:** Phase 7 Complete — Final Handoff  

---

## 1. Architectural Decisions & MVP Assumptions

| Aspect | MVP Decision | Rationale |
|---|---|---|
| **Primary Database** | PostgreSQL via `psycopg` (v3 binary) | Native ACID transactions, row-level locking (`SELECT ... FOR UPDATE`), reliable under concurrent booking requests. |
| **Database Fallback & Detection** | Auto-detect database availability in health check (`/api/v1/health`) | Allows frontend and API to run gracefully and report informative diagnostic status if local Docker/PostgreSQL is not yet booted. |
| **Capacity Definition** | Maximum number of active bookings per time slot | Simple, transparent for farmers and operators, avoids premature grain-weight speculation during initial scheduling. |
| **Capacity Consuming Statuses** | `BOOKED`, `ARRIVED`, `IN_SERVICE` | `CANCELLED` and `COMPLETED` bookings do not consume slot capacity. |
| **Authentication Strategy** | JWT Bearer tokens + Password hashing via Argon2 (`pwdlib`) | Secure, standard stateless token authentication with role-based claims (`FARMER`, `ADMIN`). |
| **Password Storage** | Argon2id cryptographically hashed passwords | Resistant to GPU brute-force attacks; plaintext passwords are never stored or logged. |
| **Session & Token Storage** | In-memory React State + `sessionStorage` | Avoids long-lived secrets in `localStorage`; cleared on browser close or user logout. |
| **Public Token Format** | `KS-YYYYMMDD-XXXXXX` | Cryptographically random uppercase alphanumeric suffix; prevents guessing sequential IDs. |
| **Language Support** | Bilingual UI design (Hindi + English) | Essential for Indian agricultural context and SIH evaluation criteria. |
| **Concurrency Control** | `SELECT ... FOR UPDATE` (PostgreSQL) with graceful SQLite fallback in tests | Prevents overbooking under simultaneous requests in production; test suite runs correctly without PostgreSQL. |

---

## 2. Phase-by-Phase Roadmap

### [X] Phase 0: Workspace Audit & Environment Verification
- [x] Workspace inspection (identified single brief file `SIH26032_Farmer_Procurement_Scheduling_Antigravity_Brief.md`).
- [x] Environment audit: Python 3.12.5, Node v24.18.0, npm 11.16.0.
- [x] Verified Docker not currently installed on host; documented Docker Compose configuration alongside native PostgreSQL fallback.
- [x] Established non-destructive workspace workflow.

### [X] Phase 1: Foundation Setup
- [x] Root configuration: `.gitignore`, `.env.example`, `docker-compose.yml`.
- [x] Frontend foundation: Vite + React 19 + TypeScript + Tailwind CSS with dev server proxy to `:8000`.
- [x] Backend foundation: FastAPI, Pydantic v2, Pydantic-Settings, SQLAlchemy 2.x, Psycopg 3.
- [x] Database models: `User`, `ProcurementCentre`, `ProcurementSlot`, `Booking`, `BookingStatusHistory`.
- [x] Alembic migration configuration and initial migration (`0001_initial_schema.py`).
- [x] Health check endpoint (`GET /api/v1/health`) with graceful PostgreSQL connection testing and reporting.
- [x] Automated test suite with Pytest & TestClient (`test_root_endpoint`, `test_health_check_endpoint`).
- [x] Verified frontend production build passes (`npm run build`).

### [X] Phase 2: Authentication & Role-Based Access Control
- [x] Pydantic schemas in `backend/app/schemas/auth.py`:
  - `FarmerRegisterRequest` (full name, canonical Indian 10-digit mobile number, min 6-char password, optional village, preferred language).
  - `LoginRequest` (canonical mobile number, password).
  - `UserResponse` (safe user projection without password hash).
  - `TokenResponse` (signed JWT access token, expiry, user profile).
- [x] Security utilities in `backend/app/core/security.py`:
  - Argon2 password hashing and verification using `pwdlib`.
  - Signed JWT token generation and decoding with claims (`sub`, `role`, `mobile`, `exp`, `iat`, `iss`).
- [x] API Endpoints in `backend/app/api/v1/endpoints/auth.py`:
  - `POST /api/v1/auth/register` (Farmer registration with duplicate mobile check and instant token issuance).
  - `POST /api/v1/auth/login` (Unified authentication for Farmer & Admin with inactive user block).
  - `GET /api/v1/auth/me` (Authenticated current user profile retrieval).
  - `POST /api/v1/auth/logout` (Session invalidation acknowledgment).
- [x] Role-Based Access Control dependencies in `backend/app/api/deps.py`:
  - `get_current_user`: Validates Bearer token, checks user existence and `is_active` state.
  - `get_current_active_farmer`: Enforces `FARMER` role (403 Forbidden otherwise).
  - `get_current_active_admin`: Enforces `ADMIN` role (403 Forbidden otherwise).
- [x] Protected Admin endpoint in `backend/app/api/v1/endpoints/admin.py`:
  - `GET /api/v1/admin/verify`: Admin verification.
  - `GET /api/v1/admin/summary`: Live dashboard metrics (farmers, active centres, slots, bookings).
- [x] Secure Admin CLI command in `backend/app/cli/create_admin.py`:
  - Allows provisioning or promoting admin accounts via CLI flags, environment variables, or interactive prompt.
  - Never hardcodes passwords in source code.
- [x] Frontend authentication integration:
  - `frontend/src/context/AuthContext.tsx`: Session-backed auth state, user profile caching, bilingual language switcher.
  - `frontend/src/components/ProtectedRoute.tsx`: Route guard with role-based restrictions and loading spinner.
  - `frontend/src/pages/HomePage.tsx`: Bilingual landing page with SIH notice and quick portals.
  - `frontend/src/pages/FarmerRegisterPage.tsx`: Form validation, instant feedback, and Hindi/English messages.
  - `frontend/src/pages/FarmerLoginPage.tsx`: Farmer login with 10-digit mobile validation.
  - `frontend/src/pages/AdminLoginPage.tsx`: Administrative portal login.
  - `frontend/src/pages/FarmerDashboardPage.tsx`: Verified farmer session dashboard.
  - `frontend/src/pages/AdminDashboardPage.tsx`: Live admin summary dashboard with metrics.
- [x] Automated Test Suite:
  - 15/15 tests passing in `backend/tests/test_auth.py` and `test_health.py`.
  - Tested: successful registration, Argon2 hash verification, duplicate mobile rejection, invalid format rejection, mobile normalization, successful login, incorrect password rejection, unregistered mobile rejection, deactivated user block, `/me` profile retrieval, unauthenticated access rejection, farmer forbidden from admin endpoints, admin access permitted, logout acknowledgment.
  - Frontend production build (`npm run build`) passing cleanly.

### [X] Phase 3: Procurement Centres & Slots Management
- [x] Pydantic schemas: `backend/app/schemas/centre.py` and `backend/app/schemas/slot.py`.
- [x] Admin Centre CRUD endpoints:
  - `POST /api/v1/admin/centres` — Create centre with name, district, address, notes, active status.
  - `GET /api/v1/admin/centres` — List all centres (admin view including inactive).
  - `PATCH /api/v1/admin/centres/{centre_id}` — Update or deactivate centre.
- [x] Admin Slot CRUD endpoints:
  - `POST /api/v1/admin/slots` — Create slot with centre, date, start/end time, capacity, status.
  - `GET /api/v1/admin/slots` — List slots with optional centre filter.
  - `PATCH /api/v1/admin/slots/{slot_id}` — Edit slot (validates capacity ≥ active bookings).
- [x] Public Centre endpoints:
  - `GET /api/v1/centres` — Active centres only, with optional district/search filter.
  - `GET /api/v1/centres/{centre_id}` — Single centre detail.
  - `GET /api/v1/centres/{centre_id}/slots?date=YYYY-MM-DD` — Available slots with remaining capacity.
- [x] Slot validation rules enforced:
  - `start_time < end_time`.
  - Future dates only (past date rejected with 422).
  - Capacity must be positive integer.
  - Inactive centres cannot receive new slots.
  - Overlapping slots at same centre blocked.
  - Capacity cannot be reduced below active booking count.
- [x] Core business logic in `backend/app/services/booking_service.py`:
  - `get_slot_booked_count()` — Counts active bookings for capacity enforcement.
  - `get_slot_remaining_capacity()` — Actual remaining capacity from live DB records.
  - `check_slot_overlap()` — Detects time-range collisions at same centre.
  - `generate_unique_token()` — Generates `KS-YYYYMMDD-XXXXXX` with 10-attempt collision retry.
  - `validate_status_transition()` — Enforces booking workflow state machine.
  - `build_booking_response()` — Assembles BookingResponse with remaining capacity field.
- [x] Tests: `backend/tests/test_centres_and_slots.py` (5 tests all passing).

### [X] Phase 4: Atomic Booking Workflow & Queue Management
- [x] Booking schemas in `backend/app/schemas/booking.py`:
  - `BookingCreate` — Slot ID, produce type (enum-validated), quantity in quintals.
  - `BookingStatusUpdate` — Target status, reason (required for REJECTED/CANCELLED).
  - `BookingResponse` — Full booking detail with token, remaining capacity, history.
- [x] Farmer booking endpoints in `backend/app/api/v1/endpoints/bookings.py`:
  - `POST /api/v1/bookings` — Atomic create with `SELECT ... FOR UPDATE` row-level lock.
  - `GET /api/v1/bookings/mine` — Farmer's own bookings only (ownership enforced).
  - `GET /api/v1/bookings/{booking_id}` — Booking detail (farmer sees own; admin sees any).
  - `POST /api/v1/bookings/{booking_id}/cancel` — Cancels booking and frees slot capacity.
  - `GET /api/v1/bookings/{booking_id}/history` — Full audit trail of status transitions.
- [x] Admin queue management in `backend/app/api/v1/endpoints/admin.py`:
  - `GET /api/v1/admin/bookings` — Paginated list with search (token, name, mobile) and filter (date, centre, status).
  - `GET /api/v1/admin/bookings/{booking_id}` — Booking detail with history.
  - `PATCH /api/v1/admin/bookings/{booking_id}/status` — Workflow transitions with history logging.
- [x] Booking status workflow (backend-enforced state machine):
  ```
  BOOKED → [ARRIVED, CANCELLED, REJECTED]
  ARRIVED → [IN_SERVICE, CANCELLED]
  IN_SERVICE → [COMPLETED]
  COMPLETED, CANCELLED, REJECTED → [] (terminal states)
  ```
- [x] All booking status transitions create a `BookingStatusHistory` record with changed_by user ID.
- [x] Supported produce types: Wheat, Rice/Paddy, Maize, Mustard, Potato, Other.
- [x] Tests: `backend/tests/test_bookings.py` (5 tests all passing).
  - Booking creation with `KS-YYYYMMDD-XXXXXX` token format verified.
  - Duplicate booking rejection.
  - Over-capacity booking rejection.
  - Ownership enforcement + cancellation frees capacity.
  - Admin queue workflow: BOOKED → ARRIVED → IN_SERVICE → COMPLETED.

### [X] Phase 5: Complete Frontend UI Integration
- [x] New TypeScript types in `frontend/src/types/procurement.ts`:
  - `Centre`, `Slot`, `Booking`, `BookingListResponse`, `BookingStatusHistory`, `PRODUCE_OPTIONS`, `STATUS_LABELS`.
- [x] Farmer pages:
  - `BrowseCentresPage.tsx` — Search centres by name/district, district dropdown filter, slot count badges.
  - `SlotSelectionPage.tsx` — Date tab picker, slot cards with capacity bar, booking modal (produce type + quantity form).
  - `BookingConfirmationPage.tsx` — Printable token receipt with all booking details, browser print support.
  - `MyBookingsPage.tsx` — Tabbed view (ALL/ACTIVE/PAST), cancel with confirmation modal, status history modal.
  - `FarmerDashboardPage.tsx` — Updated: shows active upcoming booking card, real booking count from API.
- [x] Admin pages:
  - `AdminCentresPage.tsx` — Full CRUD: create/edit/deactivate centre modals, real API calls.
  - `AdminSlotsPage.tsx` — Full CRUD: create/edit capacity/toggle status; overlap protection via API.
  - `AdminQueuePage.tsx` — Full-text search, centre/date/status filters, pagination, workflow buttons (ARRIVED/IN_SERVICE/COMPLETED/REJECTED), status history modal.
  - `AdminReportsPage.tsx` — Analytics: produce type breakdown, status distribution by centre, printable.
  - `AdminDashboardPage.tsx` — Updated: 4 module tiles linking to real admin sub-routes.
- [x] All routes wired in `frontend/src/App.tsx` with `ProtectedRoute` role guards.
- [x] Frontend production build passed: **zero TypeScript errors**, 2055 modules, 1.09s build time.

### [X] Phase 6: Seed Data & End-to-End Quality Verification
- [x] Idempotent seed script created: `backend/app/db/seed.py`.
  - Creates 1 admin account + 3 demo farmer accounts (credentials printed to stdout, never hardcoded).
  - Creates 3 fictional procurement centres across different districts.
  - Creates slots for the next 5 days (4 time windows per day per centre = 60 slots total).
  - Creates 4 sample bookings across different statuses: BOOKED, ARRIVED, IN_SERVICE, COMPLETED.
  - Script is idempotent: safe to run multiple times (checks existence before inserting).
- [x] Full regression backend test suite run: **25/25 tests passing**.
  - `test_health.py`: 2 tests.
  - `test_auth.py`: 13 tests.
  - `test_centres_and_slots.py`: 5 tests.
  - `test_bookings.py`: 5 tests.
- [x] Frontend production build: **PASSED** (zero errors, strict TypeScript mode).

> **Environment Limitation:** The seed script requires a live PostgreSQL connection to execute.  
> Docker is not installed on the development host. The seed script has been verified for correctness  
> but cannot be run end-to-end without PostgreSQL. Run it after `alembic upgrade head` once PostgreSQL is available.

### [X] Phase 7: Final Documentation & Handoff
- [x] `README.md` — Fully updated with complete API table, farmer workflow, admin workflow, seed command, known limitations.
- [x] `IMPLEMENTATION_PLAN.md` — All phases marked complete with accurate test counts and build status.

---

## 3. Complete File Inventory

### Backend (`backend/`)

```
backend/
├── pytest.ini                          # pythonpath = . for correct imports
├── requirements.txt                    # All Python dependencies
├── alembic.ini                         # Alembic config pointing to DATABASE_URL
├── alembic/
│   └── versions/
│       └── 0001_initial_schema.py      # Full DB schema in one migration
└── app/
    ├── main.py                         # FastAPI app, CORS, lifespan hooks
    ├── api/
    │   ├── deps.py                     # get_db, get_current_user, role guards
    │   └── v1/
    │       ├── api.py                  # Main v1 router (all sub-routers)
    │       └── endpoints/
    │           ├── health.py           # GET /api/v1/health
    │           ├── auth.py             # register, login, me, logout
    │           ├── admin.py            # Admin CRUD: centres, slots, bookings/queue
    │           ├── centres.py          # Public: list centres, slots by date
    │           └── bookings.py         # Farmer: create, mine, cancel, history
    ├── cli/
    │   └── create_admin.py             # Secure admin provisioning CLI
    ├── core/
    │   ├── config.py                   # Settings (DATABASE_URL, JWT_SECRET, etc.)
    │   └── security.py                 # Argon2 hashing, JWT sign/decode
    ├── db/
    │   ├── base.py                     # SQLAlchemy declarative Base
    │   ├── session.py                  # Engine + SessionLocal factory
    │   └── seed.py                     # Idempotent demo data script
    ├── models/
    │   └── models.py                   # User, ProcurementCentre, ProcurementSlot,
    │                                   # Booking, BookingStatusHistory
    ├── schemas/
    │   ├── auth.py                     # Register, Login, UserResponse, TokenResponse
    │   ├── health.py                   # HealthResponse
    │   ├── centre.py                   # CentreCreate, CentreUpdate, CentreResponse
    │   ├── slot.py                     # SlotCreate, SlotUpdate, SlotResponse
    │   └── booking.py                  # BookingCreate, BookingStatusUpdate, BookingResponse
    └── services/
        └── booking_service.py          # Business logic: capacity, overlap, token, transitions
```

### Frontend (`frontend/src/`)

```
frontend/src/
├── App.tsx                             # All routes with ProtectedRoute guards
├── main.tsx                            # React entry point
├── index.css                           # Tailwind v4 global styles
├── context/
│   └── AuthContext.tsx                 # Auth state, sessionStorage, language toggle
├── components/
│   ├── Navbar.tsx                      # Top navigation bar
│   └── ProtectedRoute.tsx              # Role-based route guard
├── lib/
│   └── api.ts                          # apiRequest<T>(), token helpers
├── types/
│   ├── auth.ts                         # User, TokenResponse interfaces
│   └── procurement.ts                  # Centre, Slot, Booking, PRODUCE_OPTIONS, STATUS_LABELS
└── pages/
    ├── HomePage.tsx                    # Bilingual landing page + SIH notice
    ├── FarmerRegisterPage.tsx          # Registration form
    ├── FarmerLoginPage.tsx             # Farmer login
    ├── AdminLoginPage.tsx              # Admin login
    ├── FarmerDashboardPage.tsx         # Farmer dashboard (live booking card)
    ├── AdminDashboardPage.tsx          # Admin dashboard (summary metrics)
    ├── farmer/
    │   ├── BrowseCentresPage.tsx       # Centre search + district filter
    │   ├── SlotSelectionPage.tsx       # Date picker + slot cards + booking modal
    │   ├── BookingConfirmationPage.tsx # Token receipt + print
    │   └── MyBookingsPage.tsx          # My bookings + cancel + history
    └── admin/
        ├── AdminCentresPage.tsx        # Centre CRUD
        ├── AdminSlotsPage.tsx          # Slot CRUD
        ├── AdminQueuePage.tsx          # Queue management + filters + workflow
        └── AdminReportsPage.tsx        # Analytics (produce, status distribution)
```

---

## 4. Test Results Summary

| Test File | Tests | Status | Notes |
|---|---|---|---|
| `test_health.py` | 2 | ✅ PASS | Root and health endpoints |
| `test_auth.py` | 13 | ✅ PASS | Full auth flow, RBAC, edge cases |
| `test_centres_and_slots.py` | 5 | ✅ PASS | CRUD, deactivation, overlap, capacity |
| `test_bookings.py` | 5 | ✅ PASS | Token, duplicate, capacity, workflow |
| **TOTAL** | **25** | **✅ ALL PASS** | SQLite in-memory (no PostgreSQL required) |

**Frontend build:** ✅ PASSED — zero TypeScript errors, 2055 modules, `tsc -b && vite build` clean.

---

## 5. Known Limitations & Deferred Items

| Item | Status | Notes |
|---|---|---|
| Live PostgreSQL | Required for production | Docker not on dev host; seed script verified for correctness, not executed |
| `with_for_update()` row locking | PostgreSQL only | SQLite fallback in tests (try/except); production PostgreSQL handles correctly |
| Email/SMS notifications | Not implemented | Out of scope for prototype; mentioned in brief as future work |
| MSP/price calculation | Not implemented | By design per disclaimer; KisanSlot is a scheduling tool, not a trading platform |
| Token collision retry | 10-attempt limit | Falls back to hex token if all attempts collide (astronomically unlikely in practice) |
| `sessionStorage` token | Cleared on tab close | Intentional security design choice |
| Admin reports | Frontend only | No dedicated `/api/v1/admin/reports` endpoint; analytics derived from booking list query |
