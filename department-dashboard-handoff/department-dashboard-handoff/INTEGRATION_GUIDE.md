# 🏛️ DEPARTMENT DASHBOARD — MASTER INTEGRATION HANDOFF

> **Builder:** Department Dashboard Antigravity Instance
> **Date:** August 17, 2026
> **Status:** ✅ Production-Ready for Integration

---

## 📋 WHAT WAS BUILT

A complete **Department-side Portal** for all **17 Nagpur Connect departments**. Each department gets a full 5-page operational dashboard:

| Page | Route | Purpose |
|------|-------|---------|
| **Operations Console** | `/department/[code]` | Real-time KPI overview, critical incident alerts, facility roster |
| **Incident Desk** | `/department/[code]/incidents` | Full incident queue with filters, priority scores, detail inspection |
| **Tasks & Dispatch** | `/department/[code]/tasks` | 4-column Kanban dispatch pipeline (Incoming → Assigned → In Progress → Resolved) |
| **Stations & Facilities** | `/department/[code]/workers` | Real GeoJSON-mapped facilities, contact numbers, jurisdictions |
| **Analytics & SLA** | `/department/[code]/analytics` | Response time metrics, SLA compliance, weekly volume histograms |
| **Department Hub** | `/department` | Central hub listing all 17 departments with live incident counts |

### All 17 Departments Supported:
`police`, `fire_brigade`, `ambulance`, `health_dept`, `water_supply`, `electricity`, `road_maintenance`, `waste_management`, `traffic_police`, `environment`, `women_child_safety`, `disaster_management`, `municipal_corp`, `public_works`, `drainage`, `forest_wildlife`, `traffic_management`

---

## 📁 FILE MANIFEST

### 1. Pages (Next.js App Router)

```
src/app/(department)/department/
├── layout.tsx              # Department layout with sidebar, subnav, theme lock
├── page.tsx                # Department Hub — all 17 departments grid
└── [code]/
    ├── page.tsx            # Operations Console per department
    ├── incidents/page.tsx  # Incident Desk with filters & detail modal
    ├── tasks/page.tsx      # Tasks & Dispatch Kanban board
    ├── workers/page.tsx    # Stations & Facilities (GeoJSON-powered)
    └── analytics/page.tsx  # Analytics & SLA telemetry
```

### 2. Components

```
src/components/department/
├── CriticalIncidentPanel.tsx    # Priority incident alert cards
├── DepartmentHeader.tsx         # Department name, icon, critical badge
├── DepartmentNotifications.tsx  # Bell icon notification dropdown
├── DepartmentOpsModule.tsx      # Quick-action tiles & facility roster
├── DepartmentSidebar.tsx        # Left navigation sidebar
├── DepartmentStats.tsx          # KPI metric tiles (4-grid)
├── DepartmentSubNav.tsx         # 5-tab horizontal sub-navigation
├── IncidentCard.tsx             # Individual incident row card
├── IncidentDetail.tsx           # Incident inspection modal (Portal-based)
├── IncidentFeed.tsx             # Incident list container
├── IncidentFilters.tsx          # Status filter pill buttons
└── TaskAssignmentPanel.tsx      # Worker assignment dialog
```

### 3. API Routes

```
src/app/api/department/[code]/
├── incidents/route.ts    # GET — Live incidents from TiDB (incident_departments table)
├── stats/route.ts        # GET — KPI summary (total, critical, pending, resolved counts)
├── facilities/route.ts   # GET — GeoJSON-mapped facilities per department
├── analytics/route.ts    # GET — SLA metrics, response times, weekly volumes
├── tasks/route.ts        # GET — Task queue with status breakdown
└── workers/route.ts      # GET — Worker/station roster
```

### 4. Core Modules

```
src/lib/
└── department-registry.ts  # 17-department registry (name, icon, code, color, helpline)

src/modules/geo/
├── dept-mapping.ts     # Maps department codes → GeoJSON dataset filenames
├── normalizer.ts       # Extracts name, phone, address, zone, officer from GeoJSON features
├── loader.ts           # Parses & caches GeoJSON datasets from data/geodata/
├── types.ts            # TypeScript interfaces for facilities & geo data
├── distance.ts         # Haversine distance calculator
├── jurisdiction.ts     # Zone/jurisdiction resolver
└── router.ts           # Geo-routing logic
```

### 5. GeoJSON Datasets (Official Nagpur Data)

