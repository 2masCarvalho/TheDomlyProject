# Claude Code Prompt — Property Management SaaS Feature Build

## Context

I have an existing property management SaaS MVP built with Supabase as the backend. The app already has basic CRUD operations for: creating and managing condominiums, asset management, and a dashboard. The frontend is Next.js / React and uses Supabase for auth, database, and storage.

I need you to build three new core feature modules on top of the existing codebase. These features solve real pain points validated through customer discovery interviews with Portuguese property management companies.

---

## Feature 1: Maintenance Job Posting & Technician Matching

### Problem
Property managers spend most of their day cold-calling technicians for ad-hoc repairs. Technicians frequently cancel last-minute. There is no structured system — just phone calls and hope.

### What to build

**Database tables (Supabase):**
- `maintenance_jobs` — id, condominium_id (FK), title, description, category (enum: plumbing, electrical, locksmith, painting, HVAC, general), urgency (enum: critical, high, medium, low), status (enum: open, assigned, in_progress, completed, cancelled), created_by (FK to auth.users), assigned_technician_id (FK, nullable), created_at, updated_at, completed_at
- `technicians` — id, name, email, phone, specialties (text array), availability_status (enum: available, busy, unavailable), average_rating (numeric), total_jobs_completed (int), location/zone (text), created_at
- `job_applications` — id, job_id (FK), technician_id (FK), proposed_price (numeric, nullable), message (text), status (enum: pending, accepted, rejected), created_at

**Frontend:**
- A form for property managers to create a maintenance job (select condominium, category, urgency, description)
- A job board/list view showing all open jobs with filters by status, urgency, category, and condominium
- A job detail page showing: job info, list of technician applications, ability to assign/accept a technician
- A simple technician list/directory page with their specialties, rating, and availability
- A technician profile page where you can see their history and add/edit their info

**Matching logic:**
- When a job is created, show a "Suggested Technicians" list filtered by: matching specialty to job category, availability_status = available, sorted by average_rating descending
- Keep it simple — no need for AI matching, just filtered queries

**Status flow:**
- open → assigned (when manager picks a technician) → in_progress (technician confirms start) → completed OR cancelled at any point

---

## Feature 2: Occurrence/Issue Tracking with Priority Management

### Problem
Managers juggle 100+ occurrences across buildings with no way to prioritize or categorize. They can't distinguish what's the condominium's responsibility vs. an individual tenant's responsibility. They lose track of status using Asana/Excel.

### What to build

**Database tables:**
- `occurrences` — id, condominium_id (FK), title, description, category (enum: structural, plumbing, electrical, elevator, common_area, fire_safety, other), responsibility (enum: condominium, tenant), priority (enum: critical, high, medium, low), status (enum: reported, triaged, in_progress, resolved, closed), reported_by (text — name or unit number), linked_maintenance_job_id (FK, nullable — to connect to Feature 1), notes (text), created_at, updated_at, resolved_at

**Frontend:**
- A form to report a new occurrence (select condominium, category, responsibility, priority, description)
- An occurrence dashboard/list with:
  - Filter by: condominium, category, responsibility, priority, status
  - Sort by: priority (critical first), date created
  - Color-coded priority badges (red/orange/yellow/green)
- Occurrence detail page with: full info, ability to update status, add notes, and optionally link to a maintenance job (Feature 1)
- A summary widget on the main dashboard showing: total open occurrences, breakdown by priority, breakdown by responsibility (condominium vs tenant)

**Key interaction:**
- From an occurrence, the manager should be able to click "Create Maintenance Job" which pre-fills a new maintenance job form with the occurrence details. This links Feature 1 and Feature 2 together.

---

## Feature 3: Asset & License Registry per Building

### Problem
Managers can't easily see which assets, licenses, and contracts (fire extinguishers, SADI/SADC systems, gas inspections, solar panels, insurance policies) are tied to which building. They don't know when the next maintenance or renewal is due without digging through files.

### What to build

**Database tables (extend existing asset tables if they exist, or create):**
- `building_assets` — id, condominium_id (FK), asset_name, asset_type (enum: fire_extinguisher, sadi_system, sadc_system, gas_inspection, solar_panel, insurance, elevator_license, other), location_in_building (text, nullable), installation_date (date, nullable), last_maintenance_date (date, nullable), next_maintenance_date (date, nullable), expiry_date (date, nullable), responsible_company (text, nullable), company_contact (text, nullable), status (enum: active, expired, pending_renewal, decommissioned), notes (text), created_at, updated_at

**Frontend:**
- Asset list view per condominium: a table showing all assets for a selected building, filterable by asset_type and status
- Color-coded expiry/maintenance alerts: red if overdue, orange if due within 30 days, green if OK
- Asset detail/edit page
- A dashboard widget showing: "Upcoming Maintenance/Renewals" — list of assets across ALL condominiums where next_maintenance_date or expiry_date is within the next 30/60/90 days, sorted by urgency
- Ability to bulk-add assets for a condominium (e.g., add 20 fire extinguishers at once with shared attributes)

---

## General Instructions

- Use the existing Supabase project and auth setup. Create new tables via Supabase migrations or the SQL editor.
- Set up Row Level Security (RLS) policies on all new tables — only authenticated users who own/manage the condominium should access its data.
- Follow the existing code patterns and component library already in the project.
- Keep the UI clean, functional, and consistent with the existing dashboard style.
- Use Supabase realtime subscriptions if the existing app already uses them, otherwise standard queries are fine.
- Add proper loading states, error handling, and empty states for all new pages.
- Make sure all lists are paginated or use infinite scroll if the existing app does.
- All enums should be implemented as Supabase enums or as TypeScript union types — be consistent with what the project already uses.
- Connect the three features: occurrences can generate maintenance jobs, maintenance jobs reference condominiums and technicians, assets belong to condominiums.

---

## Build Order
1. Start with the database schema — create all tables and RLS policies first
2. Build Feature 3 (Asset Registry) — simplest, extends existing CRUD patterns
3. Build Feature 2 (Occurrence Tracking) — medium complexity
4. Build Feature 1 (Maintenance Jobs + Technician Matching) — most complex, depends on having data in the system
5. Add the dashboard widgets and cross-feature links last
