import { Hono } from "hono";
import { Bindings } from "./admin";
import { AlertService } from "../services/alert-service";
import { WebhookAdapter } from "../services/adapters/WebhookAdapter";
import { TriggerMapper } from "../services/trigger-mapper";
import { ResolvedAlertEvent } from "@overlay/schema";
import { SePayAdapter } from "../services/adapters/SePayAdapter";
import { DonationService } from "../services/DonationService";
import { SecretEncryptionService } from "../services/SecretEncryptionService";

const webhooksRouter = new Hono<{ Bindings: Bindings }>();

webhooksRouter.post("/sepay/:creatorId", async (c) => {
  const creatorId = c.req.param("creatorId");

  // Load creator settings
  const settingsRow = await c.env.DB.prepare(
    "SELECT * FROM creator_donation_settings WHERE creator_id = ?"
  ).bind(creatorId).first<any>();

  if (!settingsRow || !settingsRow.sepay_webhook_secret || !settingsRow.enabled || settingsRow.payment_provider !== 'sepay') {
    return c.json({ error: "SePay webhook is not configured" }, 404);
  }

  // Decrypt secret
  let secret = "";
  try {
    const encryptor = new SecretEncryptionService(c.env.PLATFORM_ENCRYPTION_KEY);
    secret = await encryptor.decrypt(settingsRow.sepay_webhook_secret);
  } catch (e) {
    console.error("Failed to decrypt webhook secret", e);
    return c.json({ error: "Internal Configuration Error" }, 500);
  }

  const adapter = new SePayAdapter(secret);
  
  // 1. Signature validation
  const signature = c.req.header("X-SePay-Signature") || "";
  const timestamp = c.req.header("X-SePay-Timestamp") || "";
  const rawBody = await c.req.text();

  if (!signature || !timestamp) {
    return c.json({ error: "Missing signature or timestamp headers" }, 401);
  }

  const isValid = await adapter.validateSignature(rawBody, timestamp, signature);
  if (!isValid) {
    return c.json({ error: "Invalid signature or expired timestamp" }, 401);
  }

  let body;
  try {
    body = JSON.parse(rawBody);
  } catch (e) {
    return c.json({ error: "Invalid JSON" }, 400);
  }

  try {
    const { SePayWebhookPayloadSchema } = await import("@overlay/schema");
    const payloadResult = SePayWebhookPayloadSchema.safeParse(body);
    if (!payloadResult.success) {
      console.error("[SePay Webhook] Malformed payload details:", payloadResult.error);
      return c.json({ error: "Malformed payload" }, 400);
    }

    // 2. Validate destination account
    if (payloadResult.data.accountNumber !== settingsRow.payment_account_number) {
      return c.json({ error: "Destination account mismatch" }, 400);
    }

    // 3. Normalization
    const paymentEvent = adapter.normalize(payloadResult.data);
    const eventId = paymentEvent.transactionId;
    const source = paymentEvent.provider;

    // 4. Idempotency Check & Atomic Claim
    try {
      // Ensure the row exists
      await c.env.DB.prepare(
        "INSERT INTO processed_events (event_id, creator_id, source, status, attempts) VALUES (?, ?, ?, 'RECEIVED', 0)"
      ).bind(eventId, creatorId, source).run();
    } catch (e: any) {
      // Ignore unique constraint failures
    }

    // Recover stale PROCESSING events (>5 min)
    await c.env.DB.prepare(
      `UPDATE processed_events
       SET status = 'FAILED', last_error = 'Webhook processing timeout', processing_started_at = NULL
       WHERE creator_id = ? AND source = ? AND event_id = ? AND status = 'PROCESSING' 
       AND processing_started_at < datetime('now', '-5 minutes')`
    ).bind(creatorId, source, eventId).run();

    // Attempt to atomically claim for processing
    const claimResult = await c.env.DB.prepare(
      "UPDATE processed_events SET status = 'PROCESSING', attempts = attempts + 1, processing_started_at = CURRENT_TIMESTAMP WHERE creator_id = ? AND source = ? AND event_id = ? AND status IN ('RECEIVED', 'FAILED')"
    ).bind(creatorId, source, eventId).run();

    if (claimResult.meta.changes !== 1) {
      // Could not claim it (already COMPLETED or PROCESSING)
      const currentStatus = await c.env.DB.prepare(
        "SELECT status FROM processed_events WHERE creator_id = ? AND source = ? AND event_id = ?"
      ).bind(creatorId, source, eventId).first<any>();

      if (currentStatus?.status === 'COMPLETED') {
        return c.json({ success: true, message: "Duplicate event already completed" }, 200);
      } else {
        return c.json({ success: true, message: "Event is currently processing" }, 200);
      }
    }

    let alertEvent;
    try {
      // 5. DonationService processing (Financial State Transition)
      const donationService = new DonationService(c.env.DB);
      const donation = await donationService.getDonationByReference(paymentEvent.referenceCode);
      
      if (!donation) {
        throw new Error(`Donation not found for reference ${paymentEvent.referenceCode}`);
      }

      if (donation.creator_id !== creatorId) {
        throw new Error(`Donation ownership mismatch`);
      }

      alertEvent = await donationService.processPaymentEvent(paymentEvent);
    } catch (e: any) {
      // Failed during payment processing
      await c.env.DB.prepare(
        "UPDATE processed_events SET status = 'FAILED', last_error = ?, processing_started_at = NULL WHERE creator_id = ? AND source = ? AND event_id = ?"
      ).bind(e.message, creatorId, source, eventId).run();
      console.error("SePay webhook processing error:", e);
      return c.json({ error: "Payment processing failed" }, 400);
    }

    if (!alertEvent) {
       // Could be already paid or invalid without throwing, mark completed anyway
       await c.env.DB.prepare(
        "UPDATE processed_events SET status = 'COMPLETED', processed_at = CURRENT_TIMESTAMP WHERE creator_id = ? AND source = ? AND event_id = ?"
      ).bind(creatorId, source, eventId).run();
       return c.json({ success: true, message: "Payment ignored or already processed" });
    }

    // 6. Trigger Mapper & Alert Dispatch
    try {
      const triggerMapper = new TriggerMapper(c.env.DB);
      const alertId = await triggerMapper.resolve(creatorId, alertEvent.source, alertEvent.type);

      if (alertId) {
        const resolvedEvent: ResolvedAlertEvent = {
          event: alertEvent,
          alertId,
        };
        const alertService = new AlertService(c.env.DB, c.env.OVERLAY_ROOM);
        await alertService.dispatchAlert(creatorId, resolvedEvent);
      }

      // Successful E2E
      await c.env.DB.prepare(
        "UPDATE processed_events SET status = 'COMPLETED', processed_at = CURRENT_TIMESTAMP WHERE creator_id = ? AND source = ? AND event_id = ?"
      ).bind(creatorId, source, eventId).run();
      
      return c.json({ success: true });
    } catch (e: any) {
      // Alert failed, but payment succeeded. Do NOT rollback payment.
      // Mark event as FAILED so it can be retried (the payment processing step is idempotent).
      await c.env.DB.prepare(
        "UPDATE processed_events SET status = 'FAILED', last_error = ?, processing_started_at = NULL WHERE creator_id = ? AND source = ? AND event_id = ?"
      ).bind("Alert dispatch failed: " + e.message, creatorId, source, eventId).run();
      console.error("SePay webhook alert dispatch error:", e);
      // Return 500 so provider retries the webhook
      return c.json({ error: "Alert dispatch failed" }, 500);
    }
  } catch (e: any) {
    console.error("SePay webhook error:", e);
    return c.json({ error: "Internal Server Error" }, 500);
  }
});

