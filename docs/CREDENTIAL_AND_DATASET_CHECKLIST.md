# Sentinel City Intelligence — Credential & Dataset Checklist (Phase 6)

This checklist provides the definitive inventory of external providers, APIs, datasets, and environment variables utilized across **Sentinel City Intelligence** and **Urban Link**.

> [!IMPORTANT]
> **Zero Plaintext Secrets Warning**: Do NOT commit real credentials or tokens to Git or share them in unsecured channels. Configure secrets locally in `.env.local` and in your deployment provider's encrypted environment variables console (e.g. Vercel, AWS Secrets Manager, Doppler).

---

## 1. Provider & Credential Matrix

### A. Core Operational Database
| Parameter | Detail |
|---|---|
| **Provider / Service** | **TiDB Cloud Serverless (MySQL Compatible)** |
| **Why It Is Needed** | Primary persistent store for all 18 tables: 10 Urban Link civic incident tables + 8 Sentinel multi-hazard tables (`hazard_observations`, `hazard_events`, `hazard_evidence_links`, `hazard_assessments`, `hazard_alerts`, `hazard_alert_areas`, `hazard_source_health`, `hazard_audit_logs`). |
| **Documentation URL** | https://docs.pingcap.com/tidbcloud |
| **Cost / Restrictions** | Free tier available (Serverless up to 5 GiB storage and 50M Request Units/month). |
| **Environment Variables** | `DATABASE_HOST`, `DATABASE_PORT` (default 4000), `DATABASE_USER`, `DATABASE_PASSWORD`, `DATABASE_NAME` (default `nagpur_connect`), `DATABASE_SSL_CA_PATH`. |
| **Configuration Location** | Local: `.env.local`. Production: Vercel / Cloud Run Environment Secrets. |
| **Classification** | **REQUIRED** |
| **If Missing** | Entire application cannot boot; database queries fail. |
| **Safe Fallback** | Local MySQL 8.0+ container (`docker run -p 4000:3306 -e MYSQL_ROOT_PASSWORD=... mysql:8.0`). |

---

### B. Artificial Intelligence Subsystems (Segregated Architecture)
| Parameter | Detail |
|---|---|
| **Provider / Service** | **Groq Cloud Inference Engine** |
| **Why It Is Needed** | 1. **Sentinel Multi-Hazard AI Assistant**: High-throughput, grounded RAG safety assistant using `openai/gpt-oss-120b` (with automated fallback to `llama-3.3-70b-versatile`).<br>2. **Citizen Issue Reporting AI**: Categorization and department routing wizard. |
| **Documentation URL** | https://console.groq.com/docs/quickstart |
| **Cost / Restrictions** | Free developer tier provides generous RPM/TPM limits on open models. |
| **Environment Variables** | `GROQ_API_KEY` (Sentinel Multi-Hazard Engine), `GROQ_LLAMA_API_KEY` (Urban Link Citizen Wizard). |
| **Configuration Location** | Local: `.env.local`. Production: Cloud Environment Secrets. |
| **Classification** | **REQUIRED** for live AI conversation and automated complaint routing. |
| **If Missing** | Sentinel AI drawer falls back to deterministic rule-based safety notices; reporting wizard falls back to manual department selection. |
| **Safe Fallback** | Deterministic JSON safety notice templates implemented in `src/modules/ai/sentinel-engine.ts`. |

---

### C. Open-Meteo Earth Telemetry (Keyless Multi-Model Weather & Marine)
| Parameter | Detail |
|---|---|
| **Provider / Service** | **Open-Meteo Weather, Air Quality, Marine & Flood APIs** |
| **Why It Is Needed** | Real-time weather observations, 24h precipitation forecasts, CPCB European/US AQI, river discharge rates, and Arabian Sea tidal storm surge heights. |
| **Documentation URL** | https://open-meteo.com/en/docs |
| **Cost / Restrictions** | **Free and open for non-commercial use** (no API key required, 10,000 calls/day limit). Commercial deployments require an Open-Meteo API key. |
| **Environment Variables** | `OPEN_METEO_API_URL` (Defaults to `https://api.open-meteo.com/v1`). |
| **Configuration Location** | Keyless; optionally override host in `.env.local`. |
| **Classification** | **ACTIVE & FUNCTIONAL** (No credentials needed for evaluation). |
| **If Missing** | Simulated seasonal telemetry fallback active in `src/modules/hazards/connectors/open-meteo.ts`. |
| **Safe Fallback** | In-memory LRU cache serves cached telemetry if upstream times out. |

