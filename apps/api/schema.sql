DROP TABLE IF EXISTS overlay_configs;

CREATE TABLE overlay_configs (
  id TEXT PRIMARY KEY,
  theme TEXT NOT NULL DEFAULT 'cyberpunk',
  volume REAL NOT NULL DEFAULT 0.8,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO overlay_configs (id, theme, volume) VALUES ('default_overlay', 'cyberpunk', 0.8);

DROP TABLE IF EXISTS overlays;

CREATE TABLE overlays (
  id TEXT PRIMARY KEY,
  creator_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT 0,
  definition_json TEXT NOT NULL, -- JSON string containing components
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

DROP TABLE IF EXISTS alerts;

CREATE TABLE alerts (
  id TEXT PRIMARY KEY,
  creator_id TEXT NOT NULL,
  name TEXT NOT NULL,
  preset TEXT NOT NULL, -- JSON string of AlertPreset
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

DROP TABLE IF EXISTS audio_assets;

CREATE TABLE audio_assets (
  id TEXT PRIMARY KEY,
  creator_id TEXT NOT NULL,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  size INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

DROP TABLE IF EXISTS assets;

CREATE TABLE assets (
  id TEXT PRIMARY KEY,
  creator_id TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  storage_key TEXT NOT NULL,
  url TEXT,
  size INTEGER NOT NULL,
  width INTEGER,
  height INTEGER,
  duration REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

DROP TABLE IF EXISTS processed_events;

CREATE TABLE processed_events (
  event_id TEXT NOT NULL,
  creator_id TEXT NOT NULL,
  source TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'RECEIVED',
  attempts INTEGER NOT NULL DEFAULT 0,
  received_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  processed_at DATETIME,
  last_error TEXT,
  PRIMARY KEY (creator_id, source, event_id)
);

DROP TABLE IF EXISTS alert_triggers;

CREATE TABLE alert_triggers (
  id TEXT PRIMARY KEY,
  creator_id TEXT NOT NULL,
  source TEXT NOT NULL,
  event_type TEXT NOT NULL,
  alert_id TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(creator_id, source, event_type)
);

CREATE TABLE donations (
  id TEXT PRIMARY KEY,
  creator_id TEXT NOT NULL,
  
  donor_name TEXT,
  message TEXT,
  
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'VND',
  
  payment_provider TEXT NOT NULL,
  payment_reference TEXT NOT NULL,
  provider_transaction_id TEXT,
  
  status TEXT NOT NULL DEFAULT 'PENDING',
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  paid_at DATETIME,
  expires_at DATETIME,
  
  UNIQUE(payment_provider, payment_reference),
  UNIQUE(payment_provider, provider_transaction_id)
);

CREATE TABLE creator_donation_settings (
  creator_id TEXT PRIMARY KEY,
  enabled BOOLEAN NOT NULL DEFAULT 0,
  min_amount INTEGER NOT NULL DEFAULT 10000,
  preset_amounts TEXT NOT NULL DEFAULT '[20000, 50000, 100000, 200000]',
  allow_message BOOLEAN NOT NULL DEFAULT 1,
  allow_anonymous BOOLEAN NOT NULL DEFAULT 1,
  
  payment_provider TEXT,
  payment_bank TEXT,
  payment_account_number TEXT,
  payment_account_name TEXT,
  
  sepay_webhook_secret TEXT,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
