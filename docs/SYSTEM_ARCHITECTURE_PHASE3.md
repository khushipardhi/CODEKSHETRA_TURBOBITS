# PHASE 3 — COMPLETE SYSTEM ARCHITECTURE AND TECHNICAL DESIGN
## Sentinel City Intelligence: AI-Powered Multi-Hazard City Intelligence & Early-Warning Platform

**Document Version:** 1.0.0  
**Date:** 2026-10-18  
**Scope:** Mumbai, Pune, Nagpur  
**Status:** Approved Technical Design & Architectural Specification  

---

## 1. Architecture and Data-Flow Diagram

Sentinel City Intelligence is architected as an integrated, non-destructive extension of Urban Link. It introduces multi-hazard monitoring, automated risk scoring, location-aware citizen intelligence, and administrative warning dispatches while preserving 100% of the existing civic reporting, worker rosters, and municipal department operations.

```mermaid
graph TD
    subgraph External Telemetry & Warning Sources
        EXT_WEATHER[Open-Meteo Weather API<br/>Rainfall, Temp, Wind]
        EXT_AQI[Open-Meteo Air Quality API<br/>PM2.5, PM10, AQI]
        EXT_FLOOD[Open-Meteo Flood API<br/>River Discharge m³/s]
        EXT_MARINE[Open-Meteo Marine API<br/>Wave Height, Surge m]
        EXT_SACHET[NDMA SACHET Public CAP<br/>Government Disaster Alerts]
        EXT_USGS[USGS Earthquake API<br/>Seismic Activity M3.0+]
        EXT_FIRMS[NASA FIRMS API<br/>VIIRS Active Fire Hotspots]
        EXT_SCENARIO[Simulation Scenario Engine<br/>Controlled Stress Tests]
    end

    subgraph Data Ingestion & Normalization Layer
        CONN_MGR[Connector Manager<br/>Timeouts, Retries, Health Monitoring]
        NORMALIZER[Observation Normalizer<br/>Standardized JSON Envelope & Units]
        CACHE[Memory TTL Cache<br/>LRU + Stale-While-Revalidate]
    end

    subgraph Storage & Database Layer (TiDB Cloud)
        DB_OBS[(hazard_observations<br/>Normalized Telemetry)]
        DB_EVENTS[(hazard_events<br/>Spatial Clusters)]
        DB_LINKS[(hazard_evidence_links<br/>Evidence Associations)]
        DB_ASSESS[(hazard_assessments<br/>Explainable Risk Records)]
        DB_ALERTS[(hazard_alerts & alert_areas<br/>Published Warnings)]
        DB_HEALTH[(hazard_source_health<br/>Connector Latencies & Status)]
        DB_AUDIT[(hazard_audit_logs<br/>Immutable Compliance Trail)]
        DB_URBANLINK[(Existing Urban Link DB<br/>incidents, workers, departments)]
    end

    subgraph Core Hazard Reasoning Engine
        CORRELATOR[Hazard Event Correlator<br/>Spatial 1.5km, Temporal 2h Clustering]
        MUMBAI_ADAPTER[Mumbai Flood Adapter<br/>10 Spatial GeoJSON Layers]
        ASSESSMENT_ENGINE[Explainable Assessment Engine<br/>0-100 Risk Score & Factor Weights]
        EXPOSURE_ENGINE[Geographic Exposure Engine<br/>Ward Census Intersection]
        LIFECYCLE_MGR[Alert Lifecycle State Machine<br/>Candidate -> Review -> Publish]
    end

    subgraph Sentinel AI Subsystem
        AI_RETRIEVER[Sentinel RAG Retriever<br/>City Context, Weather, Hotspots, Reports]
        AI_GROQ[Groq LLM Engine<br/>openai/gpt-oss-120b]
        AI_CITIZEN[Citizen Hazard Assistant<br/>Safety Guidance & Precautions]
        AI_ADMIN[Admin Alert Assistant<br/>Drafting Headlines & Action Points]
    end

    subgraph Preserved Reporting Subsystem
        REP_GROQ[Existing Reporting AI Engine<br/>src/modules/ai/engine.ts]
        REP_DEPT[17-Department Classifier]
        REP_WORKER[Worker Dispatch & Shift Rosters]
    end

    subgraph Portal Experiences & Channels
        UI_CITIZEN[Citizen Dashboard<br/>Warning Banners, Advisory, RAG Chat]
        UI_ADMIN[Admin Command Center<br/>Multi-Layer GIS Map & Alert Approvals]
        UI_DEPT[Department Operations Desks<br/>Hazard Badges & Task Overlays]
        CH_PUSH[Web Push Notifications<br/>VAPID Service Worker]
        CH_EMAIL[Email Alert Dispatch<br/>EmailJS Service]
    end

    EXT_WEATHER & EXT_AQI & EXT_FLOOD & EXT_MARINE & EXT_SACHET & EXT_USGS & EXT_FIRMS & EXT_SCENARIO --> CONN_MGR
    CONN_MGR --> NORMALIZER --> CACHE
    CACHE --> DB_OBS
    CACHE --> CORRELATOR
    CORRELATOR --> DB_EVENTS
    CORRELATOR --> DB_LINKS
    DB_URBANLINK -.-> DB_LINKS
    
    CORRELATOR --> ASSESSMENT_ENGINE
    MUMBAI_ADAPTER --> ASSESSMENT_ENGINE
    ASSESSMENT_ENGINE --> DB_ASSESS
    ASSESSMENT_ENGINE --> EXPOSURE_ENGINE --> LIFECYCLE_MGR
    LIFECYCLE_MGR --> DB_ALERTS
    LIFECYCLE_MGR --> DB_AUDIT
    
    DB_OBS & DB_EVENTS & DB_ASSESS & DB_URBANLINK --> AI_RETRIEVER
    AI_RETRIEVER --> AI_GROQ --> AI_CITIZEN & AI_ADMIN
    
    LIFECYCLE_MGR --> UI_CITIZEN & UI_ADMIN & UI_DEPT
    LIFECYCLE_MGR --> CH_PUSH & CH_EMAIL
    AI_CITIZEN --> UI_CITIZEN
    
    REP_GROQ --> REP_DEPT --> REP_WORKER --> DB_URBANLINK
```