---

### D. National Disaster Management Feeds (NDMA SACHET)
| Parameter | Detail |
|---|---|
| **Provider / Service** | **NDMA SACHET Public CAP Disaster Alert Feed** |
| **Why It Is Needed** | Official Government of India Common Alerting Protocol (CAP) feeds for Maharashtra, Mumbai, Pune, and Nagpur. |
| **Documentation URL** | https://sachet.ndma.gov.in/ |
| **Cost / Restrictions** | Public government emergency feed (open). |
| **Environment Variables** | Integrated server-side in `src/modules/hazards/connectors/sachet.ts`. |
| **Configuration Location** | Built-in connector; zero API keys required. |
| **Classification** | **ACTIVE & FUNCTIONAL** |
| **If Missing** | Local municipal candidate alerts generated from threshold telemetry. |
| **Safe Fallback** | Automated failover to Open-Meteo threshold-triggered candidate alerts. |

---

### E. Global Seismological Telemetry (USGS)
| Parameter | Detail |
|---|---|
| **Provider / Service** | **USGS Earthquake Hazards Program GeoJSON Feed** |
| **Why It Is Needed** | Live earthquake detection within a 250 km bounding radius of Mumbai, Pune, and Nagpur. |
| **Documentation URL** | https://earthquake.usgs.gov/earthquakes/feed/v1.0/geojson.php |
| **Cost / Restrictions** | Free public domain API (no API key required). |
| **Environment Variables** | Built-in connector in `src/modules/hazards/connectors/usgs.ts`. |
| **Configuration Location** | Built-in connector. |
| **Classification** | **ACTIVE & FUNCTIONAL** |
| **If Missing** | Earthquake risk factor defaults to 0 (neutral) in assessment rubric. |
| **Safe Fallback** | Graceful timeout with 0 error bubbling. |

---

### F. Voice & Speech Recognition (AssemblyAI)
| Parameter | Detail |
|---|---|
| **Provider / Service** | **AssemblyAI Speech-to-Text API** |
| **Why It Is Needed** | Powers the citizen microphone omnibar for transcribing spoken citizen incident reports in Marathi, Hindi, and English. |
| **Documentation URL** | https://www.assemblyai.com/docs |
| **Cost / Restrictions** | Free tier includes $50 free credit; token-based billing thereafter. |
| **Environment Variables** | `ASSEMBLY_AI_MODEL` (Stores the AssemblyAI Bearer Token). |
| **Configuration Location** | Local: `.env.local`. Production: Cloud Environment Secrets. |
| **Classification** | **OPTIONAL / FEATURE-SPECIFIC** |
| **If Missing** | Citizens type reports using standard keyboard/text input; speech button displays a clear fallback tooltip. |
| **Safe Fallback** | Browser Web Speech API fallback or direct text entry. |

---

### G. Emergency Web Push (VAPID)
| Parameter | Detail |
|---|---|
| **Provider / Service** | **Web Push Protocol (RFC 8292)** |
| **Why It Is Needed** | Direct browser push notifications to citizens for approved CAP warnings even when the browser tab is closed. |
| **Documentation URL** | https://github.com/web-push-libs/web-push |
| **Cost / Restrictions** | Standard open protocol; zero provider costs. |
| **Environment Variables** | `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` (mailto). |
| **Configuration Location** | Local: `.env.local`. Production: Cloud Environment Secrets. |
| **Classification** | **ACTIVE & FUNCTIONAL** |
| **If Missing** | Notifications are delivered via in-app notification bell rather than native browser push. |
| **Safe Fallback** | In-app notification center. |

