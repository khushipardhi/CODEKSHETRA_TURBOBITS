/* ════════════════════════════════════════════════════════
   Database Migration — Create tables if not exist
   Runs the schema SQL against TiDB
   ════════════════════════════════════════════════════════ */

import { getPool } from "./db";

/** Core tables needed for citizen workflow */
const MIGRATION_SQL = `

CREATE TABLE IF NOT EXISTS incidents (
  id CHAR(26) NOT NULL PRIMARY KEY,
  public_reference VARCHAR(20) NOT NULL,
  citizen_id VARCHAR(100) NOT NULL DEFAULT 'anonymous',
  category_slug VARCHAR(50) NULL,
  subcategory_slug VARCHAR(50) NULL,
  status VARCHAR(40) NOT NULL DEFAULT 'DRAFT',
  severity VARCHAR(10) NULL,
  priority_score INT NULL,
  priority_band VARCHAR(20) NULL,
  privacy_level VARCHAR(15) NOT NULL DEFAULT 'PUBLIC',
  title VARCHAR(200) NULL,
  citizen_summary TEXT NULL,
  internal_summary TEXT NULL,
  original_text TEXT NULL,
  location_text VARCHAR(500) NULL,
  latitude DECIMAL(10, 7) NULL,
  longitude DECIMAL(10, 7) NULL,
  location_accuracy INT NULL,
  is_emergency TINYINT(1) NOT NULL DEFAULT 0,
  ai_provider VARCHAR(50) NULL,
  ai_model VARCHAR(100) NULL,
  ai_confidence DECIMAL(5, 4) NULL,
  ai_analysis JSON NULL,
  confirmed_at DATETIME NULL,
  routed_at DATETIME NULL,
  resolved_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY idx_incidents_ref (public_reference),
  KEY idx_incidents_status (status, priority_score, created_at),
  KEY idx_incidents_category (category_slug, created_at),
  KEY idx_incidents_citizen (citizen_id, created_at)
);

CREATE TABLE IF NOT EXISTS incident_departments (
  id CHAR(26) NOT NULL PRIMARY KEY,
  incident_id CHAR(26) NOT NULL,
  department_code VARCHAR(30) NOT NULL,
  department_name VARCHAR(200) NOT NULL,
  routing_reason VARCHAR(500) NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'ROUTED',
  priority_override INT NULL,
  received_at DATETIME NULL,
  resolved_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_incident_dept (incident_id),
  KEY idx_dept_status (department_code, status)
);

CREATE TABLE IF NOT EXISTS incident_media (
  id CHAR(26) NOT NULL PRIMARY KEY,
  incident_id CHAR(26) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  file_size INT NOT NULL DEFAULT 0,
  storage_url TEXT NULL,
  purpose VARCHAR(30) NOT NULL DEFAULT 'evidence',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_media_incident (incident_id)
);

CREATE TABLE IF NOT EXISTS incident_status_history (
  id CHAR(26) NOT NULL PRIMARY KEY,
  incident_id CHAR(26) NOT NULL,
  from_status VARCHAR(40) NOT NULL,
  to_status VARCHAR(40) NOT NULL,
  actor_id VARCHAR(100) NULL,
  reason TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_history_incident (incident_id, created_at)
);

CREATE TABLE IF NOT EXISTS incident_sequence (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  year INT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS incident_ai_conversations (
  id CHAR(26) NOT NULL PRIMARY KEY,
  incident_id CHAR(26) NOT NULL,
  question_id VARCHAR(50) NOT NULL,
  question_text VARCHAR(500) NOT NULL,
  question_type VARCHAR(20) NOT NULL DEFAULT 'text',
  question_options JSON NULL,
  answer_value TEXT NULL,
  answer_timestamp DATETIME NULL,
  is_required TINYINT(1) NOT NULL DEFAULT 0,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_conv_incident (incident_id)
);

CREATE TABLE IF NOT EXISTS notifications (
  id CHAR(26) NOT NULL PRIMARY KEY,
  recipient_type VARCHAR(20) NOT NULL,
  recipient_id VARCHAR(100) NOT NULL,
  incident_id CHAR(26) NULL,
  type VARCHAR(50) NOT NULL,
  priority VARCHAR(10) NOT NULL DEFAULT 'normal',
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  read_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_notif_recipient (recipient_type, recipient_id, is_read, created_at),
  KEY idx_notif_incident (incident_id)
);

CREATE TABLE IF NOT EXISTS citizens (
  id CHAR(26) NOT NULL PRIMARY KEY,
  guest_id VARCHAR(100) NULL,
  google_id VARCHAR(100) NULL,
  email VARCHAR(255) NULL,
  name VARCHAR(200) NULL,
  phone VARCHAR(20) NULL,
  ward_zone VARCHAR(100) NULL,
  address TEXT NULL,
  emergency_contact VARCHAR(100) NULL,
  bio TEXT NULL,
  notification_email_enabled TINYINT(1) NOT NULL DEFAULT 1,
  avatar_url TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY idx_citizen_guest (guest_id),
  UNIQUE KEY idx_citizen_google (google_id)
);

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id CHAR(26) NOT NULL PRIMARY KEY,
  citizen_id VARCHAR(100) NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth_key VARCHAR(255) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY idx_push_endpoint (endpoint(500)),
  KEY idx_push_citizen (citizen_id)
);

`;