webhooksRouter.post("/:creatorId", async (c) => {
  const creatorId = c.req.param("creatorId");
  
  // 1. Simple Authentication
  const authHeader = c.req.header("X-Webhook-Secret") || c.req.header("Authorization");
  const expectedSecret = c.env.ADMIN_SECRET;
  
  if (!expectedSecret) {
    return c.json({ error: "Webhook authentication is not configured on the server" }, 500);
  }

  let isAuthed = false;
  if (authHeader === expectedSecret || authHeader === `Bearer ${expectedSecret}`) {
    isAuthed = true;
  }
  
  if (!isAuthed) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  // 2. Parse payload
  let body;
  try {
    body = await c.req.json();
  } catch (e) {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  const adapter = new WebhookAdapter();

  try {
    // 3. Normalize to AlertEvent
    const alertEvent = adapter.normalize(creatorId, body);

    // 4. Idempotency Check (Insert before mapping resolution)
    try {
      await c.env.DB.prepare(
        `INSERT INTO processed_events (event_id, creator_id, source, status, processed_at) VALUES (?, ?, ?, 'COMPLETED', CURRENT_TIMESTAMP)`
      )
        .bind(alertEvent.eventId, creatorId, alertEvent.source)
        .run();
    } catch (e: any) {
      if (e.message && e.message.includes("UNIQUE constraint failed")) {
        console.log(`[Webhook] Duplicate event ignored: ${alertEvent.eventId}`);
        return c.json({ success: true, message: "Duplicate event ignored" }, 409);
      }
      throw e;
    }

    // 5. Trigger Mapping Resolution
    const triggerMapper = new TriggerMapper(c.env.DB);
    const alertId = await triggerMapper.resolve(creatorId, alertEvent.source, alertEvent.type);

    if (!alertId) {
      console.log(`[Webhook] No trigger mapping found for event type: ${alertEvent.type}`);
      return c.json({ success: true, message: "No alert mapping configured" }, 200);
    }

    // 6. Wrap in ResolvedAlertEvent
    const resolvedEvent: ResolvedAlertEvent = {
      event: alertEvent,
      alertId,
    };

    // 7. Dispatch Event
    const alertService = new AlertService(c.env.DB, c.env.OVERLAY_ROOM);
    await alertService.dispatchAlert(creatorId, resolvedEvent);

    return c.json({ success: true, eventId: alertEvent.eventId });
  } catch (e: any) {
    console.error("Webhook processing error:", e);
    return c.json({ error: e.message }, 400);
  }
});

export default webhooksRouter;
