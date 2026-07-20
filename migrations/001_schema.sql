-- NHAI DAY — MySQL schema (migrated from Supabase/Postgres)
-- Every PK is VARCHAR since observed live IDs are either human slugs or UUIDs, never
-- sequential integers. The REST shim auto-generates a UUID for `id`-keyed tables when
-- the client doesn't supply one on insert.

CREATE TABLE IF NOT EXISTS seasons (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(128) NOT NULL,
  display_order INT DEFAULT 0,
  is_current TINYINT(1) DEFAULT 0,
  status VARCHAR(32),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS mentors (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(255),
  tag VARCHAR(255),
  avatar_url LONGTEXT,
  is_active TINYINT(1) DEFAULT 1,
  display_order INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS events (
  id VARCHAR(64) PRIMARY KEY,
  season_id VARCHAR(64),
  name VARCHAR(255) NOT NULL,
  date DATE,
  city VARCHAR(64),
  status VARCHAR(32),
  recap_url TEXT,
  description TEXT,
  display_order INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS faqs (
  id VARCHAR(64) PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT,
  is_active TINYINT(1) DEFAULT 1,
  display_order INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS registrations (
  id VARCHAR(64) PRIMARY KEY,
  season_id VARCHAR(64),
  full_name VARCHAR(255),
  email VARCHAR(255),
  city VARCHAR(64),
  team VARCHAR(64),
  registration_type VARCHAR(32),
  member2_name VARCHAR(255),
  member2_email VARCHAR(255),
  member2_team VARCHAR(64),
  member3_name VARCHAR(255),
  member3_email VARCHAR(255),
  member3_team VARCHAR(64),
  team_matching_note TEXT,
  problem_to_solve TEXT,
  ai_level VARCHAR(16),
  expected_output VARCHAR(32),
  need_laptop TINYINT(1) DEFAULT 0,
  is_imported TINYINT(1) DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS site_config (
  `key` VARCHAR(128) PRIMARY KEY,
  value JSON,
  updated_at DATETIME
);

CREATE TABLE IF NOT EXISTS season_stats (
  season_id VARCHAR(64) PRIMARY KEY,
  total_participants INT,
  total_teams INT,
  hn_participants INT,
  hcm_participants INT,
  avg_experience DECIMAL(3,2),
  avg_mentor DECIMAL(3,2),
  pct_has_demo DECIMAL(5,2),
  pct_want_continue DECIMAL(5,2),
  pct_will_participate DECIMAL(5,2),
  feedback_count INT,
  feedback_sheet_url TEXT,
  updated_at DATETIME
);

CREATE TABLE IF NOT EXISTS awards (
  id VARCHAR(64) PRIMARY KEY,
  season_id VARCHAR(64),
  category_id VARCHAR(64),
  city VARCHAR(64),
  winner_case_id VARCHAR(64),
  winner_name VARCHAR(255),
  winner_team VARCHAR(255),
  winner_description TEXT,
  category_tags JSON,
  status VARCHAR(32),
  votes_count INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS award_categories (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(128),
  description TEXT,
  prize_amount VARCHAR(64),
  icon VARCHAR(16),
  display_order INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS `cases` (
  id VARCHAR(64) PRIMARY KEY,
  season_id VARCHAR(64),
  campaign_id VARCHAR(64),
  city VARCHAR(64),
  title VARCHAR(255),
  short_description TEXT,
  full_description TEXT,
  purpose TEXT,
  tools_used JSON,
  demo_url TEXT,
  sticker VARCHAR(16),
  owner_name VARCHAR(255),
  owner_email VARCHAR(255),
  owner_team VARCHAR(64),
  team_members JSON,
  category_tags JSON,
  is_active TINYINT(1) DEFAULT 1,
  display_order INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS top_pick_campaigns (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  max_votes_per_device INT NOT NULL DEFAULT 3,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  opens_at DATETIME,
  closes_at DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS top_pick_cases (
  case_id VARCHAR(64) PRIMARY KEY,
  campaign_id VARCHAR(64) NOT NULL,
  city VARCHAR(16) NOT NULL,
  title VARCHAR(255) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (campaign_id) REFERENCES top_pick_campaigns(id) ON DELETE CASCADE,
  INDEX idx_tpcases_campaign (campaign_id, is_active)
);

-- NOTE: nhai-day-admin.html used to query `top_pick_votes?order=voted_at.desc`, but the
-- live Supabase column is `created_at` (confirmed: `voted_at` does not exist there) — this
-- admin query was silently failing/returning empty. Fixed in the admin HTML to use created_at.
CREATE TABLE IF NOT EXISTS top_pick_votes (
  id VARCHAR(64) PRIMARY KEY,
  campaign_id VARCHAR(64) NOT NULL,
  case_id VARCHAR(64) NOT NULL,
  device_id VARCHAR(128) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_device_case (campaign_id, device_id, case_id),
  FOREIGN KEY (campaign_id) REFERENCES top_pick_campaigns(id) ON DELETE CASCADE,
  FOREIGN KEY (case_id) REFERENCES top_pick_cases(case_id) ON DELETE CASCADE,
  INDEX idx_tpvotes_campaign (campaign_id),
  INDEX idx_tpvotes_device (campaign_id, device_id)
);

CREATE TABLE IF NOT EXISTS page_sessions (
  session_id VARCHAR(128) PRIMARY KEY,
  device_id VARCHAR(128) NOT NULL,
  entry_path VARCHAR(512),
  page_title VARCHAR(512),
  user_agent VARCHAR(512),
  started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ended_at DATETIME,
  duration_seconds INT NOT NULL DEFAULT 0,
  last_event_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_sessions_device (device_id),
  INDEX idx_sessions_started (started_at)
);

CREATE TABLE IF NOT EXISTS page_events (
  id VARCHAR(64) PRIMARY KEY,
  session_id VARCHAR(128) NOT NULL,
  device_id VARCHAR(128) NOT NULL,
  event_name VARCHAR(128) NOT NULL,
  event_value VARCHAR(512),
  meta JSON NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES page_sessions(session_id) ON DELETE CASCADE,
  INDEX idx_events_session (session_id),
  INDEX idx_events_name (event_name, created_at),
  INDEX idx_events_created (created_at)
);
