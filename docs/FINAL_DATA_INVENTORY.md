# Sentinel City Intelligence — Final Data Asset Inventory (Phase 6)

**Audited Codebase:** Sentinel City Intelligence / Urban Link  
**Coverage Scope:** Mumbai (BMC), Pune (PMC), Nagpur (NMC)  
**Coordinate Reference System:** EPSG:4326 (WGS 84 Lat/Lon) across all normalized GeoJSON layers  
**Audit Date:** October 2026

---

## 1. Master Geospatial & Data Asset Registry

| Layer / Dataset Name | Local File Path / Upstream Source | Format | Features / Size | Resolution / Units | Temporal Coverage | Source Attribution | Application Usage | Operational Status |
|---|---|---|---|---|---|---|---|---|
| **Mumbai Flood Hotspots** | `data/mumbai/flood_spatial/mumbai_recurrent_flood_hotspots.geojson` | GeoJSON FeatureCollection | 35 Points (11.8 KB) | Point coordinates (Lat/Lon) | 2015–2024 Monsoons | Municipal Corporation of Greater Mumbai (MCGM / BMC) Disaster Cell | Map markers, sink proximity, point-in-polygon risk scoring | **Verified Active** (Curated historical municipal records) |
| **Mumbai Low-Lying Sinks** | `data/mumbai/flood_spatial/mumbai_terrain_depression_basins.geojson` | GeoJSON FeatureCollection | 15 Polygons (36.1 KB) | 30m Copernicus GLO-30 DEM derivatives | Derived 2024 | European Space Agency (ESA) Copernicus GLO-30 DEM | Flood sink polygon rendering, point-in-polygon ponding depth estimates | **Verified Active** (Hydrologically filled depression basins) |
| **Mumbai Major Nullahs** | `data/mumbai/flood_spatial/mumbai_drainage_major_nullahs.geojson` | GeoJSON FeatureCollection | 88 LineStrings (164 KB) | 88.4 km total network length | MCGM SWD Master Plan (BRIMSTOWAD) | BMC Storm Water Drainage (SWD) Department | Vector line rendering, nullah proximity buffer, tidal backwater calculation | **Verified Active** (Major natural & engineered arterial drains) |
| **Mumbai Coastal Surge Buffer** | `data/mumbai/flood_spatial/mumbai_coastal_surge_risk_zones.geojson` | GeoJSON FeatureCollection | 12 Polygons (45.2 KB) | High-tide + 2.5m astronomical surge zone | Survey of India / INCOIS | INCOIS / MCGM Coastal Security Cell | Coastal surge polygon overlay, marine storm surge correlation | **Verified Active** (Intertidal coastal fringe) |
| **Mumbai Disaster Shelters** | `data/mumbai/flood_spatial/mumbai_disaster_shelters_assembly_points.geojson` | GeoJSON FeatureCollection | 42 Points (22.5 KB) | Municipal school & community hall locations | BMC Disaster Management Plan 2024 | BMC Disaster Management Department | Citizen shelter finder, nearest facility distance, evacuation routing | **Verified Active** (Verified municipal shelters) |
| **Mumbai Historical Waterlogging** | `data/mumbai/flood_spatial/mumbai_historical_waterlogging_events.geojson` | GeoJSON FeatureCollection | 50 Points (28.4 KB) | Point observations with rainfall depth (mm) | 2005–2023 Historic Downpours | Maharashtra State Disaster Management Authority (SDMA) | Historical incident comparison, pattern validation | **Verified Active** (Reference events) |
| **Mumbai Critical Infrastructure** | `data/mumbai/flood_spatial/mumbai_critical_infrastructure_hubs.geojson` | GeoJSON FeatureCollection | 40 Points (18.9 KB) | Hospitals, pumping stations, power substations | OpenStreetMap & MCGM Civic Portal | OpenStreetMap Contributors (ODbL) / MCGM | Facility exposure overlay, department task dispatch | **Verified Active** (Critical lifelines) |
| **Mumbai Vulnerable Roads** | `data/mumbai/flood_spatial/mumbai_vulnerable_road_network.geojson` | GeoJSON FeatureCollection | 65 LineStrings (92.3 KB) | Low-elevation arterial roads (WEH, EEH, SV Road) | Mumbai Traffic Police / OSM | Mumbai Traffic Police & OSM | Road hazard alerts, traffic precinct dispatch | **Verified Active** (Flood-prone corridors) |
| **Mumbai Ward Demographics** | `data/mumbai/flood_spatial/mumbai_ward_population_demographics.geojson` | GeoJSON FeatureCollection | 24 Polygons (115 KB) | Census 2011 + 2021 Projected Ward Totals | Census of India 2011 | Office of the Registrar General & Census Commissioner, India | Demographic exposure scoring, ward-level impact estimation | **Verified Active** (Official administrative wards A–T) |
| **Mumbai Administrative Boundary** | `data/mumbai/flood_spatial/mumbai_administrative_boundary.geojson` | GeoJSON FeatureCollection | 1 MultiPolygon (48.7 KB) | MCGM jurisdiction boundary (Island City + Suburbs) | MCGM GIS Cell | MCGM GIS Portal | Map boundary clipping, city context boundary | **Verified Active** (Official municipal boundary) |
| **Pune Municipal Facilities** | `data/pune/*.geojson` (26 normalized layers) | GeoJSON FeatureCollections | 423 Points (Over 400 KB) | Exact civic facility coordinates | PMC Open Data 2024 | Pune Municipal Corporation (PMC) | Pune map markers, department routing, shelter locator | **Verified Active** (Normalized from custom PMC JSONs) |
| **Pune Administrative Boundary** | `data/pune/pune_boundary.geojson` | GeoJSON FeatureCollection | 1 MultiPolygon (22 KB) | PMC municipal limit boundary | PMC City Development Plan | PMC GIS Department | Pune map boundary, spatial isolation | **Verified Active** (Official PMC limit) |
| **Nagpur Municipal Facilities** | `data/geodata/nagpur_*.geojson` (12 layers) | GeoJSON FeatureCollections | 195 Points (Over 250 KB) | Police stations, fire stations, hospitals, zonal offices | NMC Smart City Portal 2024 | Nagpur Municipal Corporation (NMC) | Nagpur map markers, civic incident triage, disaster shelters | **Verified Active** (Curated Smart City geodata) |
| **Nagpur Zonal Boundaries** | `data/geodata/nagpur_nmc_zonal_boundaries.geojson` | GeoJSON FeatureCollection | 10 Polygons (21.5 KB) | 10 Administrative Zones (Dharampeth, Gandhibagh, etc.) | NMC Town Planning | NMC GIS Cell | Zonal administrative routing, spatial clipping | **Verified Active** (Official NMC zones) |
| **Open-Meteo Weather** | `https://api.open-meteo.com/v1/forecast` | REST JSON | Global (0.1° grid resolution) | Rain rate (mm/h), Temp (°C), Wind (km/h) | Real-time + 7-day forecast | Open-Meteo (DWD / NOAA / ECMWF open models) | Telemetry ticker, composite risk assessment rubric | **Live Telemetry** (No key required for non-commercial) |
| **Open-Meteo Air Quality** | `https://air-quality-api.open-meteo.com/v1/air-quality` | REST JSON | Global (0.25° grid) | US AQI, PM2.5 (µg/m³), PM10 (µg/m³), NO2, O3 | Real-time + 5-day forecast | Copernicus Atmosphere Monitoring Service (CAMS) | Citizen air quality badge, respiratory hazard alerts | **Live Telemetry** (Active) |
| **Open-Meteo Marine Surge** | `https://marine-api.open-meteo.com/v1/marine` | REST JSON | Arabian Sea Coastal (0.08° grid) | Wave height (m), storm surge (m) | Real-time + 7-day forecast | Copernicus Marine Service / ECMWF Wave Model | Coastal surge risk indicator (Mumbai only) | **Live Telemetry** (Active for coastal cities) |
| **NDMA SACHET Disaster Feed** | `https://sachet.ndma.gov.in/` | CAP XML / JSON | National / Maharashtra | Official CAP alerts (Severity, Urgency, Certainty) | Real-time incident warnings | National Disaster Management Authority (NDMA) | Candidate alert creation, official warning verification | **Live Telemetry** (Active) |
| **USGS Earthquake Hazards** | `https://earthquake.usgs.gov/earthquakes/feed/v1.0/geojson.php` | GeoJSON Feed | Global (M2.5+ events) | Magnitude, Depth (km), Epicenter (Lat/Lon) | Last 24 hours | USGS National Earthquake Information Center (NEIC) | Seismological factor scoring within 250km | **Live Telemetry** (Active) |

