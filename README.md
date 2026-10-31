# Sentinel City Intelligence — Multi-Hazard Early Warning & Civic Command Platform

> An AI-powered, multi-hazard early warning and urban intelligence platform extending **Urban Link** across **Mumbai (BMC)**, **Pune (PMC)**, and **Nagpur (NMC)**. Grounded in verified telemetry, municipal spatial assets, and official disaster control protocols.

---

## 🏛️ System Overview

**Sentinel City Intelligence** bridges real-time environmental earth observation (Doppler radar precipitation, air quality index, river discharge, coastal storm surge, seismology) with municipal emergency response and citizen civic management.

### Key Capabilities
- **Citizen Safety Hub (`/[city]/sentinel`)**: Real-time localized weather and environmental condition cards, direct hotlines to municipal emergency cells, verified disaster shelter locators, and a conversational **Sentinel Safety Assistant** powered by Groq (`openai/gpt-oss-120b`).
- **Admin Command Centre (`/admin/[city]`)**: Unified city command overview with live multi-hazard risk scoring, connector health monitoring, and priority incident triage.
- **Geospatial Incident & Hazard Map (`/admin/[city]/map`)**: Leaflet map supporting 5 basemap providers, live weather tickers, and toggleable vector layers (35 Mumbai recurrent flood hotspots, 15 terrain depression basins, 88 km arterial drainage nullahs, and coastal surge zones).
- **Human-in-the-Loop Alert Review Modal (`?tab=alerts`)**: CAP-compliant administrative review and broadcast engine before sirens or push notifications are dispatched.
- **Monsoon Downpour Simulation Engine (`?tab=simulation`)**: Hydrological stress-test module evaluating 25, 50, and 85 mm/h downpours against actual terrain slope and drainage bottlenecks, watermarked with `[SIMULATION SCENARIO]`.
- **Department Operations Console (`/department/[city]/[dept]`)**: Tailored operational context (e.g. Drainage Roster Protocol, rainfall thresholds, and pumping station inspection rules) preserving existing ticket desks and shift dispatchers.
- **Preserved Urban Link Core**: 53 original routes, citizen incident reporting wizard, AssemblyAI voice input, 17 department desks, and worker shift dispatch remain 100% operational with 0 regressions.

---

## 🚀 Tech Stack

- **Framework**: Next.js 16.3.1 (App Router, Turbopack) & React 19
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS v4 & PostCSS
- **Database**: TiDB Cloud Serverless / MySQL 8.0 via `mysql2`
- **Authentication**: Auth.js / NextAuth v5 Beta with JWT sessions and RBAC
- **AI & NLP**: Groq SDK (`openai/gpt-oss-120b` with `llama-3.3-70b-versatile` fallback)
- **Voice / Speech**: AssemblyAI real-time and file transcription
- **GIS & Mapping**: Leaflet 1.9, React-Leaflet 5, MapLibre GL
- **Earth Observation & Telemetry**: Open-Meteo API, USGS Earthquake API, Sachet NDMA Integration
- **Alert Dispatch**: Web-Push VAPID, EmailJS notifications

---

## 📁 Repository Structure

```
├── data/                       # Spatial GeoJSONs, terrain profiles, dossiers
│   ├── geodata/                # Nagpur municipal spatial boundaries & infrastructure
│   ├── mumbai/                 # BMC wards, drainage, flood hotspots & elevation
│   ├── pune/                   # PMC zonal assets & department coordinates
│   └── dossiers/               # Synthesized multi-hazard simulation scenario archives
├── src/
│   ├── app/                    # Next.js 16 App Router pages and API routes
│   │   ├── (admin)/            # Central administrative incident & alert management
│   │   ├── (citizen)/          # Citizen dashboard, tracking, and reporting flows
│   │   ├── (department)/       # Department operations, incident queue & roster
│   │   ├── (public)/           # Authentication, guest portal & emergency hotlines
│   │   ├── (worker)/           # Field operative task execution and evidence submission
│   │   ├── [city]/             # Multi-city localized Sentinel portals
│   │   └── api/                # REST endpoints (telemetry, hazards, auth, dossiers)
│   ├── components/             # Reusable UI, Map layers, and layout modules
│   ├── config/                 # Municipal branding, city registries, and theme constants
│   ├── db/                     # Database migrations, schemas, and connection pools
│   ├── lib/                    # Shared utilities, notification dispatch, and crypto
│   └── modules/                # Domain engines (hazards, simulation, GIS, AI, speech)
├── scripts/                    # Test harnesses, telemetry verifiers, and scrapers
└── docs/                       # Architectural audits, QA benchmark logs, and specs
```

---

## ⚙️ Quick Start

### 1. Installation

```bash
npm install
```

### 2. Environment Configuration

Copy the template environment variables:

```bash
cp .env.example .env.local
```

Configure your credentials in `.env.local` for TiDB Cloud, Groq AI, and AssemblyAI.

### 3. Run Locally

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to view the application.

---

## 🛡️ License

Private and confidential. Built for municipal disaster management and urban civic resilience.
