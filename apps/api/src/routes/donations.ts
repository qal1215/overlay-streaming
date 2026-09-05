import { Hono } from "hono";
import { Bindings } from "./admin";
import { DonationService } from "../services/DonationService";
import { SePayProvider } from "../services/providers/SePayProvider";
import { CreateDonationRequestSchema } from "@overlay/schema";

const donationsRouter = new Hono<{ Bindings: Bindings }>();

// Get Public Donation Page Info
donationsRouter.get("/creators/:creatorId/donation-page", async (c) => {
  const creatorId = c.req.param("creatorId");
  
  const row = await c.env.DB.prepare(
    "SELECT * FROM creator_donation_settings WHERE creator_id = ?"
  ).bind(creatorId).first<any>();

  if (!row) {
    return c.json({ error: "Creator not found or donations not configured" }, 404);
  }

  return c.json({
    creator: {
      username: creatorId,
      displayName: creatorId,
    },
    donation: {
      enabled: Boolean(row.enabled),
      minAmount: row.min_amount,
      presetAmounts: JSON.parse(row.preset_amounts),
      allowMessage: Boolean(row.allow_message),
      allowAnonymous: Boolean(row.allow_anonymous),
      currency: "VND"
    }
  });
});

// Create Donation
donationsRouter.post("/creators/:creatorId/donations", async (c) => {
  const creatorId = c.req.param("creatorId");
  
  const settingsRow = await c.env.DB.prepare(
    "SELECT * FROM creator_donation_settings WHERE creator_id = ?"
  ).bind(creatorId).first<any>();

  if (!settingsRow || !settingsRow.enabled) {
    return c.json({ error: "Donations are not enabled for this creator" }, 400);
  }

  let body;
  try {
    body = await c.req.json();
  } catch (e) {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  const result = CreateDonationRequestSchema.safeParse(body);
  if (!result.success) {
    return c.json({ error: result.error }, 400);
  }

  const { amount, donorName, message } = result.data;
  
  if (amount < settingsRow.min_amount) {
    return c.json({ error: `Amount must be at least ${settingsRow.min_amount}` }, 400);
  }

  if (message && !settingsRow.allow_message) {
    return c.json({ error: "Messages are not allowed" }, 400);
  }

  if (!donorName && !settingsRow.allow_anonymous) {
    return c.json({ error: "Anonymous donations are not allowed" }, 400);
  }
  
  const donationService = new DonationService(c.env.DB);
  const donation = await donationService.createDonation(creatorId, amount, donorName, message);
  
  const bankId = settingsRow.payment_bank;
  const accountNo = settingsRow.payment_account_number;
  
  if (!bankId || !accountNo) {
    return c.json({ error: "Payment account is not configured" }, 400);
  }

  const paymentProvider = new SePayProvider();
  
  const paymentIntent = await paymentProvider.createPaymentIntent({
    donationId: donation.id,
    amount: donation.amount,
    currency: donation.currency,
    reference: donation.paymentReference,
    paymentAccount: {
      bank: bankId,
      accountNumber: accountNo,
      accountName: settingsRow.payment_account_name
    }
  });

  return c.json({
    id: donation.id,
    amount: donation.amount,
    currency: donation.currency,
    paymentReference: donation.paymentReference,
    status: donation.status,
    expiresAt: donation.expiresAt,
    payment: {
      provider: paymentIntent.provider,
      ...paymentIntent.instructions
    }
  });
});

// Poll Donation Status
donationsRouter.get("/donations/:id", async (c) => {
  const donationId = c.req.param("id");
  const donationService = new DonationService(c.env.DB);
  const donation = await donationService.getDonation(donationId);
  
  if (!donation) {
    return c.json({ error: "Donation not found" }, 404);
  }

  // Only return necessary public info for polling
  return c.json({
    id: donation.id,
    amount: donation.amount,
    currency: donation.currency,
    status: donation.status,
  });
});

export default donationsRouter;
