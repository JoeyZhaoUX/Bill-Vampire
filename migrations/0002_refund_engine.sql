-- Refund recovery engine: stateful case ladder, outcome capture, refund intelligence graph, inbox monitoring.
-- Additive only; existing emergency_cases rows default to status='draft', current_step=0.

ALTER TABLE emergency_cases ADD COLUMN status TEXT NOT NULL DEFAULT 'draft';
ALTER TABLE emergency_cases ADD COLUMN current_step INTEGER NOT NULL DEFAULT 0;
ALTER TABLE emergency_cases ADD COLUMN amount_recovered REAL NOT NULL DEFAULT 0;
ALTER TABLE emergency_cases ADD COLUMN next_action_at TEXT;
ALTER TABLE emergency_cases ADD COLUMN charge_type TEXT;
ALTER TABLE emergency_cases ADD COLUMN jurisdiction TEXT NOT NULL DEFAULT 'US';

CREATE INDEX IF NOT EXISTS idx_cases_next_action ON emergency_cases(next_action_at);

CREATE TABLE IF NOT EXISTS case_events (
  id TEXT PRIMARY KEY,
  case_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  event_type TEXT NOT NULL, -- step_generated | user_sent | merchant_replied | escalated | outcome_reported | reminder_fired
  step_index INTEGER,
  payload_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (case_id) REFERENCES emergency_cases(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_case_events_case ON case_events(case_id);
CREATE INDEX IF NOT EXISTS idx_case_events_user ON case_events(user_id);

-- Refund Intelligence Graph: aggregated, Beta-smoothed success data per (service, charge_type).
-- success_rate/sample_count are derived from case_outcomes; never hand-authored beyond the seed import.
CREATE TABLE IF NOT EXISTS refund_intelligence (
  id TEXT PRIMARY KEY,
  service TEXT NOT NULL,
  charge_type TEXT NOT NULL,
  best_path TEXT,
  success_rate REAL,
  sample_count INTEGER NOT NULL DEFAULT 0,
  avg_days_to_refund REAL,
  refund_window_days INTEGER,
  working_contacts_json TEXT,
  is_seed_estimate INTEGER NOT NULL DEFAULT 1, -- 1 until real case_outcomes exist for this pair
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(service, charge_type)
);

CREATE TABLE IF NOT EXISTS case_outcomes (
  id TEXT PRIMARY KEY,
  case_id TEXT,
  user_id TEXT NOT NULL,
  service TEXT NOT NULL,
  charge_type TEXT NOT NULL,
  path_used TEXT,
  won INTEGER NOT NULL, -- 1 = recovered, 0 = not recovered
  amount REAL,
  days_to_resolve INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- One outcome vote per user per (service, charge_type) — prevents a single user from padding the graph.
CREATE UNIQUE INDEX IF NOT EXISTS idx_case_outcomes_dedup ON case_outcomes(user_id, service, charge_type);
CREATE INDEX IF NOT EXISTS idx_case_outcomes_service ON case_outcomes(service, charge_type);

CREATE TABLE IF NOT EXISTS inbox_sources (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  kind TEXT NOT NULL, -- gmail_oauth | forward_alias
  gmail_refresh_token TEXT,
  forward_alias TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  last_scan_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_inbox_sources_user ON inbox_sources(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_inbox_sources_alias ON inbox_sources(forward_alias);

CREATE TABLE IF NOT EXISTS monitored_charges (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  service TEXT,
  amount REAL,
  detected_at TEXT,
  source TEXT, -- gmail | forward
  triage TEXT NOT NULL DEFAULT 'new', -- new | expected | dispute_started | dismissed
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_monitored_charges_user ON monitored_charges(user_id);
