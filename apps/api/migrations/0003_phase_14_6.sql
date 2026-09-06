ALTER TABLE creator_donation_settings ADD COLUMN sepay_webhook_id TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_sepay_webhook_id ON creator_donation_settings(sepay_webhook_id);