```
data/geodata/
├── nagpur_city_police.geojson                          # 31 police stations
├── nagpur_fire_department.geojson                      # 17 fire stations
├── nagpur_nmc_all_zonal_offices.geojson               # 11 NMC zonal offices
├── nagpur_nmc_water_works.geojson                      # Water pumping stations
├── nagpur_nmc_pwd.geojson                              # PWD divisions
├── nagpur_nmc_solid_waste_management.geojson           # Waste transfer stations
├── nagpur_nmc_electrical.geojson                       # Power substations
├── nagpur_nmc_garden_environment.geojson               # Garden & horticulture
├── nagpur_nmc_zonal_boundaries.geojson                 # Zone polygons
├── nagpur_territorial_forest_dept_clean.geojson        # 11 forest facilities
├── nagpur_transport_dept_govt_only.geojson             # Transport/RTO branches
└── district_women_and_child_development_nagpur.geojson # 10 WCD facilities
```

### 6. CSS Additions (in existing globals.css)

The following CSS scope was added to `src/app/globals.css`:
- `.dept-portal` — Forces pure light mode theme variables for all department routes
- `.font-display` — Plus Jakarta Sans geometric heading typography

---

## 🔗 DEPENDENCIES ON EXISTING CODEBASE

| Dependency | File | What's Used |
|------------|------|-------------|
| **Database** | `src/lib/db.ts` | `query()` function — MySQL/TiDB connection pool |
| **UI Components** | `src/components/ui/index.tsx` | `Badge`, `Button`, `Dialog` (Portal-updated) |
| **Font** | `src/app/layout.tsx` | `Plus_Jakarta_Sans` added alongside existing `Inter` |

### Database Tables Used:
```sql
-- Reads from these existing tables:
SELECT * FROM incident_departments WHERE department_code = ?;
SELECT * FROM incidents WHERE id IN (...);
```

> **NOTE:** No new tables were created. All queries read from the existing `incidents` and `incident_departments` tables that the master codebase already manages.

---

## ⚙️ INTEGRATION STEPS FOR MASTER

### Step 1: Verify File Locations
All files are already in the correct locations within the project. No file moves needed.

### Step 2: Verify `globals.css` Additions
Check that `src/app/globals.css` contains the `.dept-portal` scope block and `.font-display` utility. These do NOT interfere with any existing styles — they are scoped exclusively to department routes via the `(department)` route group layout.

### Step 3: Verify `layout.tsx` Font
Check that `src/app/layout.tsx` imports `Plus_Jakarta_Sans` from `next/font/google` and applies `${jakarta.variable}` on the `<html>` tag.

### Step 4: Verify Dialog Portal
The `Dialog` component in `src/components/ui/index.tsx` was updated to use `createPortal(content, document.body)`. This fixes modal orientation issues across the entire app (not just department pages).

### Step 5: Route Group Isolation
The department routes use Next.js `(department)` route group, meaning:
- They have their own `layout.tsx` that wraps pages in `.dept-portal` scope
- They do NOT affect the Citizen Dashboard or Admin Dashboard layouts
- The sidebar, subnav, and theme lock are self-contained

### Step 6: Test
```bash
npm run dev -- -p 3005
# Visit: http://localhost:3005/department
# Visit: http://localhost:3005/department/police
# Visit: http://localhost:3005/department/ambulance/incidents
```

---

## 🎨 DESIGN DECISIONS

1. **Pure Light Mode** — User requested no dark mode. The `.dept-portal` CSS scope locks all theme variables to white/slate.
2. **Soft Rose Palette** — Priority numbers and alert badges use `rose-600/90` instead of harsh `red-600`.
3. **Plus Jakarta Sans** — Geometric sans-serif for large headings via `.font-display`.
4. **No Mock Data** — All data comes from TiDB database and official GeoJSON datasets.
5. **Portal-Based Modals** — `Dialog` uses `createPortal` to avoid CSS transform containment issues.

---

## ⚠️ WHAT WAS NOT TOUCHED

- ❌ Citizen Dashboard (`src/app/(citizen)/`)
- ❌ Admin Dashboard (`src/app/(admin)/`)
- ❌ AI Engine (`src/modules/ai/`)
- ❌ Authentication (`src/app/api/auth/`)
- ❌ Database schema (no migrations, no new tables)
- ❌ Core notification system
- ❌ Google Sign-In

---

## 📊 QUICK STATS

| Metric | Count |
|--------|-------|
| Total Pages | 6 (Hub + 5 per department) |
| Total Components | 12 |
| Total API Routes | 6 |
| Geo Modules | 7 |
| GeoJSON Datasets | 12 |
| Departments Supported | 17 |
| Database Tables Used | 2 (existing) |
| New Tables Created | 0 |
