ALTER TABLE creator_donation_settings ADD COLUMN sepay_webhook_secret TEXT;

ALTER TABLE processed_events ADD COLUMN status TEXT NOT NULL DEFAULT 'RECEIVED';
ALTER TABLE processed_events ADD COLUMN attempts INTEGER NOT NULL DEFAULT 0;
ALTER TABLE processed_events ADD COLUMN received_at DATETIME DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE processed_events ADD COLUMN last_error TEXT;
