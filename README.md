# AGENTONE (CivicOS) — City Intelligence & Autonomous Operations System

> **AGENTONE** is an enterprise city intelligence and autonomous operations platform. Built on **CivicOS**, it coordinates five specialized AI engines under the **CivicOS Central Orchestrator**, while powering **Sentinel AI** for citizen-facing safety, hazard briefings, and emergency guidance.

---

## 🏛️ Product Architecture & Identity Hierarchy

- **Main Platform**: **AGENTONE** / **CivicOS** — Autonomous City Intelligence & Operations System
- **Main Admin Experience**: **CivicOS Control Room** (`/admin/[city]/agents`)
- **Multi-Agent Network**: **CivicOS Agent Network** — 5 autonomous specialized engines
- **Central Orchestrator**: **CivicOS Central Orchestrator** (coordinates specialists, dispatches parallel child investigations, synthesizes city-wide intelligence)
- **Domain Specialists**:
  - **Simulation Agent**: Spatial digital twin & 7-scenario hydrological physical engine
  - **Hazard Intelligence Agent**: Real-time environmental telemetry, marine swell, AQI, and 0-100 risk scoring
  - **Incident Analysis Agent**: 319 live TiDB incidents triaged across 17 municipal departments with spatial clustering
  - **Citizen Safety Agent**: Verified emergency shelter lookups, defensive monsoon travel advisories
- **Citizen-Facing Product**: **Sentinel AI** (`/dashboard`, `/mumbai/sentinel`) — Civic safety and local area briefing assistant.

---

## 🚀 Key Capabilities

- **Autonomous Multi-Agent Investigation Cockpit**: Real-time investigation tracking with live specialist activity cards, chronological execution timeline, individual specialist dossier inspection, and synthesized city reports.
- **Citizen Mobile Experience (Sentinel AI)**: Perfectly balanced 5-slot bottom navigation with centered elevated `+ Report` FAB, unified area briefing indicators, and real-time localized weather telemetry.
- **Geospatial Digital Twin & Map Workspace**: Multi-layer GIS boundaries (24 BMC wards), saucer depression hotspots, arterial drainage nullahs, and simulation controls.
- **TiDB Cloud Serverless Connectivity**: Grounded in 319 real incident records, 24 municipal wards, and zero fabricated records.

---

## 🌐 Vercel Deployment Guide

### 1. Google OAuth Setup
In Google Cloud Console:
1. Open **APIs & Services > Credentials**.
2. Select your OAuth 2.0 Client ID.
3. Add Authorized Redirect URI:
   - For Local Development: `http://localhost:3000/api/auth/callback/google`
   - For Production Vercel: `https://YOUR-VERCEL-DOMAIN.vercel.app/api/auth/callback/google`

### 2. Required Production Environment Variables in Vercel
- `DATABASE_HOST`: TiDB Cloud host (e.g. `gateway01.ap-southeast-1.prod.aws.tidbcloud.com`)
- `DATABASE_PORT`: `4000`
- `DATABASE_USER`: TiDB user
- `DATABASE_PASSWORD`: TiDB password
- `DATABASE_NAME`: `nagpur_connect`
- `GROQ_ORCHESTRATOR_API_KEY`: Groq API Key for Central Orchestrator
- `GROQ_ORCHESTRATOR_MODEL`: `openai/gpt-oss-120b`
- `GROQ_LLAMA_API_KEY`: Groq key for reporting
- `GROQ_API_KEY`: Groq key for Sentinel AI
- `NEXT_PUBLIC_APP_URL`: `https://YOUR-VERCEL-DOMAIN.vercel.app`
- `NEXTAUTH_URL`: `https://YOUR-VERCEL-DOMAIN.vercel.app`
- `NEXTAUTH_SECRET`: Random 32-byte string (`openssl rand -base64 32`)
- `AUTH_TRUST_HOST`: `true`
- `GOOGLE_CLIENT_ID`: Your Google OAuth Client ID
- `GOOGLE_CLIENT_SECRET`: Your Google OAuth Client Secret

### 3. Serverless Background Monitoring
Autonomous operations cycles are scheduled via Vercel Cron in `vercel.json` (`*/10 * * * *` invoking `/api/agents/autonomous-monitor?city=mumbai`), requiring no persistent node worker.

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
