# SIH26032 — Farmer Procurement Scheduling
## Master Build Brief for Google Antigravity

**Project type:** Web application MVP  
**Problem statement ID:** SIH26032  
**Working name:** KisanSlot  
**Purpose:** Help farmers schedule visits to a procurement centre to sell their produce, reduce crowding and waiting time, and let administrators manage available slots and the queue.

> Important: Treat this document as the project requirements and implementation plan. First inspect the existing workspace. If code already exists, preserve useful work and adapt it rather than overwriting it blindly. Build a working, testable MVP—not just a static UI.

---

# 1. Instructions to the Antigravity Agent

You are the lead full-stack engineer for this project. Work carefully, in small verifiable steps.

1. Inspect the current workspace, installed tools, and existing files before making changes.
2. If the workspace is empty, initialize the project using the architecture below.
3. Create and maintain a `README.md`, `.env.example`, and `IMPLEMENTATION_PLAN.md`.
4. Do not use Supabase, Firebase, Appwrite, or another Backend-as-a-Service. The backend must be our own Python application.
5. Use **React + TypeScript + Vite + Tailwind CSS** for the frontend.
6. Use **Python + FastAPI + SQLAlchemy** for the backend.
7. Use **PostgreSQL** as the primary database. Provide a Docker Compose configuration for local PostgreSQL. If Docker is unavailable, document a local PostgreSQL setup. Do not silently replace PostgreSQL with SQLite for the final architecture.
8. Use Alembic for database migrations and Pydantic for API validation.
9. Use environment variables for secrets and configuration. Never commit real passwords, API keys, or secret tokens.
10. Implement real backend endpoints and database persistence. Do not make the entire application rely on hardcoded arrays or browser local storage.
11. Build the app in phases. At the end of each phase, run relevant checks, fix errors, and report what passed and what remains.
12. Do not claim a feature works unless it has been implemented and tested.
13. Never expose admin credentials or secrets in frontend source code.
14. Do not publish/deploy the app automatically. Do not run destructive database commands or delete user data without explicit approval.
15. Prefer simple, maintainable code over unnecessary abstractions or microservices.
16. If a requirement is ambiguous, make the safest reasonable MVP decision, record it in `IMPLEMENTATION_PLAN.md`, and continue without blocking on nonessential questions.
17. Before adding dependencies, check whether the project already has an equivalent installed package.

---

# 2. Product Summary

Build **KisanSlot**, a mobile-friendly farmer procurement scheduling web app.

A farmer should be able to:
- Register and sign in.
- View procurement centres and the slots they offer.
- Select a produce type, quantity, centre, and available slot.
- Book a slot.
- Receive a unique booking/token number.
- View current booking status and token details.
- Cancel an eligible booking.
- Use the interface in clear Hindi, with an English option if practical.

An administrator should be able to:
- Sign in through a protected admin role.
- Create and manage procurement centres.
- Create and open/close time slots with capacity limits.
- View and search bookings.
- Change booking status through a controlled workflow.
- Manage the queue and mark a booking as arrived, in service, completed, or cancelled.
- View summary counts and basic reports.

The MVP should be suitable for a student project demonstration. It must clearly distinguish a prototype from a government-authorized procurement service. Do not imply actual MSP rates, official procurement availability, or government integration unless explicitly implemented and verified.

---

# 3. User Roles and Permissions

## 3.1 Farmer
- Can register and log in.
- Can view public procurement centres and available slots.
- Can create bookings for their own account.
- Can see only their own bookings and token/status information.
- Can cancel only their own eligible booking.
- Cannot access admin pages or admin APIs.
- Cannot modify capacity, token numbers, status history, or another farmer's data.

## 3.2 Admin
- Must authenticate.
- Can access admin dashboard and protected management endpoints.
- Can create/update/deactivate centres.
- Can create, edit, open, close, or cancel slots, subject to safe validation.
- Can view bookings across the system.
- Can update booking statuses according to the workflow.
- Can view basic operational reports.

