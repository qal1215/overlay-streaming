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