---

### H. Google OAuth 2.0
| Parameter | Detail |
|---|---|
| **Provider / Service** | **Google Cloud Identity OAuth** |
| **Why It Is Needed** | Citizen and administrator authentication. |
| **Documentation URL** | https://console.cloud.google.com/apis/credentials |
| **Cost / Restrictions** | Free. |
| **Environment Variables** | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`. |
| **Configuration Location** | Local: `.env.local`. Production: Cloud Environment Secrets. |
| **Classification** | **REQUIRED for authenticated workflows** |
| **If Missing** | Users cannot authenticate via Google; citizen public dashboard and anonymous reports remain accessible. |
| **Safe Fallback** | Demo guest session bypass mode in development. |

---

### I. NASA FIRMS (Fire Information for Resource Management System)
| Parameter | Detail |
|---|---|
| **Provider / Service** | **NASA FIRMS Active Thermal Anomaly / Hotspot API** |
| **Why It Is Needed** | Future enhancement for live urban fire detection and forest edge fire alerts around Nagpur and Pune. |
| **Documentation URL** | https://firms.modaps.eosdis.nasa.gov/api/ |
| **Cost / Restrictions** | Free with registration; requires an official `MAP_KEY`. |
| **Environment Variables** | `NASA_FIRMS_MAP_KEY` |
| **Configuration Location** | Local: `.env.local`. Production: Cloud Environment Secrets. |
| **Classification** | **FUTURE ENHANCEMENT** (Not required for current monsoon flood & civic hazard workflow). |
| **If Missing** | Fire hazard risk is evaluated via citizen fire reports and Municipal Fire Brigade telemetry. |
| **Safe Fallback** | Municipal Fire Department reports from TiDB. |

---

### J. OpenTopography & NASA Earthdata
| Parameter | Detail |
|---|---|
| **Provider / Service** | **OpenTopography High-Resolution Topography & NASA Earthdata** |
| **Why It Is Needed** | On-demand elevation derivative queries and downloading raw Copernicus GLO-30 / SRTM DEM rasters for new city expansions beyond Mumbai. |
| **Documentation URL** | https://opentopography.org/developers |
| **Cost / Restrictions** | Free academic/non-commercial registration. |
| **Environment Variables** | `OPENTOPOGRAPHY_API_KEY`, `NASA_EARTHDATA_TOKEN`, `NASA_EARTHDATA_USERNAME`, `NASA_EARTHDATA_PASSWORD`. |
| **Configuration Location** | Local: `.env.local`. |
| **Classification** | **OPTIONAL / OFFLINE PIPELINE** (Pre-processed spatial GeoJSON layers are already bundled in the repository). |
| **If Missing** | Pre-computed depression sinks in `data/mumbai/flood_spatial/mumbai_terrain_depression_basins.geojson` are used directly with zero runtime latency. |
| **Safe Fallback** | Bundled GeoJSON depression basins. |

---

### K. ISRO MOSDAC (Space Applications Centre)
| Parameter | Detail |
|---|---|
| **Provider / Service** | **ISRO MOSDAC INSAT-3D Hydro-Estimator Precipitation (HEM)** |
| **Why It Is Needed** | High-cadence Indian geostationary satellite rainfall nowcasting. |
| **Documentation URL** | https://www.mosdac.gov.in/ |
| **Cost / Restrictions** | Free registration for Indian nationals; API access requires programmatic SAC token renewal or portal scraping. |
| **Environment Variables** | `MOSDAC_USER_EMAIL`, `MOSDAC_PASSWORD`. |
| **Classification** | **FUTURE ENHANCEMENT** (Currently substituted by Open-Meteo High-Resolution Doppler Radar). |
| **Safe Fallback** | Open-Meteo Weather API (`rainfallRateMmH` at 0.1° resolution) is active and verified. |