## 3.3 Authentication and authorization
- Hash passwords using a recognised password-hashing library such as Argon2 via `pwdlib` or an equivalent maintained option.
- Use secure, expiring authentication. Prefer HttpOnly, Secure-in-production cookies with CSRF protection if implementing cookie auth; alternatively, use short-lived access tokens with a clearly documented storage strategy. Do not store long-lived secrets in localStorage.
- Enforce role and ownership checks on the backend, not just by hiding frontend buttons.
- Add basic rate limiting or login throttling if practical for the MVP.
- Never create a publicly accessible default admin account with a hardcoded password. Provide a documented CLI/seed command that creates an admin from environment-provided credentials, or prompt the developer to create one locally.

---

# 4. Core User Journeys

## Journey A — Farmer booking
1. Farmer opens the home page.
2. Farmer registers or signs in.
3. Farmer chooses a procurement centre.
4. App shows dates and slots with remaining capacity.
5. Farmer selects produce type and enters quantity.
6. App validates the input and confirms the selected slot is available.
7. Farmer confirms booking.
8. Backend reserves capacity atomically and creates a unique token.
9. Farmer sees a confirmation page with booking ID/token, centre, date, time, produce, quantity, and status.
10. Farmer can revisit “My Bookings” to see the current status.

## Journey B — Admin manages capacity
1. Admin signs in.
2. Admin creates or selects a procurement centre.
3. Admin creates a slot with date, start/end time, and maximum capacity.
4. Slot becomes visible to farmers when open and future-dated.
5. As bookings arrive, remaining capacity is calculated from active bookings.
6. Admin can close a slot to prevent new bookings.
7. The system must not allow active bookings to exceed the slot capacity.

## Journey C — Check-in and queue
1. Farmer arrives at the centre and presents the booking token.
2. Admin searches for or selects the booking.
3. Admin marks it `ARRIVED`, then `IN_SERVICE`, then `COMPLETED`.
4. Farmer sees updated status in My Bookings after refresh or polling.
5. Cancelled or completed bookings do not consume active booking capacity.

## Journey D — Cancellation
1. Farmer selects an eligible upcoming booking.
2. Backend verifies ownership and that the booking is not already arrived, in service, or completed.
3. Booking status changes to `CANCELLED`.
4. Capacity becomes available again.
5. The status change is recorded in the booking history.

---

# 5. Scope and Priorities

## Must-have (MVP)
- Responsive farmer-facing web UI.
- Farmer registration and login.
- Protected admin login and role-based permissions.
- Procurement centre listing/details.
- Slot creation and capacity management.
- Slot availability and booking flow.
- Unique booking/token number.
- My Bookings with status.
- Admin booking list, search, filters, and status updates.
- Booking history/audit trail.
- PostgreSQL persistence.
- Backend validation and atomic capacity protection.
- Seed data for a local demonstration.
- README with setup and test instructions.
- Basic automated backend tests.

## Should-have (only after MVP works)
- Hindi/English language toggle.
- CSV export of admin booking reports.
- Printable token/booking receipt.
- Simple dashboard charts.
- Queue number within a slot, distinct from booking ID.
- SMS/WhatsApp notification integration only if a provider is configured; otherwise show an in-app notification and document this limitation.

## Not in initial scope
- Real payments.
- Government or procurement-agency integration.
- Real-time MSP data feeds.
- AI crop grading, price prediction, or crop disease diagnosis.
- Aadhaar collection or sensitive identity document storage.
- GPS tracking.
- Native Android app.
- Complex blockchain features.
- Production deployment without user approval.

---

# 6. Functional Requirements

## 6.1 Public landing page
Show:
- Project name and clear purpose.
- “Book a Procurement Slot” primary action.
- “Check Booking Status” or “My Bookings” action.
- How it works in 3 short steps.
- Benefits: planned visits, reduced crowding, transparent status.
- Notice that this is a demonstration prototype and not an official government portal.
- Language toggle if feasible.

