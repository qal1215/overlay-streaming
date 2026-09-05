import { Hono } from "hono";
import { Bindings } from "./admin";
import { CreatorDonationSettingsResponseSchema, UpdateCreatorDonationSettingsSchema, DonationSettingsSchema, PaymentAccountSchema } from "@overlay/schema";
import { SecretEncryptionService } from "../services/SecretEncryptionService";

const creatorSettingsRouter = new Hono<{ Bindings: Bindings }>();

// Helper to map DB row to schema
function mapDbRowToSettings(row: any, creatorId: string, publicApiUrl: string | undefined) {
  const baseUrl = publicApiUrl;
  if (!baseUrl) {
    throw new Error("PUBLIC_API_URL is not configured");
  }
  const sepayWebhookUrl = `${baseUrl}/api/webhooks/sepay/${creatorId}`;
  return {
    creatorId,
    donationSettings: {
      enabled: Boolean(row.enabled),
      minAmount: row.min_amount,
      presetAmounts: JSON.parse(row.preset_amounts),
      allowMessage: Boolean(row.allow_message),
      allowAnonymous: Boolean(row.allow_anonymous),
    },
    paymentAccount: {
      provider: row.payment_provider || 'sepay',
      bank: row.payment_bank || '',
      accountNumber: row.payment_account_number || '',
      accountName: row.payment_account_name || '',
    },
    sepayWebhookConfigured: !!row.sepay_webhook_secret,
    sepayWebhookUrl
  };
}

// Get Creator Settings
creatorSettingsRouter.get("/donation-settings", async (c) => {
  const creatorId = c.req.param("id")!;
  
  const row = await c.env.DB.prepare(
    "SELECT * FROM creator_donation_settings WHERE creator_id = ?"
  ).bind(creatorId).first<any>();

  if (!row) {
    // Return default settings if none exist yet
    const defaultDonation = DonationSettingsSchema.parse({});
    const defaultPayment = PaymentAccountSchema.parse({});
    const baseUrl = c.env.PUBLIC_API_URL;
    if (!baseUrl) {
      throw new Error("PUBLIC_API_URL is not configured");
    }
    return c.json({
      creatorId,
      donationSettings: defaultDonation,
      paymentAccount: defaultPayment,
      sepayWebhookConfigured: false,
      sepayWebhookUrl: `${baseUrl}/api/webhooks/sepay/${creatorId}`
    });
  }

  return c.json(mapDbRowToSettings(row, creatorId, c.env.PUBLIC_API_URL));
});

