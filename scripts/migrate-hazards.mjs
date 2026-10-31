import mysql from "mysql2/promise";
import fs from "fs";
import path from "path";

// Load .env.local manually
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

async function migrate() {
  console.log("[Migration] Connecting to TiDB Cloud Serverless...");
  const conn = await mysql.createConnection({
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT || "4000", 10),
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME || "nagpur_connect",
    ssl: { rejectUnauthorized: false },
    connectTimeout: 20000,
  });

  console.log("[Migration] Connected. Executing Sentinel Hazard Schema DDL...");

  const tables = [
    {
      name: "hazard_observations",
      sql: `
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
      `
    },
    {
      name: "hazard_events",
      sql: `
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
      `
    },
    {
      name: "hazard_evidence_links",
      sql: `
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
      `
    },
    {
      name: "hazard_assessments",
      sql: `
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
      `
    },
    {
      name: "hazard_alerts",
      sql: `
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
      `
    },
    {
      name: "hazard_alert_areas",
      sql: `
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
      `
    },
    {
      name: "hazard_source_health",
      sql: `
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
      `
    },
    {
      name: "hazard_audit_logs",
      sql: `
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
      `
    }
  ];

  for (const table of tables) {
    try {
      await conn.execute(table.sql);
      console.log(`[Migration] ✓ Created or verified table: ${table.name}`);
    } catch (err) {
      console.error(`[Migration] ✗ Error on table ${table.name}:`, err.message);
      throw err;
    }
  }

  // Verify all tables exist
  const [rows] = await conn.execute("SHOW TABLES;");
  const allTables = rows.map(r => Object.values(r)[0]);
  console.log(`[Migration] All tables in database (${allTables.length}):`, allTables);

  await conn.end();
  console.log("[Migration] Migration completed successfully!");
}

migrate().catch(err => {
  console.error("[Migration] Fatal migration error:", err);
  process.exit(1);
});