Avoid claiming that farmers must use the app themselves in a real-world deployment. For the prototype, provide a simple farmer interface; note in documentation that assisted booking through a centre operator, kiosk, or phone support could be added for low-digital-literacy users.

## 6.2 Registration and profile
Collect only necessary fields:
- Full name
- Mobile number (validate format, but do not require OTP unless an SMS provider is configured)
- Password
- Village (optional)
- Preferred language (optional)

Do not collect Aadhaar, bank account details, or unrelated personal data.

## 6.3 Procurement centres
Each centre should have:
- Name
- District/area
- Address or landmark
- Operating days or notes (optional)
- Active/inactive status

Use fictional seed data clearly marked as demo data. Do not present demo centres as real, verified government centres.

## 6.4 Produce and quantity
- Provide an editable list of common produce types, e.g. wheat, rice/paddy, maize, mustard, potato, and other.
- Quantity must be a positive number.
- Display the unit explicitly (default quintal); allow a configurable unit if needed.
- Do not calculate or promise procurement prices in the MVP.
- Add clear validation and helpful Hindi error messages.

## 6.5 Slots and capacity
A slot contains:
- Centre ID
- Date
- Start time
- End time
- Capacity (number of bookings or farmers; make the chosen meaning explicit)
- Status: `OPEN`, `CLOSED`, `CANCELLED`
- Optional notes

For MVP, define capacity as **maximum number of active bookings**, not total tonnage. State this in the admin UI.

Rules:
- Start time must be before end time.
- Date/time must be valid.
- Capacity must be a positive integer.
- Do not permit bookings for closed, cancelled, or past slots.
- Do not reduce a slot's capacity below its current active bookings.
- Do not delete a slot that has bookings; close/cancel it and preserve history.
- Prevent duplicate overlapping slots for the same centre if possible, or at minimum warn and validate overlaps.
- Remaining capacity = capacity − count of bookings in capacity-consuming statuses.
- Define capacity-consuming statuses consistently (e.g. `BOOKED`, `ARRIVED`, `IN_SERVICE`); cancelled/completed bookings should not consume future capacity. For the simple MVP, completed bookings are excluded from the future slot capacity count, while their history remains stored.

## 6.6 Booking and token
On booking:
- Validate user authentication.
- Validate slot is open, future-dated, and has capacity.
- Validate produce and quantity.
- Prevent duplicate submission caused by double-clicks or network retries.
- Reserve capacity in a database transaction with appropriate row locking or another safe concurrency strategy.
- Generate a unique, non-guessable booking reference, e.g. `KS-YYYYMMDD-XXXXXX`; use a cryptographically secure random component and enforce uniqueness in the database.
- Do not use a sequential ID alone as a public token.
- Optionally assign a queue number within a slot. If queue numbers are implemented, enforce uniqueness per slot.
- Show a booking receipt page with a printable layout.
- Do not claim the booking guarantees procurement or a price; it reserves a time slot only.

## 6.7 Booking status workflow
Use explicit enum values:
- `BOOKED`
- `ARRIVED`
- `IN_SERVICE`
- `COMPLETED`
- `CANCELLED`
- `REJECTED` (optional, with a reason)

Allowed transitions:
- `BOOKED` → `ARRIVED`, `CANCELLED`, `REJECTED`
- `ARRIVED` → `IN_SERVICE`, `CANCELLED` only if admin explicitly permits it and reason is recorded
- `IN_SERVICE` → `COMPLETED`
- `COMPLETED`, `CANCELLED`, and `REJECTED` are terminal
- Admin status changes require a reason for rejection/cancellation when appropriate.
- Every status change must create a history record with timestamp, actor, old status, new status, and optional note.
- A farmer must not be able to set their own booking to `COMPLETED` or `ARRIVED`.

---

# 7. Recommended Technical Architecture

## Frontend
- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- TanStack Query or a simple, well-structured API client
- React Hook Form + Zod for forms if useful
- Accessible UI components; avoid overloading the project with dependencies.

