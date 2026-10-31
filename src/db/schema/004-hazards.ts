/* ════════════════════════════════════════════════════════
   Sentinel City Intelligence — Hazard Schema (004)
   All tables use CHAR(26) ULIDs, UTC timestamps, JSON payloads
   Strict city multi-tenancy: VARCHAR(20) NOT NULL
   ════════════════════════════════════════════════════════ */

export const SCHEMA_VERSION = "004";

export interface HazardObservation {
  id: string;
  city: string;
  hazard_type: string;
  source_id: string;
  source_name: string;
  observation_type: "LIVE_SENSOR" | "FORECAST" | "SATELLITE" | "SIMULATION";
  latitude: number | null;
  longitude: number | null;
  observed_at: string;
  valid_until: string | null;
  metric_value: number | null;
  metric_unit: string | null;
  confidence: number;
  raw_payload: any;
  created_at: string;
}

export interface HazardEvent {
  id: string;
  city: string;
  event_reference: string;
  hazard_type: string;
  title: string;
  description: string | null;
  status: "DETECTED" | "ACTIVE" | "ESCALATED" | "SUBSIDING" | "RESOLVED";
  severity: "LOW" | "MODERATE" | "HIGH" | "SEVERE" | "EXTREME";
  centroid_lat: number;
  centroid_lon: number;
  affected_ward: string | null;
  bounding_geometry: any | null;
  started_at: string;
  estimated_end: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface HazardEvidenceLink {
  id: string;
  hazard_event_id: string;
  evidence_type: "OBSERVATION" | "INCIDENT_REPORT" | "HISTORICAL_HOTSPOT" | "TERRAIN_SINK";
  evidence_id: string;
  correlation_score: number;
  notes: string | null;
  created_at: string;
}

export interface HazardAssessment {
  id: string;
  hazard_event_id: string;
  risk_score: number;
  risk_level: "LOW" | "MODERATE" | "HIGH" | "SEVERE" | "EXTREME";
  contributing_factors: Array<{
    factor: string;
    weightPercent: number;
    value: string;
    description: string;
  }>;
  explanation_text: string;
  population_exposed_approx: number | null;
  confidence_score: number;
  assessed_by: string;
  created_at: string;
}

export interface HazardAlert {
  id: string;
  city: string;
  alert_reference: string;
  hazard_event_id: string | null;
  severity: "ADVISORY" | "WATCH" | "WARNING" | "EMERGENCY";
  title: string;
  headline: string;
  description: string;
  recommended_actions: string[];
  emergency_muster_points: Array<{
    name: string;
    address: string;
    coords: [number, number];
    phone: string;
  }> | null;
  approval_status: "CANDIDATE" | "AWAITING_REVIEW" | "APPROVED_PUBLISHED" | "REJECTED" | "EXPIRED" | "CANCELLED";
  approved_by: string | null;
  approved_at: string | null;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface HazardAlertArea {
  id: string;
  alert_id: string;
  target_type: "CITY_WIDE" | "WARD_POLYGON" | "RADIUS_BUFFER";
  ward_identifier: string | null;
  center_lat: number | null;
  center_lon: number | null;
  radius_km: number | null;
  polygon_geometry: any | null;
  created_at: string;
}

export interface HazardSourceHealth {
  source_id: string;
  source_name: string;
  status: "HEALTHY" | "DEGRADED" | "OFFLINE";
  last_success_at: string | null;
  last_failure_at: string | null;
  consecutive_failures: number;
  last_latency_ms: number | null;
  last_error_message: string | null;
  updated_at: string;
}

export interface HazardAuditLog {
  id: string;
  city: string;
  actor_id: string;
  action: string;
  target_id: string;
  target_type: string;
  ip_address: string | null;
  details: any | null;
  created_at: string;
}

export const hazardSchemaSql = `
-- ============================================================
-- 1. Hazard Observations
-- ============================================================
CREATE TABLE IF NOT EXISTS hazard_observations (
  id CHAR(26) NOT NULL PRIMARY KEY,
  city VARCHAR(20) NOT NULL,
  hazard_type VARCHAR(50) NOT NULL,
  source_id VARCHAR(50) NOT NULL,
  source_name VARCHAR(100) NOT NULL,
  observation_type ENUM('LIVE_SENSOR', 'FORECAST', 'SATELLITE', 'SIMULATION') NOT NULL,
  latitude DECIMAL(10, 7) NULL,
  longitude DECIMAL(10, 7) NULL,
  observed_at DATETIME NOT NULL,
  valid_until DATETIME NULL,
  metric_value DECIMAL(12, 4) NULL,
  metric_unit VARCHAR(30) NULL,
  confidence DECIMAL(5, 4) NOT NULL DEFAULT 1.0000,
  raw_payload JSON NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_obs_city_hazard (city, hazard_type, observed_at),
  INDEX idx_obs_source (source_id, observed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 2. Hazard Events
-- ============================================================
CREATE TABLE IF NOT EXISTS hazard_events (
  id CHAR(26) NOT NULL PRIMARY KEY,
  city VARCHAR(20) NOT NULL,
  event_reference VARCHAR(30) NOT NULL,
  hazard_type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT NULL,
  status ENUM('DETECTED', 'ACTIVE', 'ESCALATED', 'SUBSIDING', 'RESOLVED') NOT NULL DEFAULT 'DETECTED',
  severity ENUM('LOW', 'MODERATE', 'HIGH', 'SEVERE', 'EXTREME') NOT NULL DEFAULT 'MODERATE',
  centroid_lat DECIMAL(10, 7) NOT NULL,
  centroid_lon DECIMAL(10, 7) NOT NULL,
  affected_ward VARCHAR(50) NULL,
  bounding_geometry JSON NULL,
  started_at DATETIME NOT NULL,
  estimated_end DATETIME NULL,
  resolved_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE INDEX idx_event_ref (event_reference),
  INDEX idx_event_city_status (city, status, severity, started_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 3. Hazard Evidence Links
-- ============================================================
CREATE TABLE IF NOT EXISTS hazard_evidence_links (
  id CHAR(26) NOT NULL PRIMARY KEY,
  hazard_event_id CHAR(26) NOT NULL,
  evidence_type ENUM('OBSERVATION', 'INCIDENT_REPORT', 'HISTORICAL_HOTSPOT', 'TERRAIN_SINK') NOT NULL,
  evidence_id VARCHAR(100) NOT NULL,
  correlation_score DECIMAL(5, 4) NOT NULL DEFAULT 1.0000,
  notes VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_evidence_event (hazard_event_id),
  INDEX idx_evidence_target (evidence_type, evidence_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 4. Hazard Assessments
-- ============================================================
CREATE TABLE IF NOT EXISTS hazard_assessments (
  id CHAR(26) NOT NULL PRIMARY KEY,
  hazard_event_id CHAR(26) NOT NULL,
  risk_score INT NOT NULL,
  risk_level ENUM('LOW', 'MODERATE', 'HIGH', 'SEVERE', 'EXTREME') NOT NULL,
  contributing_factors JSON NOT NULL,
  explanation_text TEXT NOT NULL,
  population_exposed_approx INT NULL,
  confidence_score DECIMAL(5, 4) NOT NULL,
  assessed_by VARCHAR(50) NOT NULL DEFAULT 'SENTINEL_ENGINE_V1',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_assessment_event (hazard_event_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 5. Hazard Alerts
-- ============================================================
CREATE TABLE IF NOT EXISTS hazard_alerts (
  id CHAR(26) NOT NULL PRIMARY KEY,
  city VARCHAR(20) NOT NULL,
  alert_reference VARCHAR(30) NOT NULL,
  hazard_event_id CHAR(26) NULL,
  severity ENUM('ADVISORY', 'WATCH', 'WARNING', 'EMERGENCY') NOT NULL,
  title VARCHAR(200) NOT NULL,
  headline VARCHAR(300) NOT NULL,
  description TEXT NOT NULL,
  recommended_actions JSON NOT NULL,
  emergency_muster_points JSON NULL,
  approval_status ENUM('CANDIDATE', 'AWAITING_REVIEW', 'APPROVED_PUBLISHED', 'REJECTED', 'EXPIRED', 'CANCELLED') NOT NULL DEFAULT 'CANDIDATE',
  approved_by CHAR(26) NULL,
  approved_at DATETIME NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE INDEX idx_alert_ref (alert_reference),
  INDEX idx_alert_city_status (city, approval_status, severity)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 6. Hazard Alert Areas
-- ============================================================
CREATE TABLE IF NOT EXISTS hazard_alert_areas (
  id CHAR(26) NOT NULL PRIMARY KEY,
  alert_id CHAR(26) NOT NULL,
  target_type ENUM('CITY_WIDE', 'WARD_POLYGON', 'RADIUS_BUFFER') NOT NULL,
  ward_identifier VARCHAR(50) NULL,
  center_lat DECIMAL(10, 7) NULL,
  center_lon DECIMAL(10, 7) NULL,
  radius_km DECIMAL(6, 2) NULL,
  polygon_geometry JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_area_alert (alert_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 7. Hazard Source Health
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
-- 8. Hazard Audit Logs
-- ============================================================
CREATE TABLE IF NOT EXISTS hazard_audit_logs (
  id CHAR(26) NOT NULL PRIMARY KEY,
  city VARCHAR(20) NOT NULL,
  actor_id VARCHAR(100) NOT NULL,
  action VARCHAR(100) NOT NULL,
  target_id VARCHAR(100) NOT NULL,
  target_type VARCHAR(50) NOT NULL,
  ip_address VARCHAR(45) NULL,
  details JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_audit_city_action (city, action, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;