### End-to-End Data Flow Sequence:
1. **Periodic Ingestion:** Connectors poll external APIs on configured cadences (Weather: 15 min, AQI: 30 min, Flood: 60 min, Marine: 30 min, SACHET: 5 min).
2. **Provenance Normalization:** Upstream payloads are transformed into standard `NormalizedObservation` entities with UTC timestamps, coordinates, metric values, and confidence ratings.
3. **Clustering & Correlation:** When observation values cross baseline warning thresholds (e.g., rainfall rate $> 20$ mm/h), the correlator clusters proximate observations ($R \le 1.5$ km, $\Delta t \le 2$ h) into a `HazardEvent`. Any matching citizen reports (`incidents`) are attached via `hazard_evidence_links` without altering the incident table.
4. **Hydrological & Spatial Enrichment:** For Mumbai, the event is cross-referenced with low-lying depression sinks, historical flood hotspots, drainage waterways, and tidal surges via the `mumbai-flood-adapter`.
5. **Deterministic Assessment:** The risk assessment engine calculates a 0–100 composite risk score and generates a structured factor breakdown.
6. **Alert Candidate Creation:** If the risk score exceeds 60 (`HIGH`) or 80 (`SEVERE`), an alert candidate is generated in `CANDIDATE` or `AWAITING_REVIEW` state.
7. **Human Approval:** Municipal administrators review the candidate in the Command Center map, inspect linked evidence, and approve or dismiss the warning.
8. **Dissemination:** Approved alerts trigger immediate citizen dashboard banners, location-filtered Web Push alerts, and operational context badges on relevant department desks.

---

## 2. Route and Component Integration Plan

The integration plan maps new multi-hazard features to existing Next.js App Router routes and components without altering existing URL contracts or breaking civic reporting flows.

### Route Mapping Architecture

| Route Path | Portal | Existing Purpose | Sentinel Extension | New / Modified Components |
| :--- | :--- | :--- | :--- | :--- |
| `/[city]/dashboard` | Citizen | Civic reporting home, stats, recent incidents | Top-level hazard alert banner, local hazard condition card, trigger for Sentinel AI Assistant | `<SentinelHazardBanner />`<br/>`<LocalHazardCard />`<br/>`<SentinelAssistantDrawer />` |
| `/[city]/report` | Citizen | AI-assisted incident reporting | Contextual warning prompt if report location is inside an active hazard zone | Augmented `<IncidentReportWizard />` |
| `/[city]/track` | Citizen | Track civic reports | Hazard proximity badge on reported incident cards | Augmented `<IncidentTrackList />` |
| `/admin/[city]/map` | Admin | Interactive GIS map of civic incidents | Multi-layer hazard overlays (hotspots, sinks, nullahs, coastal surge, live radar) + Alert Review modal | Augmented `<OsmIncidentMap />`<br/>`<HazardLayerControls />`<br/>`<AlertApprovalModal />` |
| `/admin/[city]/incidents`| Admin | Incident triage and management | Hazard correlation badge linking incidents to active hazard events | Augmented incident table with `hazard_event_ref` |
| `/admin/[city]/analytics`| Admin | Performance and resolution charts | Multi-hazard frequency charts, source health status, alert distribution | `<HazardAnalyticsSection />`<br/>`<SourceHealthCard />` |
| `/department/[city]/[code]`| Dept Ops | Department dispatch desk and worker assignment | Injects hazard advisory header tailored to department duties (Drainage, Fire, Health) | `<DepartmentHazardAlertBanner />`<br/>`<DepartmentPrecautionChecklist />` |
| `/api/hazards/*` | Backend | None (New API Namespace) | Ingestion, assessment, map layers, alert review, and Sentinel AI endpoints | Full `/api/hazards` route handlers |

### Component Hierarchy (Citizen Dashboard)

```
/[city]/dashboard (page.tsx)
  ├── <DashboardHeader city={city} />
  ├── <SentinelHazardBanner city={city} />  <-- NEW (conditional on active alerts)
  ├── <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
  │     ├── <LocalHazardCard city={city} />  <-- NEW (Weather, AQI, Safe Muster)
  │     ├── <CivicStatsWidget />             <-- EXISTING
  │     └── <QuickReportWidget />            <-- EXISTING
  ├── <RecentIncidentsList />                <-- EXISTING
  └── <SentinelAssistantDrawer city={city} /><-- NEW (Floating AI Advisor)
```