## Backend
- Python 3.11+ (use the installed supported Python version where possible)
- FastAPI
- Uvicorn
- SQLAlchemy 2.x
- Alembic
- Pydantic 2.x
- PostgreSQL driver: `psycopg` or a compatible maintained driver
- Password hashing: `pwdlib[argon2]` or a maintained equivalent
- Pytest + HTTPX for tests

## Database entities
At minimum:
1. `users`
   - id (UUID)
   - full_name
   - mobile_number (unique)
   - password_hash
   - role (`FARMER`, `ADMIN`)
   - village (nullable)
   - preferred_language
   - is_active
   - created_at, updated_at

2. `procurement_centres`
   - id (UUID)
   - name
   - district
   - address
   - notes
   - is_active
   - created_at, updated_at

3. `procurement_slots`
   - id (UUID)
   - centre_id (foreign key)
   - slot_date
   - start_time
   - end_time
   - capacity (positive integer)
   - status (`OPEN`, `CLOSED`, `CANCELLED`)
   - notes
   - created_at, updated_at

4. `bookings`
   - id (UUID)
   - public_token (unique)
   - farmer_id (foreign key)
   - slot_id (foreign key)
   - produce_type
   - quantity
   - quantity_unit (e.g. quintal)
   - status
   - queue_number (nullable)
   - created_at, updated_at

5. `booking_status_history`
   - id (UUID)
   - booking_id (foreign key)
   - actor_id (foreign key)
   - old_status (nullable on creation)
   - new_status
   - note
   - created_at

Use database constraints and indexes for uniqueness, foreign keys, positive capacity/quantity, common filter fields, and status queries. Use migrations for schema changes.

---

# 8. API Design

Use `/api/v1` prefix. Return consistent JSON errors with useful messages and appropriate HTTP status codes.

## Authentication
- `POST /api/v1/auth/register` — create farmer account.
- `POST /api/v1/auth/login` — authenticate.
- `POST /api/v1/auth/logout` — clear session/token if applicable.
- `GET /api/v1/auth/me` — current user profile.

## Public centres and slots
- `GET /api/v1/centres` — list active centres.
- `GET /api/v1/centres/{centre_id}` — centre details.
- `GET /api/v1/centres/{centre_id}/slots?date=YYYY-MM-DD` — list bookable slots and remaining capacity.

## Farmer bookings
- `POST /api/v1/bookings` — create booking.
- `GET /api/v1/bookings/mine` — current farmer's bookings.
- `GET /api/v1/bookings/{booking_id}` — own booking details; optionally allow lookup by public token only with safe additional verification.
- `POST /api/v1/bookings/{booking_id}/cancel` — cancel own eligible booking.
- `GET /api/v1/bookings/{booking_id}/history` — own booking status history.

## Admin
- `GET /api/v1/admin/summary` — counts for dashboard.
- `POST /api/v1/admin/centres` — create centre.
- `PATCH /api/v1/admin/centres/{centre_id}` — update/deactivate centre.
- `POST /api/v1/admin/slots` — create slot.
- `PATCH /api/v1/admin/slots/{slot_id}` — update/close slot.
- `GET /api/v1/admin/bookings` — search/filter bookings by date, centre, status, token, farmer mobile/name.
- `GET /api/v1/admin/bookings/{booking_id}` — detail and history.
- `PATCH /api/v1/admin/bookings/{booking_id}/status` — transition status with reason/note.
- `GET /api/v1/admin/reports/bookings.csv` — optional CSV export.

Pagination must be used for admin booking lists. Validate all query parameters and request bodies.

---

# 9. UI/UX Requirements

Design a polished but practical interface for Indian farmers and centre administrators.

## Visual direction
- Clean, trustworthy, agriculture-inspired visual design.
- Use a calm green primary color with warm neutral backgrounds and high-contrast text.
- Large tap targets, readable type, clear labels, simple cards, and limited clutter.
- Mobile-first layout; must work at 360px width and desktop.
- Use icons consistently; do not rely on color alone to convey status.
- Provide loading, empty, success, and error states.
- Avoid fake live data, fake testimonials, unnecessary animations, and excessive gradients.
- Keep forms short and errors written in simple Hindi/English.
- Ensure keyboard navigation and visible focus styles.

