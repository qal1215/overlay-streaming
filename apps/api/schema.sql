DROP TABLE IF EXISTS overlay_configs;

CREATE TABLE overlay_configs (
  id TEXT PRIMARY KEY,
  theme TEXT NOT NULL DEFAULT 'cyberpunk',
  volume REAL NOT NULL DEFAULT 0.8,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO overlay_configs (id, theme, volume) VALUES ('default_overlay', 'cyberpunk', 0.8);
