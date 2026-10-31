/* ════════════════════════════════════════════════════════
   Database Schema — TiDB/MySQL-Compatible SQL
   All tables use CHAR(26) ULIDs, UTC timestamps
   ════════════════════════════════════════════════════════ */

/**
 * Schema definitions for Nagpur Connect
 * These are the SQL CREATE TABLE statements for TiDB/MySQL
 * Run via migration tooling — do not execute directly in application code
 */

export const SCHEMA_VERSION = "001";

export const schema = `
-- ============================================================
-- Users & Authentication
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
  id CHAR(26) NOT NULL PRIMARY KEY,
  email VARCHAR(255) NULL,
  phone_e164 VARCHAR(20) NULL,
  password_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  status ENUM('ACTIVE', 'SUSPENDED', 'DEACTIVATED') NOT NULL DEFAULT 'ACTIVE',
  last_login_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY idx_users_email (email),
  KEY idx_users_status (status)
);

CREATE TABLE IF NOT EXISTS roles (
  id CHAR(26) NOT NULL PRIMARY KEY,
  key_name VARCHAR(50) NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  description TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY idx_roles_key (key_name)
);

CREATE TABLE IF NOT EXISTS permissions (
  id CHAR(26) NOT NULL PRIMARY KEY,
  key_name VARCHAR(100) NOT NULL,
  description TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY idx_permissions_key (key_name)
);

CREATE TABLE IF NOT EXISTS user_roles (
  user_id CHAR(26) NOT NULL,
  role_id CHAR(26) NOT NULL,
  granted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  granted_by CHAR(26) NULL,
  PRIMARY KEY (user_id, role_id),
  KEY idx_user_roles_role (role_id)
);

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id CHAR(26) NOT NULL,
  permission_id CHAR(26) NOT NULL,
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS sessions (
  id CHAR(26) NOT NULL PRIMARY KEY,
  token_hash VARCHAR(128) NOT NULL,
  user_id CHAR(26) NOT NULL,
  expires_at DATETIME NOT NULL,
  revoked_at DATETIME NULL,
  device_info VARCHAR(255) NULL,
  ip_address VARCHAR(45) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY idx_sessions_token (token_hash),
  KEY idx_sessions_user_expiry (user_id, expires_at)
);

CREATE TABLE IF NOT EXISTS citizen_profiles (
  id CHAR(26) NOT NULL PRIMARY KEY,
  user_id CHAR(26) NOT NULL,
  language VARCHAR(10) NOT NULL DEFAULT 'en',
  contact_preference ENUM('IN_APP', 'EMAIL', 'SMS') NOT NULL DEFAULT 'IN_APP',
  email_verified TINYINT(1) NOT NULL DEFAULT 0,
  phone_verified TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY idx_citizen_user (user_id)
);

-- ============================================================
-- Departments & Workers
-- ============================================================

CREATE TABLE IF NOT EXISTS departments (
  id CHAR(26) NOT NULL PRIMARY KEY,
  code VARCHAR(20) NOT NULL,
  name VARCHAR(200) NOT NULL,
  type VARCHAR(50) NOT NULL,
  approval_state ENUM('PENDING', 'APPROVED', 'SUSPENDED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
  contact_email VARCHAR(255) NULL,
  contact_phone VARCHAR(20) NULL,
  availability VARCHAR(50) NOT NULL DEFAULT '24/7',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY idx_departments_code (code),
  KEY idx_departments_state (approval_state)
);

CREATE TABLE IF NOT EXISTS department_users (
  id CHAR(26) NOT NULL PRIMARY KEY,
  department_id CHAR(26) NOT NULL,
  user_id CHAR(26) NOT NULL,
  department_role ENUM('ADMIN', 'DISPATCHER', 'VIEWER') NOT NULL,
  state ENUM('ACTIVE', 'SUSPENDED', 'REMOVED') NOT NULL DEFAULT 'ACTIVE',
  invited_by CHAR(26) NULL,
  joined_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY idx_dept_user (department_id, user_id),
  KEY idx_dept_users_user (user_id)
);

CREATE TABLE IF NOT EXISTS workers (
  id CHAR(26) NOT NULL PRIMARY KEY,
  user_id CHAR(26) NOT NULL,
  department_id CHAR(26) NOT NULL,
  availability ENUM('AVAILABLE', 'ON_TASK', 'OFF_DUTY', 'SUSPENDED') NOT NULL DEFAULT 'AVAILABLE',
  team_name VARCHAR(100) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_workers_dept_avail (department_id, availability)
);

CREATE TABLE IF NOT EXISTS activation_codes (
  id CHAR(26) NOT NULL PRIMARY KEY,
  code_hash VARCHAR(128) NOT NULL,
  purpose ENUM('DEPARTMENT_INITIAL_ADMIN', 'WORKER_INVITE', 'DEPARTMENT_USER_INVITE') NOT NULL,
  target_department_id CHAR(26) NULL,
  target_email VARCHAR(255) NULL,
  expires_at DATETIME NOT NULL,
  redeemed_at DATETIME NULL,
  redeemed_by CHAR(26) NULL,
  revoked_at DATETIME NULL,
  attempt_count INT NOT NULL DEFAULT 0,
  created_by CHAR(26) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_activation_expiry (expires_at)
);

-- ============================================================
-- Taxonomy & Routing
-- ============================================================

CREATE TABLE IF NOT EXISTS incident_categories (
  id CHAR(26) NOT NULL PRIMARY KEY,
  slug VARCHAR(50) NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT NULL,
  help_text TEXT NULL,
  icon VARCHAR(50) NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY idx_categories_slug (slug),
  KEY idx_categories_active (is_active, sort_order)
);

CREATE TABLE IF NOT EXISTS incident_subcategories (
  id CHAR(26) NOT NULL PRIMARY KEY,
  category_id CHAR(26) NOT NULL,
  slug VARCHAR(50) NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY idx_subcategories_slug (category_id, slug),
  KEY idx_subcategories_active (is_active)
);

CREATE TABLE IF NOT EXISTS department_routing_rules (
  id CHAR(26) NOT NULL PRIMARY KEY,
  category_id CHAR(26) NULL,
  subcategory_id CHAR(26) NULL,
  severity_min VARCHAR(10) NULL,
  department_id CHAR(26) NOT NULL,
  weight INT NOT NULL DEFAULT 100,
  reason VARCHAR(255) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  version INT NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_routing_active (is_active, category_id, subcategory_id)
);

CREATE TABLE IF NOT EXISTS priority_policies (
  id CHAR(26) NOT NULL PRIMARY KEY,
  band_label VARCHAR(20) NOT NULL,
  score_min INT NOT NULL,
  score_max INT NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  version INT NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_priority_active (is_active)
);

-- ============================================================
-- Locations
-- ============================================================

CREATE TABLE IF NOT EXISTS locations (
  id CHAR(26) NOT NULL PRIMARY KEY,
  address_text VARCHAR(500) NULL,
  locality VARCHAR(100) NULL,
  ward VARCHAR(50) NULL,
  latitude DECIMAL(10, 7) NULL,
  longitude DECIMAL(10, 7) NULL,
  precision_meters INT NULL,
  source VARCHAR(20) NOT NULL DEFAULT 'manual',
  geocode_provider VARCHAR(50) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_locations_ward (ward),
  KEY idx_locations_locality (locality)
);

-- ============================================================
-- Incidents & Tasks
-- ============================================================

CREATE TABLE IF NOT EXISTS incidents (
  id CHAR(26) NOT NULL PRIMARY KEY,
  public_reference VARCHAR(20) NOT NULL,
  citizen_id CHAR(26) NOT NULL,
  category_id CHAR(26) NULL,
  subcategory_id CHAR(26) NULL,
  status VARCHAR(40) NOT NULL DEFAULT 'DRAFT',
  severity VARCHAR(10) NULL,
  priority_score INT NULL,
  priority_band VARCHAR(20) NULL,
  privacy_level VARCHAR(15) NOT NULL DEFAULT 'PUBLIC',
  title VARCHAR(200) NULL,
  citizen_summary TEXT NULL,
  location_id CHAR(26) NULL,
  is_emergency TINYINT(1) NOT NULL DEFAULT 0,
  confirmed_at DATETIME NULL,
  routed_at DATETIME NULL,
  resolved_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY idx_incidents_ref (public_reference),
  KEY idx_incidents_status_priority (status, priority_score, created_at),
  KEY idx_incidents_category (category_id, created_at),
  KEY idx_incidents_citizen (citizen_id, created_at),
  KEY idx_incidents_severity (severity, created_at)
);

CREATE TABLE IF NOT EXISTS incident_private_details (
  id CHAR(26) NOT NULL PRIMARY KEY,
  incident_id CHAR(26) NOT NULL,
  original_transcript TEXT NULL,
  original_text TEXT NULL,
  contact_snapshot JSON NULL,
  sensitive_facts JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY idx_private_incident (incident_id)
);

CREATE TABLE IF NOT EXISTS incident_departments (
  id CHAR(26) NOT NULL PRIMARY KEY,
  incident_id CHAR(26) NOT NULL,
  department_id CHAR(26) NOT NULL,
  routing_reason VARCHAR(255) NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'ROUTED',
  priority_override INT NULL,
  received_at DATETIME NULL,
  resolved_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY idx_incident_dept (incident_id, department_id),
  KEY idx_dept_status (department_id, status, priority_override)
);

CREATE TABLE IF NOT EXISTS tasks (
  id CHAR(26) NOT NULL PRIMARY KEY,
  incident_department_id CHAR(26) NOT NULL,
  title VARCHAR(200) NOT NULL,
  required_action TEXT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'UNASSIGNED',
  priority_snapshot INT NULL,
  current_worker_id CHAR(26) NULL,
  due_at DATETIME NULL,
  escalation_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_tasks_dept_status (incident_department_id, status, priority_snapshot),
  KEY idx_tasks_worker (current_worker_id, status)
);

CREATE TABLE IF NOT EXISTS task_assignments (
  id CHAR(26) NOT NULL PRIMARY KEY,
  task_id CHAR(26) NOT NULL,
  worker_id CHAR(26) NOT NULL,
  assigned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  unassigned_at DATETIME NULL,
  assigned_by CHAR(26) NOT NULL,
  reason VARCHAR(255) NULL,
  KEY idx_task_assignments_task (task_id),
  KEY idx_task_assignments_worker (worker_id)
);

-- ============================================================
-- Status History (Append-only)
-- ============================================================

CREATE TABLE IF NOT EXISTS incident_status_history (
  id CHAR(26) NOT NULL PRIMARY KEY,
  incident_id CHAR(26) NOT NULL,
  from_status VARCHAR(40) NOT NULL,
  to_status VARCHAR(40) NOT NULL,
  actor_id CHAR(26) NULL,
  reason TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_incident_history (incident_id, created_at)
);

CREATE TABLE IF NOT EXISTS task_status_history (
  id CHAR(26) NOT NULL PRIMARY KEY,
  task_id CHAR(26) NOT NULL,
  from_status VARCHAR(30) NOT NULL,
  to_status VARCHAR(30) NOT NULL,
  actor_id CHAR(26) NULL,
  reason TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_task_history (task_id, created_at)
);

-- ============================================================
-- Media
-- ============================================================

CREATE TABLE IF NOT EXISTS media (
  id CHAR(26) NOT NULL PRIMARY KEY,
  storage_key VARCHAR(500) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  file_size INT NOT NULL,
  checksum VARCHAR(128) NULL,
  scan_state ENUM('PENDING', 'CLEAN', 'INFECTED', 'ERROR') NOT NULL DEFAULT 'PENDING',
  purpose VARCHAR(30) NOT NULL,
  visibility VARCHAR(20) NOT NULL DEFAULT 'PRIVATE',
  incident_id CHAR(26) NULL,
  task_id CHAR(26) NULL,
  uploaded_by CHAR(26) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_media_incident (incident_id),
  KEY idx_media_task (task_id)
);

-- ============================================================
-- AI Analysis
-- ============================================================

CREATE TABLE IF NOT EXISTS ai_analysis_results (
  id CHAR(26) NOT NULL PRIMARY KEY,
  incident_id CHAR(26) NOT NULL,
  provider VARCHAR(50) NOT NULL,
  model VARCHAR(100) NOT NULL,
  schema_version VARCHAR(20) NOT NULL,
  transcript_hash VARCHAR(128) NULL,
  analysis JSON NOT NULL,
  confidence DECIMAL(5, 4) NOT NULL,
  severity_proposal VARCHAR(10) NULL,
  priority_proposal INT NULL,
  routing_proposal JSON NULL,
  policy_version VARCHAR(20) NULL,
  review_state ENUM('PENDING', 'ACCEPTED', 'CORRECTED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_ai_incident (incident_id, created_at)
);

-- ============================================================
-- Notifications & Outbox
-- ============================================================

CREATE TABLE IF NOT EXISTS notifications (
  id CHAR(26) NOT NULL PRIMARY KEY,
  recipient_id CHAR(26) NOT NULL,
  channel VARCHAR(20) NOT NULL DEFAULT 'IN_APP',
  template_key VARCHAR(100) NOT NULL,
  payload JSON NOT NULL,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_notifications_recipient (recipient_id, is_read, created_at)
);

CREATE TABLE IF NOT EXISTS outbox_events (
  id CHAR(26) NOT NULL PRIMARY KEY,
  event_type VARCHAR(100) NOT NULL,
  payload JSON NOT NULL,
  status ENUM('PENDING', 'PROCESSING', 'DELIVERED', 'FAILED') NOT NULL DEFAULT 'PENDING',
  retry_count INT NOT NULL DEFAULT 0,
  next_retry_at DATETIME NULL,
  idempotency_key VARCHAR(128) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY idx_outbox_idempotency (idempotency_key),
  KEY idx_outbox_pending (status, next_retry_at)
);

-- ============================================================
-- Audit Log (Append-only)
-- ============================================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id CHAR(26) NOT NULL PRIMARY KEY,
  actor_id CHAR(26) NULL,
  actor_role VARCHAR(50) NULL,
  event_key VARCHAR(100) NOT NULL,
  target_type VARCHAR(50) NULL,
  target_id VARCHAR(50) NULL,
  ip_address VARCHAR(45) NULL,
  metadata JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_audit_target (target_type, target_id, created_at),
  KEY idx_audit_actor (actor_id, created_at),
  KEY idx_audit_event (event_key, created_at)
);

-- ============================================================
-- Emergency Contacts
-- ============================================================

CREATE TABLE IF NOT EXISTS emergency_contacts (
  id CHAR(26) NOT NULL PRIMARY KEY,
  service_name VARCHAR(100) NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  description TEXT NULL,
  category VARCHAR(50) NULL,
  area VARCHAR(100) NULL,
  verification_source VARCHAR(200) NULL,
  verification_date DATE NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_emergency_active (is_active, category)
);

-- ============================================================
-- Escalation
-- ============================================================

CREATE TABLE IF NOT EXISTS escalation_policies (
  id CHAR(26) NOT NULL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  severity_trigger VARCHAR(10) NULL,
  sla_minutes INT NOT NULL,
  action VARCHAR(50) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  version INT NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_escalation_active (is_active)
);
`;

export default schema;