// Update Creator Settings
creatorSettingsRouter.patch("/donation-settings", async (c) => {
  const creatorId = c.req.param("id")!;
  
  let body;
  try {
    body = await c.req.json();
  } catch (e) {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  const result = UpdateCreatorDonationSettingsSchema.safeParse(body);
  if (!result.success) {
    return c.json({ error: result.error }, 400);
  }

  const { donationSettings, paymentAccount, sepayWebhookSecret } = result.data;
  
  let encryptedSecret: string | null = null;
  if (sepayWebhookSecret) {
    try {
      const encryptor = new SecretEncryptionService(c.env.PLATFORM_ENCRYPTION_KEY);
      encryptedSecret = await encryptor.encrypt(sepayWebhookSecret);
    } catch (e: any) {
      return c.json({ error: e.message || "Failed to encrypt secret" }, 500);
    }
  }

  // UPSERT equivalent in SQLite (INSERT ... ON CONFLICT REPLACE / UPDATE)
  if (encryptedSecret) {
    await c.env.DB.prepare(`
      INSERT INTO creator_donation_settings (
        creator_id, enabled, min_amount, preset_amounts, allow_message, allow_anonymous,
        payment_provider, payment_bank, payment_account_number, payment_account_name,
        sepay_webhook_secret, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP
      )
      ON CONFLICT(creator_id) DO UPDATE SET
        enabled = excluded.enabled,
        min_amount = excluded.min_amount,
        preset_amounts = excluded.preset_amounts,
        allow_message = excluded.allow_message,
        allow_anonymous = excluded.allow_anonymous,
        payment_provider = excluded.payment_provider,
        payment_bank = excluded.payment_bank,
        payment_account_number = excluded.payment_account_number,
        payment_account_name = excluded.payment_account_name,
        sepay_webhook_secret = excluded.sepay_webhook_secret,
        updated_at = CURRENT_TIMESTAMP
    `).bind(
      creatorId,
      donationSettings.enabled ? 1 : 0,
      donationSettings.minAmount,
      JSON.stringify(donationSettings.presetAmounts),
      donationSettings.allowMessage ? 1 : 0,
      donationSettings.allowAnonymous ? 1 : 0,
      paymentAccount.provider,
      paymentAccount.bank,
      paymentAccount.accountNumber,
      paymentAccount.accountName,
      encryptedSecret
    ).run();
  } else {
    await c.env.DB.prepare(`
      INSERT INTO creator_donation_settings (
        creator_id, enabled, min_amount, preset_amounts, allow_message, allow_anonymous,
        payment_provider, payment_bank, payment_account_number, payment_account_name,
        updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP
      )
      ON CONFLICT(creator_id) DO UPDATE SET
        enabled = excluded.enabled,
        min_amount = excluded.min_amount,
        preset_amounts = excluded.preset_amounts,
        allow_message = excluded.allow_message,
        allow_anonymous = excluded.allow_anonymous,
        payment_provider = excluded.payment_provider,
        payment_bank = excluded.payment_bank,
        payment_account_number = excluded.payment_account_number,
        payment_account_name = excluded.payment_account_name,
        updated_at = CURRENT_TIMESTAMP
    `).bind(
      creatorId,
      donationSettings.enabled ? 1 : 0,
      donationSettings.minAmount,
      JSON.stringify(donationSettings.presetAmounts),
      donationSettings.allowMessage ? 1 : 0,
      donationSettings.allowAnonymous ? 1 : 0,
      paymentAccount.provider,
      paymentAccount.bank,
      paymentAccount.accountNumber,
      paymentAccount.accountName
    ).run();
  }

  return c.json({ success: true });
});

// Generate/Rotate SePay Secret
creatorSettingsRouter.post("/donation-settings/generate-sepay-secret", async (c) => {
  const creatorId = c.req.param("id")!;

  // Generate 32-byte secret
  const randomBytes = crypto.getRandomValues(new Uint8Array(32));
  const newSecret = "sk_live_" + Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('');

  try {
    const encryptor = new SecretEncryptionService(c.env.PLATFORM_ENCRYPTION_KEY);
    const encryptedSecret = await encryptor.encrypt(newSecret);

    await c.env.DB.prepare(`
      INSERT INTO creator_donation_settings (
        creator_id, sepay_webhook_secret, updated_at
      ) VALUES (
        ?, ?, CURRENT_TIMESTAMP
      )
      ON CONFLICT(creator_id) DO UPDATE SET
        sepay_webhook_secret = excluded.sepay_webhook_secret,
        updated_at = CURRENT_TIMESTAMP
    `).bind(creatorId, encryptedSecret).run();

    return c.json({
      secret: newSecret,
      warning: "Store this secret securely. It will not be shown again."
    });
  } catch (e: any) {
    return c.json({ error: e.message || "Failed to generate and save secret" }, 500);
  }
});

// Get Creator Donations History
creatorSettingsRouter.get("/donations", async (c) => {
  const creatorId = c.req.param("id")!;
  const url = new URL(c.req.url);
  const status = url.searchParams.get("status") || "All";
  const limit = parseInt(url.searchParams.get("limit") || "50");
  const offset = parseInt(url.searchParams.get("offset") || "0");
  
  let query = "SELECT d.*, p.status as processed_status, p.processed_at as alert_processed_at FROM donations d LEFT JOIN processed_events p ON d.payment_reference = p.event_id AND p.source = d.payment_provider WHERE d.creator_id = ?";
  const params: any[] = [creatorId];
  
  if (status !== "All") {
    query += " AND d.status = ?";
    params.push(status.toUpperCase());
  }
  
  query += " ORDER BY d.created_at DESC LIMIT ? OFFSET ?";
  params.push(limit, offset);
  
  const { results } = await c.env.DB.prepare(query).bind(...params).all();
  
  // Also get some summary stats using Vietnam time (UTC+7)
  const statsQuery = await c.env.DB.prepare(`
    SELECT 
      COUNT(*) as total_count,
      SUM(amount) as total_amount,
      SUM(CASE WHEN date(datetime(paid_at, '+7 hours')) = date(datetime('now', '+7 hours')) THEN 1 ELSE 0 END) as today_count,
      SUM(CASE WHEN date(datetime(paid_at, '+7 hours')) = date(datetime('now', '+7 hours')) THEN amount ELSE 0 END) as today_amount,
      SUM(CASE WHEN strftime('%Y-%m', datetime(paid_at, '+7 hours')) = strftime('%Y-%m', datetime('now', '+7 hours')) THEN 1 ELSE 0 END) as month_count,
      SUM(CASE WHEN strftime('%Y-%m', datetime(paid_at, '+7 hours')) = strftime('%Y-%m', datetime('now', '+7 hours')) THEN amount ELSE 0 END) as month_amount
    FROM donations 
    WHERE creator_id = ? AND status = 'PAID'
  `).bind(creatorId).first<any>();

  return c.json({
    donations: results,
    stats: {
      totalCount: statsQuery?.total_count || 0,
      totalAmount: statsQuery?.total_amount || 0,
      todayCount: statsQuery?.today_count || 0,
      todayAmount: statsQuery?.today_amount || 0,
      monthCount: statsQuery?.month_count || 0,
      monthAmount: statsQuery?.month_amount || 0,
    }
  });
});

export default creatorSettingsRouter;
