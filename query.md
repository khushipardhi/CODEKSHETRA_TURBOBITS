# Nagpur Connect — Database Schema & Query Reference

## Connection

- **Engine**: TiDB Cloud Serverless (MySQL 8.0 compatible)
- **Host**: `gateway01.ap-southeast-1.prod.aws.tidbcloud.com`
- **Port**: 4000
- **Database**: `nagpur_connect`
- **TLS**: Required (`isrgrootx1.pem`)

> ⚠️ Actual credentials are in `.env.local` — never commit them.

---

## Tables

### `incidents`

Main table for all citizen-reported incidents.

| Column | Type | Description |
|--------|------|-------------|
| `id` | CHAR(26) PK | ULID |
| `public_reference` | VARCHAR(20) UNIQUE | Human-readable tracking ID (NAG-2026-000001) |
| `citizen_id` | VARCHAR(100) | Reporter ID (currently "anonymous") |
| `category_slug` | VARCHAR(50) | Main category (roads_traffic, etc.) |
| `subcategory_slug` | VARCHAR(50) | Subcategory (pothole, etc.) |
| `status` | VARCHAR(40) | Current status (DRAFT, CONFIRMED, ROUTED, IN_PROGRESS, RESOLVED, etc.) |
| `severity` | VARCHAR(10) | LOW, MEDIUM, HIGH, CRITICAL |
| `priority_score` | INT | 0-100 |
| `priority_band` | VARCHAR(20) | LOW, MEDIUM, HIGH, CRITICAL |
| `privacy_level` | VARCHAR(15) | PUBLIC, RESTRICTED, SENSITIVE |
| `title` | VARCHAR(200) | AI-generated title |
| `citizen_summary` | TEXT | Citizen-facing summary |
| `internal_summary` | TEXT | Internal summary for staff |
| `original_text` | TEXT | Raw citizen input text |
| `location_text` | VARCHAR(500) | Location description |
| `latitude` | DECIMAL(10,7) | GPS latitude |
| `longitude` | DECIMAL(10,7) | GPS longitude |
| `location_accuracy` | INT | GPS accuracy meters |
| `is_emergency` | TINYINT(1) | Emergency flag |
| `ai_provider` | VARCHAR(50) | AI provider name (groq) |
| `ai_model` | VARCHAR(100) | Model name (llama-3.3-70b-versatile) |
| `ai_confidence` | DECIMAL(5,4) | Overall AI confidence 0-1 |
| `ai_analysis` | JSON | Full AI analysis JSON |
| `selected_department` | VARCHAR(50) | Department selected by citizen (if mismatch flow) |
| `department_answers` | JSON | Citizen answers to department-specific questions |
| `geo_routing` | JSON | Nearest facility results from Geo Engine |
| `confirmed_at` | DATETIME | When citizen confirmed |
| `routed_at` | DATETIME | When routed to departments |
| `resolved_at` | DATETIME | When resolved |
| `created_at` | DATETIME | Auto timestamp |
| `updated_at` | DATETIME | Auto update timestamp |

**Indexes**: `idx_incidents_ref` (public_reference), `idx_incidents_status` (status, priority_score, created_at), `idx_incidents_category` (category_slug, created_at), `idx_incidents_citizen` (citizen_id, created_at)

---

### `incident_departments`

Maps incidents to one or more departments.

| Column | Type | Description |
|--------|------|-------------|
| `id` | CHAR(26) PK | ULID |
| `incident_id` | CHAR(26) | FK to incidents.id |
| `department_code` | VARCHAR(30) | Department code (police, fire_brigade, etc.) |
| `department_name` | VARCHAR(200) | Department display name |
| `routing_reason` | VARCHAR(500) | Why this department was assigned |
| `status` | VARCHAR(30) | ROUTED, RECEIVED, ASSIGNED, IN_PROGRESS, RESOLVED, etc. |
| `priority_override` | INT | Department-specific priority override |
| `received_at` | DATETIME | When department acknowledged |
| `resolved_at` | DATETIME | When department resolved |
| `created_at` | DATETIME | Auto timestamp |
| `updated_at` | DATETIME | Auto update timestamp |

