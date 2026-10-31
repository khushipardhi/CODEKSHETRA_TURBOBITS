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
  console.log("[Migration Phase 10] Connecting to TiDB Cloud Serverless...");
  const conn = await mysql.createConnection({
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT || "4000", 10),
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME || "nagpur_connect",
    ssl: { rejectUnauthorized: false },
    connectTimeout: 20000,
  });

  console.log("[Migration Phase 10] Connected. Executing Phase 10 Operational Intelligence DDL...");

  // 1. Create routing_decision_records
  await conn.query(`
    CREATE TABLE IF NOT EXISTS routing_decision_records (
      id CHAR(26) NOT NULL PRIMARY KEY,
      incident_id CHAR(26) NULL,
      event_id CHAR(26) NULL,
      city VARCHAR(20) NOT NULL,
      category VARCHAR(100) NOT NULL,
      subcategory VARCHAR(100) NULL,
      hazard_type VARCHAR(50) NULL,
      location_text VARCHAR(255) NULL,
      latitude DECIMAL(10, 7) NULL,
      longitude DECIMAL(10, 7) NULL,
      matched_rule_id VARCHAR(50) NOT NULL,
      rule_version VARCHAR(20) NOT NULL DEFAULT 'v1.0',
      primary_department VARCHAR(50) NOT NULL,
      supporting_departments JSON NULL,
      dependencies JSON NULL,
      decision_explanation TEXT NOT NULL,
      facts_used JSON NOT NULL,
      missing_facts JSON NULL,
      confidence_status ENUM('HIGH', 'MEDIUM', 'REQUIRES_REVIEW', 'FALLBACK') NOT NULL DEFAULT 'HIGH',
      assignment_mode ENUM('AUTOMATIC', 'RECOMMENDED', 'AWAITING_APPROVAL') NOT NULL DEFAULT 'RECOMMENDED',
      is_overridden TINYINT(1) NOT NULL DEFAULT 0,
      override_actor_id VARCHAR(100) NULL,
      override_actor_name VARCHAR(100) NULL,
      override_reason TEXT NULL,
      previous_department VARCHAR(50) NULL,
      final_department VARCHAR(50) NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_routing_incident (incident_id),
      INDEX idx_routing_city_dept (city, final_department),
      INDEX idx_routing_confidence (confidence_status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log("✓ Created table: routing_decision_records");

  // 2. Create department_escalation_rules
  await conn.query(`
    CREATE TABLE IF NOT EXISTS department_escalation_rules (
      id CHAR(26) NOT NULL PRIMARY KEY,
      city VARCHAR(20) NOT NULL,
      department_code VARCHAR(50) NOT NULL,
      priority_level VARCHAR(20) NOT NULL,
      ack_target_minutes INT NOT NULL,
      resolution_target_hours INT NOT NULL,
      escalation_recipient VARCHAR(100) NOT NULL,
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY idx_esc_city_dept_prio (city, department_code, priority_level)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log("✓ Created table: department_escalation_rules");

  // Helper to add column if not exists
  async function addColumnIfNotExists(table, column, colDef) {
    const [cols] = await conn.query(`DESCRIBE ${table}`);
    const exists = cols.some(c => c.Field.toLowerCase() === column.toLowerCase());
    if (!exists) {
      await conn.query(`ALTER TABLE ${table} ADD COLUMN ${colDef}`);
      console.log(`✓ Added column: ${table}.${column}`);
    } else {
      console.log(`  Column ${table}.${column} already exists`);
    }
  }

  // 3. Extend incident_departments
  await addColumnIfNotExists("incident_departments", "role", "role ENUM('PRIMARY', 'SUPPORTING') NOT NULL DEFAULT 'PRIMARY'");
  await addColumnIfNotExists("incident_departments", "depends_on_department", "depends_on_department VARCHAR(50) NULL");
  await addColumnIfNotExists("incident_departments", "is_blocked", "is_blocked TINYINT(1) NOT NULL DEFAULT 0");
  await addColumnIfNotExists("incident_departments", "blocked_reason", "blocked_reason TEXT NULL");
  await addColumnIfNotExists("incident_departments", "acknowledged_at", "acknowledged_at DATETIME NULL");
  await addColumnIfNotExists("incident_departments", "escalated_at", "escalated_at DATETIME NULL");
  await addColumnIfNotExists("incident_departments", "escalation_level", "escalation_level VARCHAR(50) NULL");
  await addColumnIfNotExists("incident_departments", "resolution_evidence_url", "resolution_evidence_url VARCHAR(500) NULL");

  // 4. Extend incidents
  await addColumnIfNotExists("incidents", "primary_department", "primary_department VARCHAR(50) NULL");
  await addColumnIfNotExists("incidents", "operational_priority", "operational_priority ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') NOT NULL DEFAULT 'MEDIUM'");
  await addColumnIfNotExists("incidents", "sla_due_at", "sla_due_at DATETIME NULL");
  await addColumnIfNotExists("incidents", "acknowledged_at", "acknowledged_at DATETIME NULL");
  await addColumnIfNotExists("incidents", "is_blocked", "is_blocked TINYINT(1) NOT NULL DEFAULT 0");
  await addColumnIfNotExists("incidents", "blocked_reason", "blocked_reason TEXT NULL");
  await addColumnIfNotExists("incidents", "resolution_notes", "resolution_notes TEXT NULL");
  await addColumnIfNotExists("incidents", "resolution_evidence_url", "resolution_evidence_url VARCHAR(500) NULL");

  // 5. Seed default escalation policies for key municipal departments across Mumbai, Pune, Nagpur
  const defaultPolicies = [
    // Mumbai (BMC)
    { id: "ESC_MUM_DRAINAGE_CRIT", city: "mumbai", dept: "drainage", prio: "CRITICAL", ack: 15, res: 4, recipient: "BMC Disaster Control Cell & SWD Chief" },
    { id: "ESC_MUM_DRAINAGE_HIGH", city: "mumbai", dept: "drainage", prio: "HIGH", ack: 30, res: 8, recipient: "SWD Executive Engineer Ward Cell" },
    { id: "ESC_MUM_DRAINAGE_MED",  city: "mumbai", dept: "drainage", prio: "MEDIUM", ack: 120, res: 24, recipient: "SWD Ward Supervisor" },
    { id: "ESC_MUM_ROAD_CRIT",      city: "mumbai", dept: "road_maintenance", prio: "CRITICAL", ack: 30, res: 6, recipient: "BMC Roads Deputy Chief Engineer" },
    { id: "ESC_MUM_FIRE_CRIT",      city: "mumbai", dept: "fire_brigade", prio: "CRITICAL", ack: 5, res: 2, recipient: "Mumbai Fire Command Central" },

    // Pune (PMC)
    { id: "ESC_PUN_DRAINAGE_CRIT", city: "pune", dept: "drainage", prio: "CRITICAL", ack: 20, res: 4, recipient: "PMC Disaster Management Officer" },
    { id: "ESC_PUN_DRAINAGE_HIGH", city: "pune", dept: "drainage", prio: "HIGH", ack: 45, res: 10, recipient: "PMC Drainage Zonal Engineer" },
    { id: "ESC_PUN_ROAD_CRIT",      city: "pune", dept: "road_maintenance", prio: "CRITICAL", ack: 30, res: 8, recipient: "PMC Road Dept Executive Officer" },

    // Nagpur (NMC)
    { id: "ESC_NAG_DRAINAGE_CRIT", city: "nagpur", dept: "drainage", prio: "CRITICAL", ack: 30, res: 6, recipient: "NMC Emergency Operations Center" },
    { id: "ESC_NAG_FOREST_HIGH",   city: "nagpur", dept: "forest_wildlife", prio: "HIGH", ack: 45, res: 8, recipient: "Nagpur Territorial Forest Range Officer" },
  ];

  for (const pol of defaultPolicies) {
    await conn.query(`
      INSERT INTO department_escalation_rules (id, city, department_code, priority_level, ack_target_minutes, resolution_target_hours, escalation_recipient, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1)
      ON DUPLICATE KEY UPDATE ack_target_minutes = VALUES(ack_target_minutes), resolution_target_hours = VALUES(resolution_target_hours), escalation_recipient = VALUES(escalation_recipient);
    `, [pol.id, pol.city, pol.dept, pol.prio, pol.ack, pol.res, pol.recipient]);
  }
  console.log(`✓ Seeded ${defaultPolicies.length} standard departmental escalation policies`);

  await conn.end();
  console.log("=== Phase 10 Migration Complete! ===");
}

migrate().catch(err => {
  console.error("Migration failed:", err);
  process.exit(1);
});