---

## 2. City-Specific Analysis & Data Readiness

### A. Mumbai Flood Assets: Reuse & Remaining Gaps
- **Reused Assets:**
  - All 10 pre-processed spatial GeoJSON layers from the Mumbai flood nowcasting work were copied and indexed in `data/mumbai/flood_spatial/`.
  - The Mithi River drainage vectors and BRIMSTOWAD arterial nullahs are actively rendered in the admin command map and cross-referenced in the Mumbai Flood Vector Adapter.
  - The 15 GLO-30 terrain depression basins are directly utilized by `mumbai-flood-adapter.ts` to perform sub-millisecond point-in-polygon sink ponding checks without requiring expensive runtime DEM raster downloads.
- **Identified Limitations & Outstanding Gaps:**
  - *Minor Drainage / Stormwater Grates:* Open municipal geodata only maps primary and secondary nullahs (88.4 km). Tertiary roadside drains and local catch-pits are not mapped in public GIS layers. The application explicitly discloses this limitation.
  - *Real-Time Sump Water Level Telemetry:* BMC operates 60+ automatic water level sensors (e.g. at Milan Subway, Hindmata, Gandhi Market), but these are currently on an internal MCGM intranet network. Once an API gateway or IoT bridge is provisioned, Sentinel can ingest them directly into `hazard_observations`.

### B. Pune Data Assets & Local Readiness
- **Available Sources:**
  - Normalized 26 GeoJSON layers encompassing 423 civic facilities (fire stations, police outposts, hospitals, PMC ward offices).
  - Mutha, Mula, and Pavana river corridors are delineated in PMC spatial boundary records.
  - Live Open-Meteo weather, river discharge, and AQI telemetry are active.
- **Remaining Gaps:**
  - Detailed micro-elevation depression basins for Pune (Kharki, Sinhagad Road low-lying zones) require running a Copernicus GLO-30 depression fill analysis pipeline equivalent to Mumbai's.
  - Coastal marine surge is disabled for Pune (correct geographic behavior for inland plateau).

### C. Nagpur Data Assets & Local Readiness
- **Available Sources:**
  - 12 comprehensive Smart City GeoJSON layers in `data/geodata/` covering 195 civic facilities, fire departments, police stations, NMC water works, and 10 municipal zonal boundaries.
  - Live Open-Meteo weather, heat index, and AQI telemetry active.
  - High-temperature urban heat wave rubric calibrated for Vidarbha climate.
- **Remaining Gaps:**
  - Fine-scale storm drainage vectors for the Nag River and Pili River corridors are currently represented by municipal zonal centroid approximations rather than full vector line geometry.
