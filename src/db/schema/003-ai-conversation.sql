/* ════════════════════════════════════════════════════════
   Database Migration: AI Conversations + Final Report
   Adds:
   - incident_ai_conversations table (Q&A persistence)
   - final_ai_report column on incidents
   - original_transcript column on incidents
   - notifications table (Phase 6 prep)
   ════════════════════════════════════════════════════════ */

-- AI Conversation (Questions & Answers)
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

-- Final AI Report column
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS final_ai_report JSON NULL AFTER ai_analysis;

-- Original transcript (separate from edited text)
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS original_transcript TEXT NULL AFTER original_text;

-- Notifications table (Phase 6)
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

-- Citizens table (Phase 7 prep)
CREATE TABLE IF NOT EXISTS citizens (
  id CHAR(26) NOT NULL PRIMARY KEY,
  guest_id VARCHAR(100) NULL,
  google_id VARCHAR(100) NULL,
  email VARCHAR(255) NULL,
  name VARCHAR(200) NULL,
  phone VARCHAR(20) NULL,
  avatar_url TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY idx_citizen_guest (guest_id),
  UNIQUE KEY idx_citizen_google (google_id)
);