**Indexes**: `idx_incident_dept` (incident_id), `idx_dept_status` (department_code, status)

---

### `incident_media`

Attached photos/videos for incidents.

| Column | Type | Description |
|--------|------|-------------|
| `id` | CHAR(26) PK | ULID |
| `incident_id` | CHAR(26) | FK to incidents.id |
| `file_name` | VARCHAR(255) | Original filename |
| `mime_type` | VARCHAR(100) | MIME type |
| `file_size` | INT | File size in bytes |
| `storage_url` | TEXT | Storage location URL |
| `purpose` | VARCHAR(30) | evidence, verification, etc. |
| `created_at` | DATETIME | Auto timestamp |

**Indexes**: `idx_media_incident` (incident_id)

---

### `incident_status_history`

Audit trail of all status changes.

| Column | Type | Description |
|--------|------|-------------|
| `id` | CHAR(26) PK | ULID |
| `incident_id` | CHAR(26) | FK to incidents.id |
| `from_status` | VARCHAR(40) | Previous status |
| `to_status` | VARCHAR(40) | New status |
| `actor_id` | VARCHAR(100) | Who made the change |
| `reason` | TEXT | Reason for change |
| `created_at` | DATETIME | Auto timestamp |

**Indexes**: `idx_history_incident` (incident_id, created_at)

---

### `incident_sequence`

Auto-increment sequence for tracking ID generation.

| Column | Type | Description |
|--------|------|-------------|
| `id` | INT PK AUTO_INCREMENT | Sequence number |
| `year` | INT | Year for partitioning |
| `created_at` | DATETIME | Auto timestamp |

---

## CREATE TABLE Statements

```sql
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
```

---

## Important Queries

### Create Incident
```sql
INSERT INTO incidents (
  id, public_reference, citizen_id, category_slug, subcategory_slug,
  status, severity, priority_score, priority_band, privacy_level,
  title, citizen_summary, internal_summary, original_text,
  location_text, latitude, longitude,
  is_emergency, ai_provider, ai_model, ai_confidence, ai_analysis,
  confirmed_at
) VALUES (?, ?, ?, ?, ?, 'CONFIRMED', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW());
```

### Generate Tracking ID
```sql
INSERT INTO incident_sequence (year) VALUES (?);
SELECT LAST_INSERT_ID() as id;
-- Format: NAG-{year}-{id padded to 6 digits}
```

### Retrieve Citizen's Incidents
```sql
SELECT public_reference, category_slug, status, severity,
       priority_score, title, citizen_summary, location_text,
       created_at, confirmed_at
FROM incidents
WHERE citizen_id = ?
ORDER BY created_at DESC
LIMIT 20;
```

### Retrieve Incident Detail
```sql
SELECT id, public_reference, category_slug, status, severity,
       priority_score, title, citizen_summary, location_text,
       latitude, longitude, is_emergency,
       created_at, confirmed_at, resolved_at
FROM incidents WHERE public_reference = ?;
```

### Retrieve Incident Departments
```sql
SELECT department_code, department_name, status
FROM incident_departments WHERE incident_id = ?;
```

### Retrieve Incident Timeline
```sql
SELECT to_status, reason, created_at
FROM incident_status_history
WHERE incident_id = ?
ORDER BY created_at ASC;
```

### Update Incident Status
```sql
UPDATE incidents SET status = ? WHERE id = ?;

INSERT INTO incident_status_history (id, incident_id, from_status, to_status, actor_id, reason)
VALUES (?, ?, ?, ?, ?, ?);
```

---

## New Tables

### `incident_ai_conversations`

AI-generated questions and citizen answers for each incident.