/**
 * Additional migrations — ALTER TABLE for new columns.
 * These run separately from the CREATE TABLE block because
 * TiDB does not support IF NOT EXISTS on ALTER TABLE ADD COLUMN.
 * Each is wrapped in try/catch so re-runs are safe.
 */
const ALTER_MIGRATIONS: Array<{ sql: string; description: string }> = [
  {
    sql: `ALTER TABLE incidents ADD COLUMN selected_department VARCHAR(50) NULL AFTER citizen_id`,
    description: "Add selected_department to incidents",
  },
  {
    sql: `ALTER TABLE incidents ADD COLUMN department_answers JSON NULL AFTER ai_analysis`,
    description: "Add department_answers to incidents",
  },
  {
    sql: `ALTER TABLE incidents ADD COLUMN geo_routing JSON NULL AFTER department_answers`,
    description: "Add geo_routing to incidents (stores nearest facility results)",
  },
  {
    sql: `ALTER TABLE incidents ADD COLUMN final_ai_report JSON NULL AFTER ai_analysis`,
    description: "Add final_ai_report to incidents (Phase 3)",
  },
  {
    sql: `ALTER TABLE incidents ADD COLUMN original_transcript TEXT NULL AFTER original_text`,
    description: "Add original_transcript to incidents (Phase 3)",
  },
  {
    sql: `ALTER TABLE citizens ADD COLUMN ward_zone VARCHAR(100) NULL AFTER phone`,
    description: "Add ward_zone to citizens",
  },
  {
    sql: `ALTER TABLE citizens ADD COLUMN address TEXT NULL AFTER ward_zone`,
    description: "Add address to citizens",
  },
  {
    sql: `ALTER TABLE citizens ADD COLUMN emergency_contact VARCHAR(100) NULL AFTER address`,
    description: "Add emergency_contact to citizens",
  },
  {
    sql: `ALTER TABLE incident_media MODIFY COLUMN storage_url LONGTEXT NULL`,
    description: "Upgrade incident_media.storage_url to LONGTEXT for data URLs",
  },
  {
    sql: `ALTER TABLE incident_departments ADD COLUMN assigned_worker_id VARCHAR(100) NULL AFTER priority_override`,
    description: "Add assigned_worker_id to incident_departments",
  },
  {
    sql: `ALTER TABLE incident_departments ADD COLUMN assigned_worker_name VARCHAR(200) NULL AFTER assigned_worker_id`,
    description: "Add assigned_worker_name to incident_departments",
  },
  {
    sql: `ALTER TABLE incident_departments ADD COLUMN action_notes TEXT NULL AFTER assigned_worker_name`,
    description: "Add action_notes to incident_departments",
  },
];



/** Run all migrations */
export async function runMigrations(): Promise<{
  success: boolean;
  tables: string[];
  altered: string[];
  error?: string;
}> {
  try {
    const pool = getPool();

    // 1. Run CREATE TABLE statements
    const statements = MIGRATION_SQL
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith("--"));

    for (const stmt of statements) {
      await pool.execute(stmt);
    }

    // 2. Run ALTER TABLE statements — each wrapped in try/catch
    // TiDB returns error 1060 if column already exists — safe to ignore
    const altered: string[] = [];
    for (const migration of ALTER_MIGRATIONS) {
      try {
        await pool.execute(migration.sql);
        altered.push(`✓ ${migration.description}`);
        console.log(`[DB Migration] ${migration.description}`);
      } catch (alterErr) {
        const msg = alterErr instanceof Error ? alterErr.message : String(alterErr);
        // Duplicate column (1060) = already applied, skip silently
        if (msg.includes("1060") || msg.toLowerCase().includes("duplicate column")) {
          altered.push(`⟳ ${migration.description} (already applied)`);
        } else {
          console.warn(`[DB Migration] ${migration.description} — WARN: ${msg}`);
          altered.push(`⚠ ${migration.description}: ${msg}`);
        }
      }
    }

    // 3. Verify tables exist
    const [rows] = await pool.execute("SHOW TABLES");
    const tables = (rows as Array<Record<string, string>>).map(
      (r) => Object.values(r)[0]
    );

    return { success: true, tables, altered };
  } catch (err) {
    return {
      success: false,
      tables: [],
      altered: [],
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

