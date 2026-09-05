import { Hono } from "hono";
import { Bindings } from "./admin";
import { CreatorDonationSettingsSchema, DonationSettingsSchema, PaymentAccountSchema } from "@overlay/schema";

const creatorSettingsRouter = new Hono<{ Bindings: Bindings }>();

// Helper to map DB row to schema
function mapDbRowToSettings(row: any, creatorId: string) {
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
    }
  };
}

// Get Creator Settings
creatorSettingsRouter.get("/donation-settings", async (c) => {
  const creatorId = c.req.param("id");
  
  const row = await c.env.DB.prepare(
    "SELECT * FROM creator_donation_settings WHERE creator_id = ?"
  ).bind(creatorId).first<any>();

  if (!row) {
    // Return default settings if none exist yet
    const defaultDonation = DonationSettingsSchema.parse({});
    const defaultPayment = PaymentAccountSchema.parse({});
    return c.json({
      creatorId,
      donationSettings: defaultDonation,
      paymentAccount: defaultPayment
    });
  }

  return c.json(mapDbRowToSettings(row, creatorId));
});

// Update Creator Settings
creatorSettingsRouter.patch("/donation-settings", async (c) => {
  const creatorId = c.req.param("id");
  
  let body;
  try {
    body = await c.req.json();
  } catch (e) {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  const result = CreatorDonationSettingsSchema.safeParse(body);
  if (!result.success) {
    return c.json({ error: result.error }, 400);
  }

  const { donationSettings, paymentAccount } = result.data;

  // UPSERT equivalent in SQLite (INSERT ... ON CONFLICT REPLACE / UPDATE)
  // We'll just do an INSERT OR REPLACE
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

  return c.json({ success: true });
});

export default creatorSettingsRouter;