| Column | Type | Description |
|--------|------|-------------|
| `id` | CHAR(26) PK | ULID |
| `incident_id` | CHAR(26) | FK to incidents.id |
| `question_id` | VARCHAR(50) | Question identifier |
| `question_text` | VARCHAR(500) | Question text |
| `question_type` | VARCHAR(20) | chip, multi_chip, yesno, text |
| `question_options` | JSON | Available options for chip/multi_chip |
| `answer_value` | TEXT | Citizen's answer |
| `answer_timestamp` | DATETIME | When answered |
| `is_required` | TINYINT(1) | Whether question was required |
| `sort_order` | INT | Display order |
| `created_at` | DATETIME | Auto timestamp |

**Indexes**: `idx_conv_incident` (incident_id)

---

### `notifications`

Notification records for all user types.

| Column | Type | Description |
|--------|------|-------------|
| `id` | CHAR(26) PK | ULID |
| `recipient_type` | VARCHAR(20) | citizen, admin, department |
| `recipient_id` | VARCHAR(100) | Recipient identifier |
| `incident_id` | CHAR(26) | FK to incidents.id (nullable) |
| `type` | VARCHAR(50) | report_received, status_changed, dept_notified, etc. |
| `priority` | VARCHAR(10) | normal, high, critical |
| `title` | VARCHAR(200) | Notification title |
| `message` | TEXT | Notification body |
| `is_read` | TINYINT(1) | Read flag |
| `read_at` | DATETIME | When read |
| `created_at` | DATETIME | Auto timestamp |

**Indexes**: `idx_notif_recipient` (recipient_type, recipient_id, is_read, created_at), `idx_notif_incident` (incident_id)

---

### `citizens`

Citizen profiles (guest and authenticated).

| Column | Type | Description |
|--------|------|-------------|
| `id` | CHAR(26) PK | ULID |
| `guest_id` | VARCHAR(100) UNIQUE | Guest anonymous ID |
| `google_id` | VARCHAR(100) UNIQUE | Google OAuth ID |
| `email` | VARCHAR(255) | Email address |
| `name` | VARCHAR(200) | Display name |
| `phone` | VARCHAR(20) | Mobile number |
| `avatar_url` | TEXT | Profile picture |
| `created_at` | DATETIME | Auto timestamp |
| `updated_at` | DATETIME | Auto update timestamp |

---

## New Columns on `incidents`

| Column | Type | Description |
|--------|------|-------------|
| `final_ai_report` | JSON | Final structured AI analysis report |
| `original_transcript` | TEXT | Voice transcript (separate from edited text) |

---

## Future Tables (Planned)

### `departments`
Department master data with coordinates, zones, jurisdiction.

### `department_coordinates`
GPS coordinates for department offices, stations, hospitals.

### `workers`
Worker profiles for field assignments.

### `tasks`
Individual work assignments within department responses.

---

## Notes

- All IDs use ULID format (26-char, time-ordered)
- Timestamps are UTC
- TiDB auto_increment may not be sequential across distributed nodes
- JSON columns use TiDB's native JSON type (MySQL 8.0 compatible)
- `citizen_id` uses format: `guest_{uuid}` for guest users, Google ID for authenticated users

---

## Admin Queries

### KPI Aggregation
```sql
SELECT
  COUNT(*) AS total,
  SUM(CASE WHEN severity = 'CRITICAL' AND status NOT IN ('RESOLVED','CLOSED') THEN 1 ELSE 0 END) AS critical_active,
  SUM(CASE WHEN status IN ('IN_PROGRESS','ASSIGNED') THEN 1 ELSE 0 END) AS in_progress,
  SUM(CASE WHEN status = 'RESOLVED' AND resolved_at > DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) AS resolved_this_week,
  SUM(CASE WHEN created_at > DATE_SUB(NOW(), INTERVAL 1 DAY) THEN 1 ELSE 0 END) AS today_count
FROM incidents;
```