## Pages
1. Landing page
2. Farmer registration
3. Farmer login
4. Farmer home/dashboard
5. Browse centres
6. Choose slot and book
7. Booking confirmation / printable token
8. My bookings
9. Booking detail and status history
10. Admin login
11. Admin dashboard
12. Manage centres
13. Manage slots
14. Manage bookings / queue
15. Basic reports

## Status presentation
Show a clear text label and optional icon for each status:
- Booked — “बुकिंग हो गई”
- Arrived — “किसान केंद्र पर पहुँच गया”
- In Service — “प्रक्रिया जारी है”
- Completed — “प्रक्रिया पूरी”
- Cancelled — “रद्द”
- Rejected — “अस्वीकृत”

If a Hindi/English toggle is included, ensure all major navigation, form labels, errors, and status messages are translated consistently. Do not implement a toggle that only changes a few headings.

---

# 10. Security, Reliability, and Data Integrity

- Validate every input on the backend, even if the frontend validates it too.
- Use parameterized ORM queries; never construct SQL using user-provided string concatenation.
- Enforce authentication, role checks, and object ownership in API dependencies.
- Use database transactions for booking and status changes.
- Prevent overbooking under concurrent requests using row-level locking or an equivalent database-safe method.
- Enforce unique public tokens in the database and retry safely if a collision occurs.
- Configure CORS only for the actual local frontend origin during development; avoid permissive production wildcards.
- Keep secrets in `.env`, excluded from version control.
- Include `.env.example` with placeholder values only.
- Avoid logging passwords, access tokens, or unnecessary personal data.
- Return user-friendly errors without leaking stack traces.
- Add indexes for frequently queried dates, statuses, centre IDs, farmer IDs, and tokens.
- Keep an audit trail for booking status changes.
- Do not store Aadhaar or bank details.
- Add database health check and clear startup errors if PostgreSQL is unavailable.

---

# 11. Demo Data and Setup

Provide an idempotent seed script for clearly fictional demo data:
- 2–3 demo procurement centres.
- Slots across a few future dates with different capacities.
- A few demo bookings in different statuses.
- A documented process to create a demo farmer and admin securely.

Do not hardcode admin credentials in frontend code. If credentials are shown for a local demo, read them from environment variables or print a one-time local setup message, and clearly label them as local-only demo credentials.

Use UTC for stored timestamps and display dates/times in the configured local timezone consistently. Slot date and local centre time should be represented clearly to avoid timezone confusion.

Required local developer files:
- `README.md`
- `.env.example`
- `.gitignore`
- `docker-compose.yml`
- `IMPLEMENTATION_PLAN.md`
- Backend dependency file (`pyproject.toml` or `requirements.txt`)
- Frontend `package.json`
- Alembic configuration and initial migration
- Tests for critical booking rules

---

# 12. Testing Requirements

Write and run tests for at least:
1. Farmer can register with valid data.
2. Duplicate mobile number is rejected.
3. Invalid quantity is rejected.
4. Farmer cannot access admin endpoints.
5. Farmer cannot view or cancel another farmer's booking.
6. Closed slot cannot be booked.
7. Past slot cannot be booked.
8. Full slot cannot be booked.
9. Two simultaneous bookings cannot exceed capacity.
10. Successful booking returns a unique public token.
11. Eligible cancellation frees capacity.
12. Invalid status transition is rejected.
13. Every status change creates a history record.
14. Admin can create a centre and slot.
15. Decreasing capacity below active bookings is rejected.

If a test cannot run because the environment lacks PostgreSQL or Docker, state that limitation explicitly. Do not mark it as passed. Use a test database configured for integration tests where feasible.

