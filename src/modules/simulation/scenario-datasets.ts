/* ════════════════════════════════════════════════════════
   Sentinel City Intelligence — Scenario Verified Datasets
   Client-safe metadata catalog for verified municipal datasets
   supporting each of the 7 hazard scenarios in Greater Mumbai.
   ════════════════════════════════════════════════════════ */

export interface VerifiedDatasetMetadata {
  id: string;
  name: string;
  source: string;
  resolution: string;
  freshness: string;
  dataType: string;
  status: "ACTIVE" | "VERIFIED" | "CALIBRATED" | "FALLBACK";
  limitations: string;
}

export const SCENARIO_DATASETS: Record<string, VerifiedDatasetMetadata[]> = {
  cyclonic_wind_squall: [
    {
      id: "imd_coastal_anemometer",
      name: "IMD Mumbai Coastal Anemometer Network",
      source: "India Meteorological Department (Colaba & Santacruz)",
      resolution: "10-meter Ground Anemometer Stations",
      freshness: "15-minute Realtime Observation Interval",
      dataType: "Point Meteorological Timeseries",
      status: "ACTIVE",
      limitations: "Screening boundary-layer estimation; does not model localized aerodynamic building wake turbulence.",
    },
    {
      id: "copernicus_dem_glo30",
      name: "Copernicus GLO-30 Digital Elevation Model",
      source: "Copernicus Space Component / ESA",
      resolution: "30-meter Ground Spacing (EGM2008 Datum)",
      freshness: "Satellite Baseline (2024 Calibrated)",
      dataType: "Digital Elevation Surface Grid",
      status: "CALIBRATED",
      limitations: "Bare-earth model; elevated skywalks and rooftop structures smoothed.",
    },
    {
      id: "mumbai_coastal_exposure",
      name: "Mumbai Coastal Outfall & Seafront Corridor Polyline",
      source: "MCGM Coastal Road & Stormwater Authority",
      resolution: "Vector Polyline Boundary",
      freshness: "Current 2024 Administrative Shapefile",
      dataType: "GeoJSON Spatial Polyline",
      status: "VERIFIED",
      limitations: "Represents primary Arabian Sea interface seawalls and promenade segments.",
    },
    {
      id: "mumbai_bmc_wards",
      name: "BMC 24 Administrative Wards",
      source: "Municipal Corporation of Greater Mumbai (MCGM)",
      resolution: "Ward-Level Municipal Boundaries (Zones I–VII)",
      freshness: "Official MCGM Master Spatial Registry",
      dataType: "GeoJSON Polygon Boundary",
      status: "VERIFIED",
      limitations: "Canonical 2011/2026 projected administrative boundary dataset.",
    },
  ],
  rainfall_waterlogging: [
    {
      id: "mcgm_aws_network",
      name: "MCGM Automatic Weather Stations (AWS 60)",
      source: "BMC Disaster Management Cell (DMC)",
      resolution: "60 Station Telemetry Grid (~2km spacing)",
      freshness: "15-minute Tipping Bucket Telemetry",
      dataType: "Precipitation Point Observation",
      status: "ACTIVE",
      limitations: "Localized cloudburst cells between gauges interpolated via Inverse Distance Weighting.",
    },
    {
      id: "brimstowad_nullahs",
      name: "BRIMSTOWAD Major Surface Nullah Corridors",
      source: "BRIMSTOWAD Engineering Master Plan",
      resolution: "Primary Open Channel Outfalls (Mithi, Oshiwara, Dahisar, Poisar)",
      freshness: "2024 Desilting Baseline",
      dataType: "Hydraulic Drainage Network Vector",
      status: "VERIFIED",
      limitations: "Discharge capacities assume standard hydraulic roughness; siltation dynamic during monsoons.",
    },
    {
      id: "mumbai_waterlogging_hotspots",
      name: "MCGM 35 Chronic Waterlogging Hotspots",
      source: "MCGM Traffic Police & Flood Cell Historical Records",
      resolution: "Chronic Inundation Waypoints",
      freshness: "Post-Monsoon Audit 2024",
      dataType: "Point Feature Cluster",
      status: "VERIFIED",
      limitations: "Identifies historical chronic low points such as Hindmata, Gandhi Market, Milan Subway.",
    },
  ],
  rainfall_accumulation: [
    {
      id: "era5_gpm_satellite_precip",
      name: "ERA5 / GPM Multi-Horizon Precipitation Archive",
      source: "ECMWF & NASA Global Precipitation Measurement",
      resolution: "0.1° Gridded Precipitation Reanalysis",
      freshness: "Hourly Multi-Decadal Historical Record",
      dataType: "Gridded Timeseries Archive",
      status: "CALIBRATED",
      limitations: "Coarse regional grid scaled to Mumbai BMC boundary using local topography.",
    },
  ],
  coastal_monsoon_surge: [
    {
      id: "apollo_bandar_tide_gauge",
      name: "Apollo Bandar & Princess Dock Tidal Gauge Record",
      source: "Survey of India / Mumbai Port Trust",
      resolution: "Harmonic Tidal Height (Meters Chart Datum)",
      freshness: "Harmonic Astronomical Tidal Table 2024",
      dataType: "Continuous Water Level Timeseries",
      status: "ACTIVE",
      limitations: "Meteorological storm surge residual modelled additively to astronomical high tide.",
    },
    {
      id: "brimstowad_floodgates",
      name: "BRIMSTOWAD Storm Sluice Gates (41 Outfalls)",
      source: "MCGM Stormwater Drain Department",
      resolution: "Tidal Flap Gates & Pumping Outfall Gates",
      freshness: "Operational Status 2024",
      dataType: "Point Hydraulic Infrastructure",
      status: "VERIFIED",
      limitations: "Automatic lockout threshold calibrated at >4.5m Chart Datum tide level.",
    },
  ],
  drainage_stress_blockage: [
    {
      id: "mcgm_desilting_audit",
      name: "MCGM Pre-Monsoon Nullah Desilting Audit",
      source: "BMC Solid Waste & Stormwater Drain Department",
      resolution: "Ward-wise Silt Removal Percentage & Weight Slips",
      freshness: "Pre-Monsoon 2024 Official Audit",
      dataType: "Tabular Municipal Audit Matrix",
      status: "VERIFIED",
      limitations: "Post-audit trash rack re-accumulation during monsoon surge cannot be continuously sensed.",
    },
  ],
  extreme_heat_stress: [
    {
      id: "landsat_thermal_lst",
      name: "Landsat-8/9 Thermal Infrared Land Surface Temperature (LST)",
      source: "USGS Earth Resources Observation and Science (EROS)",
      resolution: "30-meter Radiative Temperature Surface",
      freshness: "Summer Dry Season Baseline",
      dataType: "Continuous Raster Temperature Grid",
      status: "CALIBRATED",
      limitations: "Represents radiative surface skin temperature; ambient 2m air temperature modeled with Rothfusz formula.",
    },
  ],
  air_quality_stagnation: [
    {
      id: "cpcb_caaqms_network",
      name: "CPCB / MPCB Continuous Ambient Air Quality Monitoring (CAAQMS)",
      source: "Central Pollution Control Board (18 Stations across Mumbai)",
      resolution: "Continuous Sensor Telemetry (PM2.5, PM10, NO2, CO)",
      freshness: "Hourly CPCB Realtime Feed",
      dataType: "Point Environmental Sensor Grid",
      status: "ACTIVE",
      limitations: "Inversion boundary height estimated from IMD Santacruz radiosonde ascents.",
    },
  ],
};