### Department Workload
```sql
SELECT
  department_code, department_name,
  SUM(CASE WHEN status IN ('IN_PROGRESS','ASSIGNED') THEN 1 ELSE 0 END) AS active,
  SUM(CASE WHEN status = 'ROUTED' THEN 1 ELSE 0 END) AS pending,
  SUM(CASE WHEN status = 'RESOLVED' THEN 1 ELSE 0 END) AS resolved
FROM incident_departments
GROUP BY department_code, department_name
ORDER BY active DESC, pending DESC
LIMIT 10;
```

### Admin Incident List (paginated, filterable)
```sql
SELECT id, public_reference, category_slug, subcategory_slug,
       status, severity, priority_score, title, citizen_summary,
       location_text, latitude, longitude, is_emergency,
       created_at, confirmed_at
FROM incidents
WHERE status = ? AND severity = ?
ORDER BY created_at DESC
LIMIT ? OFFSET ?;
```

### Admin Status Update
```sql
UPDATE incidents SET status = ?, resolved_at = NOW() WHERE id = ?;

INSERT INTO incident_status_history
  (id, incident_id, from_status, to_status, actor_id, reason)
VALUES (?, ?, ?, ?, 'admin', ?);
```

---

## AI Conversation Queries

### Retrieve Q&A for Incident
```sql
SELECT question_id, question_text, question_type, question_options,
       answer_value, answer_timestamp, is_required, sort_order
FROM incident_ai_conversations
WHERE incident_id = ?
ORDER BY sort_order ASC, created_at ASC;
```

### Insert AI Q&A
```sql
INSERT INTO incident_ai_conversations (
  id, incident_id, question_id, question_text, question_type,
  question_options, answer_value, answer_timestamp,
  is_required, sort_order
) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?);
```

---

## Notification Queries

### Fetch Unread Notifications
```sql
SELECT id, incident_id, type, priority, title, message, created_at
FROM notifications
WHERE recipient_type = ? AND recipient_id = ? AND is_read = 0
ORDER BY created_at DESC
LIMIT 20;
```

### Mark as Read
```sql
UPDATE notifications SET is_read = 1, read_at = NOW()
WHERE id = ? AND recipient_id = ?;
```

---

## Department-Specific Queries

### Department Incident List
```sql
SELECT i.id, i.public_reference, i.title, i.severity, i.priority_score,
       i.status, i.location_text, i.created_at,
       id.status AS dept_status, id.routing_reason
FROM incident_departments id
JOIN incidents i ON i.id = id.incident_id
WHERE id.department_code = ?
ORDER BY i.priority_score DESC, i.created_at DESC
LIMIT ? OFFSET ?;
```

### Department KPIs
```sql
SELECT
  COUNT(*) AS total,
  SUM(CASE WHEN id.status IN ('IN_PROGRESS','ASSIGNED') THEN 1 ELSE 0 END) AS active,
  SUM(CASE WHEN id.status = 'ROUTED' THEN 1 ELSE 0 END) AS pending,
  SUM(CASE WHEN id.status = 'RESOLVED' THEN 1 ELSE 0 END) AS resolved,
  SUM(CASE WHEN i.severity = 'CRITICAL' AND id.status NOT IN ('RESOLVED','CLOSED') THEN 1 ELSE 0 END) AS critical
FROM incident_departments id
JOIN incidents i ON i.id = id.incident_id
WHERE id.department_code = ?;
```

---

## ALTER TABLE Migrations

```sql
ALTER TABLE incidents ADD COLUMN selected_department VARCHAR(50) NULL AFTER citizen_id;
ALTER TABLE incidents ADD COLUMN department_answers JSON NULL AFTER ai_analysis;
ALTER TABLE incidents ADD COLUMN geo_routing JSON NULL AFTER department_answers;
ALTER TABLE incidents ADD COLUMN final_ai_report JSON NULL AFTER ai_analysis;
ALTER TABLE incidents ADD COLUMN original_transcript TEXT NULL AFTER original_text;
```