Also verify:
- Frontend production build succeeds.
- Backend imports and starts.
- API docs load at `/docs` in development.
- Farmer and admin flows work end-to-end locally.
- No secrets are tracked by Git.
- Mobile layout is usable at narrow viewport widths.

---

# 13. Implementation Phases

## Phase 0 — Workspace audit
- Inspect files and environment.
- Report current status and proposed file structure.
- Identify installed Python/Node/Docker versions.
- Preserve existing work.

## Phase 1 — Foundation
- Create frontend and backend structure.
- Add PostgreSQL Docker Compose.
- Configure environment variables.
- Add health endpoint.
- Add SQLAlchemy connection and Alembic initial migration.
- Confirm frontend and backend can start.

## Phase 2 — Authentication and roles
- Implement farmer registration/login/logout/me.
- Implement admin creation command.
- Add authorization dependencies.
- Add tests.

## Phase 3 — Centres and slots
- Implement centre CRUD for admin.
- Implement slot CRUD and validation.
- Implement public centre and slot availability endpoints.
- Test capacity calculations and date validation.

## Phase 4 — Booking workflow
- Implement atomic booking creation.
- Implement token generation and printable receipt.
- Implement My Bookings, cancellation, status history.
- Implement admin search and queue status changes.
- Test race conditions and transitions.

## Phase 5 — Frontend integration
- Build all required pages.
- Connect all pages to actual APIs.
- Add loading/error/empty states.
- Add responsive mobile layouts.
- Add Hindi labels and status messages.

## Phase 6 — Seed data and quality checks
- Seed demo centres, slots, and bookings.
- Run backend tests and frontend build.
- Fix all reproducible issues.
- Verify authorization and overbooking protection.

## Phase 7 — Final handoff
- Update README with exact commands for Windows PowerShell and common terminal use.
- Document architecture, schema, API routes, test commands, demo setup, and known limitations.
- Provide a concise report: features completed, tests passed/failed/not run, remaining work, and how to run locally.
- Do not deploy without explicit approval.

---

# 14. Suggested Repository Structure

```text
kisanslot/
├── README.md
├── IMPLEMENTATION_PLAN.md
├── .env.example
├── .gitignore
├── docker-compose.yml
├── frontend/
│   ├── package.json
│   ├── vite.config.ts
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── features/
│   │   ├── pages/
│   │   ├── lib/
│   │   ├── hooks/
│   │   ├── types/
│   │   └── main.tsx
│   └── ...
└── backend/
    ├── pyproject.toml
    ├── alembic.ini
    ├── alembic/
    ├── app/
    │   ├── main.py
    │   ├── core/
    │   ├── api/
    │   ├── models/
    │   ├── schemas/
    │   ├── services/
    │   ├── repositories/
    │   └── db/
    └── tests/
```

Keep the structure pragmatic; do not create empty abstractions solely to match this tree.

---

# 15. Definition of Done

The MVP is done only when all of these are true:
- A farmer can register, log in, view centres and slots, book a slot, receive a token, and view booking status.
- An admin can securely log in, manage centres/slots, view bookings, and update queue status.
- Data persists in PostgreSQL after restarting the app.
- Slot capacity cannot be exceeded, including simultaneous booking attempts.
- Unauthorized users cannot access admin functions or other farmers' bookings.
- Status changes are recorded in history.
- The app works on a mobile-width viewport and desktop.
- Backend tests and frontend build have been run, with results documented honestly.
- Setup instructions are complete and reproducible on the developer's machine.
- No external service is required other than the locally configured PostgreSQL database for the MVP.

---

# 16. First Prompt to Execute

Start now with **Phase 0 and Phase 1 only**. Inspect the workspace and available environment first. Then create the project foundation and PostgreSQL setup without overwriting existing work. Run the checks you can run. Do not start all later phases in one uncontrolled pass. At the end, tell me:
1. What you found in the workspace.
2. Files created or changed.
3. Exact commands to start PostgreSQL, backend, and frontend on Windows.
4. Checks that passed, failed, or could not run.
5. The next phase you recommend.

Do not deploy or publish anything.