### Component Hierarchy (Admin Command Center)

```
/admin/[city]/map (page.tsx)
  ├── <AdminHeader city={city} />
  ├── <div className="relative w-full h-[calc(100vh-80px)]">
  │     ├── <OsmIncidentMap city={city}>     <-- EXISTING (Enhanced with Leaflet Overlays)
  │     │     ├── <IncidentMarkerGroup />    <-- EXISTING
  │     │     ├── <FloodHotspotLayer />      <-- NEW (Mumbai 35 hotspots)
  │     │     ├── <TerrainSinkLayer />       <-- NEW (Mumbai 15 low-lying sinks)
  │     │     ├── <DrainageNetworkLayer />   <-- NEW (Mumbai 88km waterways)
  │     │     ├── <CoastalSurgeLayer />      <-- NEW (Mumbai 143km coastline)
  │     │     ├── <RainfallRadarLayer />     <-- NEW (Open-Meteo precipitation raster/grid)
  │     │     └── <ActiveAlertPolygonLayer /><-- NEW (Targeted ward boundaries)
  │     ├── <HazardLayerControls />          <-- NEW (Toggle switch panel)
  │     ├── <AlertApprovalModal />           <-- NEW (Candidate alert review & publish)
  │     └── <DataSourceHealthBar />          <-- NEW (Real-time connector health indicators)
  └── </div>
```

---

## 3. Database Schema and Migration Plan

The database design strictly respects the existing TiDB Cloud Serverless database (`nagpur_connect`). No existing tables are modified or dropped. All new tables use MySQL 8.0-compatible data types, `CHAR(26)` ULIDs for primary keys, strict `city VARCHAR(20)` scoping, and native `JSON` columns.

### Complete DDL Specification

```sql
-- ============================================================
-- 1. Hazard Observations (Raw & Normalized Telemetry)
-- ============================================================
CREATE TABLE IF NOT EXISTS hazard_observations (
  id CHAR(26) NOT NULL PRIMARY KEY,
  city VARCHAR(20) NOT NULL,
  hazard_type VARCHAR(50) NOT NULL, -- rainfall, flood, heatwave, air_quality, fire, earthquake
  source_id VARCHAR(50) NOT NULL,   -- open_meteo_weather, open_meteo_marine, sachet, usgs, firms
  source_name VARCHAR(100) NOT NULL,
  observation_type ENUM('LIVE_SENSOR', 'FORECAST', 'SATELLITE', 'SIMULATION') NOT NULL,
  latitude DECIMAL(10, 7) NULL,
  longitude DECIMAL(10, 7) NULL,
  observed_at DATETIME NOT NULL,
  valid_until DATETIME NULL,
  metric_value DECIMAL(12, 4) NULL,
  metric_unit VARCHAR(30) NULL,     -- mm/h, celsius, us_aqi, m3/s, meters, mag
  confidence DECIMAL(5, 4) NOT NULL DEFAULT 1.0000,
  raw_payload JSON NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_obs_city_hazard (city, hazard_type, observed_at),
  KEY idx_obs_source (source_id, observed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 2. Hazard Events (Spatially Clustered Incidents)
-- ============================================================
CREATE TABLE IF NOT EXISTS hazard_events (
  id CHAR(26) NOT NULL PRIMARY KEY,
  city VARCHAR(20) NOT NULL,
  event_reference VARCHAR(30) NOT NULL, -- e.g. HAZ-MUM-2026-00001
  hazard_type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT NULL,
  status ENUM('DETECTED', 'ACTIVE', 'ESCALATED', 'SUBSIDING', 'RESOLVED') NOT NULL DEFAULT 'DETECTED',
  severity ENUM('LOW', 'MODERATE', 'HIGH', 'SEVERE', 'EXTREME') NOT NULL DEFAULT 'MODERATE',
  centroid_lat DECIMAL(10, 7) NOT NULL,
  centroid_lon DECIMAL(10, 7) NOT NULL,
  affected_ward VARCHAR(50) NULL,
  bounding_geometry JSON NULL,          -- GeoJSON polygon of affected footprint
  started_at DATETIME NOT NULL,
  estimated_end DATETIME NULL,
  resolved_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY idx_event_ref (event_reference),
  KEY idx_event_city_status (city, status, severity, started_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 3. Hazard Evidence Links (Polymorphic Association)
-- ============================================================
CREATE TABLE IF NOT EXISTS hazard_evidence_links (
  id CHAR(26) NOT NULL PRIMARY KEY,
  hazard_event_id CHAR(26) NOT NULL,
  evidence_type ENUM('OBSERVATION', 'INCIDENT_REPORT', 'HISTORICAL_HOTSPOT', 'TERRAIN_SINK') NOT NULL,
  evidence_id VARCHAR(100) NOT NULL,    -- links to hazard_observations.id or incidents.id or spatial id
  correlation_score DECIMAL(5, 4) NOT NULL DEFAULT 1.0000,
  notes VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_evidence_event (hazard_event_id),
  KEY idx_evidence_target (evidence_type, evidence_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 4. Hazard Assessments (Explainable Risk Scoring)
-- ============================================================
CREATE TABLE IF NOT EXISTS hazard_assessments (
  id CHAR(26) NOT NULL PRIMARY KEY,
  hazard_event_id CHAR(26) NOT NULL,
  risk_score INT NOT NULL,              -- 0 to 100
  risk_level ENUM('LOW', 'MODERATE', 'HIGH', 'SEVERE', 'EXTREME') NOT NULL,
  contributing_factors JSON NOT NULL,   -- [{factor: "rainfall_rate", weight: 35, value: "45mm/h"}]
  explanation_text TEXT NOT NULL,       -- LLM/Rule explainable assessment
  population_exposed_approx INT NULL,
  confidence_score DECIMAL(5, 4) NOT NULL,
  assessed_by VARCHAR(50) NOT NULL DEFAULT 'SENTINEL_ENGINE_V1',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_assessment_event (hazard_event_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 5. Hazard Alerts & Alert Areas (Warning Lifecycle)
-- ============================================================
CREATE TABLE IF NOT EXISTS hazard_alerts (
  id CHAR(26) NOT NULL PRIMARY KEY,
  city VARCHAR(20) NOT NULL,
  alert_reference VARCHAR(30) NOT NULL, -- e.g. ALT-MUM-2026-0001
  hazard_event_id CHAR(26) NULL,
  severity ENUM('ADVISORY', 'WATCH', 'WARNING', 'EMERGENCY') NOT NULL,
  title VARCHAR(200) NOT NULL,
  headline VARCHAR(300) NOT NULL,
  description TEXT NOT NULL,
  recommended_actions JSON NOT NULL,    -- ["Move to high ground", "Avoid Milan Subway"]
  emergency_muster_points JSON NULL,    -- [{name: "KEM Hospital", coords: [19.002, 72.842]}]
  approval_status ENUM('CANDIDATE', 'AWAITING_REVIEW', 'APPROVED_PUBLISHED', 'REJECTED', 'EXPIRED', 'CANCELLED') NOT NULL DEFAULT 'CANDIDATE',
  approved_by CHAR(26) NULL,
  approved_at DATETIME NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY idx_alert_ref (alert_reference),
  KEY idx_alert_city_status (city, approval_status, severity)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS hazard_alert_areas (
  id CHAR(26) NOT NULL PRIMARY KEY,
  alert_id CHAR(26) NOT NULL,
  target_type ENUM('CITY_WIDE', 'WARD_POLYGON', 'RADIUS_BUFFER') NOT NULL,
  ward_identifier VARCHAR(50) NULL,
  center_lat DECIMAL(10, 7) NULL,
  center_lon DECIMAL(10, 7) NULL,
  radius_km DECIMAL(6, 2) NULL,
  polygon_geometry JSON NULL,           -- GeoJSON representation of alert boundary
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_area_alert (alert_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 6. Hazard Source Health & Telemetry
-- ============================================================
CREATE TABLE IF NOT EXISTS hazard_source_health (
  source_id VARCHAR(50) NOT NULL PRIMARY KEY,
  source_name VARCHAR(100) NOT NULL,
  status ENUM('HEALTHY', 'DEGRADED', 'OFFLINE') NOT NULL DEFAULT 'HEALTHY',
  last_success_at DATETIME NULL,
  last_failure_at DATETIME NULL,
  consecutive_failures INT NOT NULL DEFAULT 0,
  last_latency_ms INT NULL,
  last_error_message VARCHAR(500) NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 7. Hazard Audit Logs (Immutable Compliance Log)
-- ============================================================
CREATE TABLE IF NOT EXISTS hazard_audit_logs (
  id CHAR(26) NOT NULL PRIMARY KEY,
  city VARCHAR(20) NOT NULL,
  actor_id VARCHAR(100) NOT NULL,       -- Admin User ID or 'SYSTEM_ENGINE'
  action VARCHAR(100) NOT NULL,         -- ALERT_APPROVED, ALERT_CANCELLED, SIMULATION_TRIGGERED
  target_id VARCHAR(100) NOT NULL,
  target_type VARCHAR(50) NOT NULL,
  ip_address VARCHAR(45) NULL,
  details JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_audit_city_action (city, action, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Migration Execution Strategy:
- **Migration Script:** Create `scripts/migrate-hazards.mjs` using existing database connection pool credentials (`src/lib/db.ts`).
- **Idempotency:** Uses `CREATE TABLE IF NOT EXISTS` and `INDEX IF NOT EXISTS`.
- **Zero Downtime:** Executed against TiDB Cloud without locking existing tables or disrupting live citizen reporting.

---

## 4. API Contract (`/api/hazards/*`)

All Sentinel endpoints reside under `/api/hazards/`, require a `city` parameter (query parameter or `x-city` header), and return consistent JSON structures wrapped in a standard API envelope.

### Common Response Envelope

```typescript
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta: {
    city: string;
    timestamp: string; // ISO 8601 UTC
    requestId: string;
  };
}
```

### Endpoints Specification

#### 1. `GET /api/hazards/feed`
Returns current active alerts, latest observations, and active candidate events for the selected city.
- **Query Params:** `city` (`mumbai` | `pune` | `nagpur`), `severity?` (`ADVISORY` | `WATCH` | `WARNING` | `EMERGENCY`)
- **Response Data:**
```typescript
{
  activeAlerts: Array<{
    id: string;
    alertReference: string;
    severity: 'ADVISORY' | 'WATCH' | 'WARNING' | 'EMERGENCY';
    title: string;
    headline: string;
    description: string;
    recommendedActions: string[];
    emergencyMusterPoints: Array<{ name: string; coordinates: [number, number]; phone: string }>;
    targetAreas: Array<{ type: string; ward?: string; radiusKm?: number }>;
    publishedAt: string;
    expiresAt: string;
  }>;
  currentObservations: {
    weather: { temperature: number; rainfallRateMmH: number; windSpeedKmh: number; updated: string };
    airQuality: { usAqi: number; pm25: number; category: string; updated: string };
    marine?: { waveHeightMeters: number; surgeRisk: string; updated: string };
    riverDischarge?: { dischargeM3s: number; updated: string };
  };
  activeEventsCount: number;
}
```

#### 2. `GET /api/hazards/map-layers`
Returns GeoJSON FeatureCollections for map overlays based on requested layers.
- **Query Params:** `city`, `layers` (`hotspots,sinks,drainage,coastal,alerts,radar`)
- **Response Data:**
```typescript
{
  hotspots?: GeoJSON.FeatureCollection; // 35 recurrent flood locations
  sinks?: GeoJSON.FeatureCollection;    // 15 low-lying depression sinks
  drainage?: GeoJSON.FeatureCollection; // 88km nullahs and rivers
  coastal?: GeoJSON.FeatureCollection;  // Coastal exposure lines
  activeAlertPolygons?: GeoJSON.FeatureCollection;
  radarGrid?: {
    timestamp: string;
    bounds: [[number, number], [number, number]];
    precipitationValues: number[][]; // Grid representation
  };
}
```

#### 3. `POST /api/hazards/assess`
Calculates real-time or simulated risk at a specific coordinate or city-wide.
- **Request Body:**
```typescript
{
  city: 'mumbai' | 'pune' | 'nagpur';
  coordinates?: { lat: number; lon: number };
  simulationScenario?: {
    rainfallRateMmH: number;
    durationHours: number;
    tidalSurgeMeters?: number;
  };
}
```
- **Response Data:**
```typescript
{
  riskScore: number; // 0 to 100
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'SEVERE' | 'EXTREME';
  contributingFactors: Array<{
    factor: string;
    weightPercent: number;
    value: string;
    description: string;
  }>;
  explanation: string;
  affectedPopulationApprox: number;
  uncertaintyDisclaimer: string;
  isSimulation: boolean;
}
```

#### 4. `POST /api/hazards/alerts/review`
Administrative endpoint to review candidate alerts and update their lifecycle status.
- **Authorization:** Requires Admin Session (`auth` middleware check).
- **Request Body:**
```typescript
{
  alertId: string;
  action: 'APPROVE' | 'REJECT' | 'UPDATE' | 'CANCEL';
  headline?: string;
  description?: string;
  recommendedActions?: string[];
  expiresInHours?: number;
  justificationNotes: string;
}
```
- **Response Data:**
```typescript
{
  alertId: string;
  newStatus: 'APPROVED_PUBLISHED' | 'REJECTED' | 'CANCELLED';
  approvedBy: string;
  updatedAt: string;
}
```

#### 5. `POST /api/hazards/assistant`
Citizen RAG chat endpoint for hyper-local multi-hazard advice and precautions.
- **Request Body:**
```typescript
{
  city: 'mumbai' | 'pune' | 'nagpur';
  userLocation?: { lat: number; lon: number; localityName?: string };
  message: string;
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
}
```
- **Response Data:**
```typescript
{
  reply: string;
  groundingSources: Array<{
    name: string;
    timestamp: string;
    type: 'SENSOR' | 'GOVERNMENT_ALERT' | 'CIVIC_REPORT' | 'SPATIAL_ASSET';
  }>;
  nearestShelters?: Array<{
    name: string;
    address: string;
    distanceKm: number;
    emergencyPhone: string;
  }>;
  uncertaintyNotes: string;
}
```

#### 6. `GET /api/hazards/health`
Returns live operational telemetry, status lights, and latencies for all external data connectors.
- **Response Data:**
```typescript
{
  connectors: Array<{
    id: string;
    name: string;
    status: 'HEALTHY' | 'DEGRADED' | 'OFFLINE';
    lastSuccessAt: string;
    latencyMs: number;
    consecutiveFailures: number;
  }>;
  cacheStats: {
    hits: number;
    misses: number;
    activeKeys: number;
  };
}
```

---

## 5. Data-Source Configuration

To guarantee predictable execution and zero runtime hangs, all upstream connectors follow a strict operational configuration matrix:

| Data Source | Base Endpoint | Polling Interval | Cache TTL | Timeout | Fallback Behavior |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **Open-Meteo Weather** | `https://api.open-meteo.com/v1/forecast` | 15 min | 15 min | 8 sec | Serve last valid cached forecast; mark status `DEGRADED`. |
| **Open-Meteo Air Quality** | `https://air-quality-api.open-meteo.com/v1/air-quality` | 30 min | 30 min | 8 sec | Fall back to standard regional seasonal estimates. |
| **Open-Meteo Flood** | `https://flood-api.open-meteo.com/v1/flood` | 60 min | 60 min | 8 sec | Default river discharge to historical seasonal baseline. |
| **Open-Meteo Marine** | `https://marine-api.open-meteo.com/v1/marine` | 30 min | 30 min | 8 sec | Applicable to Mumbai only. Default wave height to 0.5m. |
| **NDMA SACHET CAP** | `https://sachet.ndma.gov.in/cap_public_website/FetchAllAlertDetails` | 5 min | 5 min | 10 sec | Maintain previous active government alerts list. |
| **USGS Earthquakes** | `https://earthquake.usgs.gov/fdsnws/event/1/query` | 15 min | 15 min | 8 sec | Return zero recent seismic anomalies if timeout. |
| **NASA FIRMS** | `https://firms.modaps.eosdis.nasa.gov/api/area/csv/...` | 60 min | 60 min | 12 sec | Optional feed; skip fire hotspots if key unavailable. |

### City Coordinates Reference Table

```typescript
export const CITY_COORDINATES: Record<string, { lat: number; lon: number; elevationM: number; hasCoast: boolean }> = {
  mumbai: { lat: 19.0760, lon: 72.8777, elevationM: 8, hasCoast: true },
  pune:   { lat: 18.5204, lon: 73.8567, elevationM: 560, hasCoast: false },
  nagpur: { lat: 21.1458, lon: 79.0882, elevationM: 310, hasCoast: false }
};
```

---

## 6. AI Prompt and Retrieval (RAG) Design

The Sentinel AI citizen assistant is completely segregated from the civic reporting classification AI (`src/modules/ai/engine.ts`). It runs a dedicated RAG pipeline via `src/modules/ai/sentinel-engine.ts` using Groq SDK (`openai/gpt-oss-120b`).

### Strict Retrieval Pipeline Workflow:
1. **Resolve City & Coordinates:** Extract user's city and GPS coordinate or locality name.
2. **Fetch Telemetry:** Retrieve current weather (rain rate, temperature), AQI, and marine/river discharge from the observation cache.
3. **Fetch Active Alerts:** Retrieve published `hazard_alerts` for the city and target ward.
4. **Fetch Proximate Reports:** Query active civic reports (`incidents`) within 3km reporting waterlogging, tree falls, or road damage.
5. **Spatial Query:** For Mumbai, query `mumbai-flood-adapter` for distance to nearest flood hotspot, low-lying sink, and nearest BMC muster point.
6. **Grounding Constraints Injection:** Inject retrieved facts into a locked system prompt.

### Prompt Template & Grounding Schema

```text
SYSTEM INSTRUCTION:
You are the Sentinel City Intelligence Assistant for {cityName}.
Your duty is to provide citizens with calm, factual, life-safety guidance regarding current weather, natural hazards, precautions, and public emergency facilities.

GROUNDED REAL-TIME EVIDENCE (STRICT TRUTH):
- City: {cityName}
- Citizen Location: {localityOrCoords}
- Current Weather: {rainRate} mm/hr rainfall, {temp}°C, {windSpeed} km/h wind
- Air Quality: US AQI {aqiVal} ({aqiCategory})
- Marine/Coastal: {marineDetails}
- Active Official Alerts: {activeAlertsSummary}
- Recent Nearby Civic Reports: {nearbyReportsList}
- Nearest Verified Emergency Shelter / Muster Point:
  * Facility: {musterName}
  * Address: {musterAddress}
  * Helpline: {emergencyPhone}
- Data Freshness Timestamp: {utcTimestamp}

CRITICAL OPERATIONAL CONSTRAINTS:
1. Ground your answer EXCLUSIVELY in the provided facts above.
2. NEVER hallucinate or invent emergency helpline numbers, road closures, shelter addresses, or evacuation routes. If not listed in the facts, state clearly: "Specific road closure telemetry is currently unconfirmed by municipal dispatch."
3. Distinguish clearly between OBSERVED conditions and FORECAST models.
4. Keep advice concise, actionable, and formatted in clear bullet points.
5. Include a transparent footer indicating source timestamps and acknowledging that local localized conditions can vary.
```

---

## 7. Alert Lifecycle and Permissions

To prevent public panic and false alarms, Sentinel enforces a deterministic state machine with role-based authorization:

### Alert State Machine

```
      [Telemetry / Report Trigger]
                   │
                   ▼
             ┌───────────┐
             │ DETECTED  │
             └─────┬─────┘
                   │ Assessment Engine Scoring
                   ▼
             ┌───────────┐
             │ ASSESSED  │ (Risk Score: 0-100)
             └─────┬─────┘
                   │ Score >= 60
                   ▼
             ┌───────────┐
             │ CANDIDATE │
             └─────┬─────┘
                   │
         ┌─────────┴─────────┐
         │ Severity Check    │
         ▼                   ▼
 [ADVISORY / WATCH]   [WARNING / EMERGENCY]
   (Score 60-74)         (Score >= 75)
         │                   │
         │ Explicit Rule     │ Mandatory Human Review
         ▼                   ▼
┌──────────────────┐ ┌──────────────────┐
│  RULE_APPROVED   │ │ AWAITING_REVIEW  │
└────────┬─────────┘ └────────┬─────────┘
         │                    │ Admin Approves
         └─────────┬──────────┘
                   ▼
        ┌──────────────────────┐
        │  APPROVED_PUBLISHED  │ ──> Dispatched to Citizens & Depts
        └──────────┬───────────┘
                   │
      ┌────────────┼────────────┐
      ▼            ▼            ▼
┌───────────┐┌───────────┐┌───────────┐
│  UPDATED  ││  EXPIRED  ││ CANCELLED │
└───────────┘└───────────┘└───────────┘
```

### Role-Based Authorization Matrix

| Action | Citizen | Municipal Worker | Department Officer | City Admin | Super Admin | System Engine |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| View Published Alerts | Yes | Yes | Yes | Yes | Yes | Yes |
| View Candidate Alerts | No | No | Read-Only | Yes | Yes | Yes |
| Trigger Scenario Simulation | No | No | No | Yes | Yes | Yes |
| Approve Advisory / Watch | No | No | No | Yes | Yes | Automated Rule |
| Approve Warning / Emergency | No | No | No | Yes | Yes | No (Locked) |
| Cancel / Expire Alert | No | No | No | Yes | Yes | On Timer Expiry |
| Edit Alert Boundaries | No | No | No | Yes | Yes | No |

---

## 8. City-Isolation Strategy

Cross-city data bleeding is strictly prohibited. Sentinel enforces isolation across three distinct tiers:

1. **Physical Asset Isolation:**
   - Mumbai: Spatial GeoJSON layers in `mumbai_flood_spatial_data/` and `data/mumbai/`.
   - Pune: Normalized GeoJSON files in `data/pune/`.
   - Nagpur: Administrative ward layers in `data/geodata/`.
   - *Constraint:* Pune and Nagpur code paths **never** import or evaluate Mumbai coastal or drainage layers.
2. **Database Row-Level Multi-Tenancy:**
   - All hazard tables include `city VARCHAR(20) NOT NULL`.
   - Every read and write query must include a parameterized filter: `WHERE city = ?`.
   - ULID generation prefixes don't collide, but city scoping guarantees that an admin in Pune never receives Mumbai flood alerts.
3. **Connector Parameter Scoping:**
   - Upstream API calls are explicitly parameterized by the target city's verified centroid and bounding box.
   - External alerts from NDMA SACHET are filtered against the target city's district code (e.g., `Mumbai City` / `Mumbai Suburban`, `Pune`, `Nagpur`).

---

## 9. Risk Assessment Methodology

The Risk Assessment Engine produces an explainable, deterministic composite score (0–100) based on weighted contributing factors.

### Assessment Formula (Mumbai Hydrological Model)

$$\text{RiskScore} = \min\left(100, \, w_{\text{rain}} \cdot S_{\text{rain}} + w_{\text{sink}} \cdot S_{\text{sink}} + w_{\text{hotspot}} \cdot S_{\text{hotspot}} + w_{\text{tide}} \cdot S_{\text{tide}} + w_{\text{reports}} \cdot S_{\text{reports}}\right)$$

Where:
- **Rainfall Intensity ($w_{\text{rain}} = 0.35$):**
  - $< 10$ mm/h $\rightarrow 0$ pts
  - $10 - 25$ mm/h $\rightarrow 30$ pts
  - $25 - 50$ mm/h $\rightarrow 70$ pts
  - $> 50$ mm/h $\rightarrow 100$ pts
- **Topographic Depression Depth ($w_{\text{sink}} = 0.20$):**
  - Outside sink polygon $\rightarrow 0$ pts
  - Inside sink with mean depth $< 1.0$m $\rightarrow 50$ pts
  - Inside sink with mean depth $\ge 1.0$m $\rightarrow 100$ pts
- **Historical Recurrent Hotspot ($w_{\text{hotspot}} = 0.20$):**
  - Distance $> 500$m $\rightarrow 0$ pts
  - Distance $200 - 500$m $\rightarrow 50$ pts
  - Distance $< 200$m $\rightarrow 100$ pts
- **Coinciding High Tide / Wave Surge ($w_{\text{tide}} = 0.15$):**
  - Wave height $< 1.0$m $\rightarrow 0$ pts
  - Wave height $1.0 - 2.0$m $\rightarrow 50$ pts
  - Wave height $> 2.0$m with spring tide $\rightarrow 100$ pts
- **Active Citizen Civic Reports ($w_{\text{reports}} = 0.10$):**
  - $\ge 3$ verified waterlogging reports in ward within 60 min $\rightarrow 100$ pts

### Severity Classification Matrix

| Risk Score | Risk Level | Alert Classification | Action Required |
| :---: | :---: | :---: | :--- |
| **0 – 29** | `LOW` | Informational | Standard monitoring; normal city operations. |
| **30 – 59** | `MODERATE` | Advisory | Automated notification on department consoles; monitor nullahs. |
| **60 – 74** | `HIGH` | Watch | Citizen warning banner; alert candidate queued for review. |
| **75 – 89** | `SEVERE` | Warning | Immediate admin alert review; field de-watering pumps activated. |
| **90 – 100** | `EXTREME` | Emergency | High-priority siren Web Push; BMC emergency muster centers open. |

### Simulation Disclosure Protocol
Whenever simulated rainfall scenarios are executed (e.g. for monsoon preparedness planning), all system outputs, map layers, and banners must prominently bear the mandatory disclosure:
> `[SIMULATION SCENARIO: Illustrative stress-test based on synthetic +50mm/h rainfall model. Not an active emergency.]`

---

## 10. Testing and Regression Strategy

To ensure zero downtime and prevent regression in Urban Link's core features:

1. **Automated TypeScript & Build Checks:**
   - `npx tsc --noEmit` must pass with 0 errors after every component addition.
   - `npm run build` must cleanly compile all 53 existing routes.
2. **Preserved Workflows Smoke Test Suite:**
   - **Citizen Report Submission:** Submit test incident with image upload and Groq categorization. Verify record in `incidents` table.
   - **Voice Omnibar:** Verify AssemblyAI token generation and speech transcription.
   - **Department Ops:** Verify worker dispatch and status transition from `SUBMITTED` $\rightarrow$ `IN_PROGRESS` $\rightarrow$ `RESOLVED`.
3. **Hazard Engine Unit & Integration Tests:**
   - Verify connector mock responses (Open-Meteo, SACHET) parse into `NormalizedObservation`.
   - Verify Mumbai spatial queries (hotspot distance calculation, low-lying polygon point-in-polygon).
   - Verify alert lifecycle state transitions and audit logging.

---

## 11. Security and Failure-Handling Plan

### Resilience & Fault Tolerance
- **Circuit Breaker Pattern:** If any external API fails 3 consecutive times, trip the circuit to `OFFLINE` for 5 minutes. Return cached telemetry or graceful defaults without blocking UI rendering.
- **Fail-Safe Timeouts:** All external HTTP calls enforce an 8–10 second timeout using `AbortController`.
- **Database Connection Pooling:** MySQL connections via `mysql2/promise` utilize pooled connections with idle timeouts to prevent socket exhaustion on TiDB Serverless.

### Security & Privacy Protections
- **No PII Exposure in Alert Streams:** Public alert feeds and GeoJSON endpoints expose only aggregated demographic estimates and public landmarks, never personal citizen names or phone numbers.
- **API Key Sanitization:** All Groq, TiDB, MapTiler, and OpenTopography credentials remain strictly server-side in `.env.local`. None are leaked to client bundles.
- **Input Validation:** All `/api/hazards/*` endpoints validate request bodies using strict TypeScript typings and sanitization to prevent SQL injection or XSS.

---

## 12. Incremental Implementation Checklist (Phases 4–6)

### Phase 4: Core Implementation (Connectors, Engine & Admin Center)
- [ ] **Step 4.1:** Author and execute `scripts/migrate-hazards.mjs` to apply the 7 DDL tables to TiDB Cloud.
- [ ] **Step 4.2:** Implement in-memory TTL cache (`src/modules/hazards/cache.ts`).
- [ ] **Step 4.3:** Implement external connectors for Open-Meteo, NDMA SACHET, and USGS (`src/modules/hazards/connectors/`).
- [ ] **Step 4.4:** Implement `mumbai-flood-adapter.ts` wrapping the 10 spatial GeoJSON layers.
- [ ] **Step 4.5:** Implement `assessment-engine.ts` (0–100 risk scoring and contributing factors).
- [ ] **Step 4.6:** Implement dedicated Sentinel AI engine (`src/modules/ai/sentinel-engine.ts`) with Groq SDK (`openai/gpt-oss-120b`).
- [ ] **Step 4.7:** Implement Next.js API route handlers under `src/app/api/hazards/`.
- [ ] **Step 4.8:** Enhance Admin Command Center (`src/app/admin/[city]/map/page.tsx` and `osm-incident-map.tsx`) with toggleable hazard layers and alert review modal.
- [ ] **Step 4.9:** Run TypeScript compiler and production build to verify 0 regressions.

### Phase 5: Citizen Experience & Department Integration
- [ ] **Step 5.1:** Add `<SentinelHazardBanner />` and `<LocalHazardCard />` to citizen dashboard (`src/app/[city]/dashboard/page.tsx`).
- [ ] **Step 5.2:** Add `<SentinelAssistantDrawer />` floating RAG chat assistant.
- [ ] **Step 5.3:** Integrate Web Push hazard alert triggers.
- [ ] **Step 5.4:** Inject contextual hazard badges into department desks (`src/app/(department)/department/[city]/[code]/page.tsx`).

### Phase 6: Multi-City Verification, Regression Suite & Standalone Repository
- [ ] **Step 6.1:** Execute comprehensive end-to-end multi-city validation (Mumbai, Pune, Nagpur).
- [ ] **Step 6.2:** Verify zero regressions across citizen reporting, voice processing, and worker dispatches.
- [ ] **Step 6.3:** Capture verification screenshots using browser subagent.
- [ ] **Step 6.4:** Perform git secret audit and initialize the standalone GitHub repository.
