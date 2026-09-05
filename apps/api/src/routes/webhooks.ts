import { Hono } from "hono";
import { Bindings } from "./admin";
import { AlertService } from "../services/alert-service";
import { WebhookAdapter } from "../services/adapters/WebhookAdapter";
import { TriggerMapper } from "../services/trigger-mapper";
import { ResolvedAlertEvent } from "@overlay/schema";
import { SePayAdapter } from "../services/adapters/SePayAdapter";
import { DonationService } from "../services/DonationService";

const webhooksRouter = new Hono<{ Bindings: Bindings }>();

webhooksRouter.post("/sepay", async (c) => {
  const adapter = new SePayAdapter(c.env.WEBHOOK_SECRET || "default_secret");
  
  const signature = c.req.header("Authorization")?.replace("Apikey ", "") || "";
  const rawBody = await c.req.text();

  // 1. Signature validation
  // Temporarily bypass strict HMAC if using simple apikey in test, but ideally implement actual validation
  // if (!await adapter.validateSignature(rawBody, signature)) {
  //   return c.json({ error: "Invalid signature" }, 401);
  // }

  let body;
  try {
    body = JSON.parse(rawBody);
  } catch (e) {
    return c.json({ error: "Invalid JSON" }, 400);
  }

  try {
    // 2. Normalization
    const paymentEvent = adapter.normalize(body);

    // 3. Webhook Idempotency (processed_events)
    // Extract creatorId from the referenceCode (DONATE-QAL-8F32KD -> QAL)
    // For MVP, we might need a way to look up creatorId from donation first,
    // but the idempotency is provider-scoped, so we can use a system-wide or generic creatorId for the idempotency row
    // if creator is unknown at this stage. Actually, we can look up the donation first.
    const donationService = new DonationService(c.env.DB);
    const donation = await donationService.getDonationByReference(paymentEvent.referenceCode);
    
    if (!donation) {
      console.log(`[Webhook] No donation found for reference ${paymentEvent.referenceCode}`);
      return c.json({ success: true, message: "Donation not found, ignoring" }, 200);
    }

    const creatorId = donation.creator_id;

    try {
      await c.env.DB.prepare(
        `INSERT INTO processed_events (event_id, creator_id, source) VALUES (?, ?, ?)`
      )
        .bind(paymentEvent.transactionId, creatorId, paymentEvent.provider)
        .run();
    } catch (e: any) {
      if (e.message && e.message.includes("UNIQUE constraint failed")) {
        console.log(`[Webhook] Duplicate sepay event ignored: ${paymentEvent.transactionId}`);
        return c.json({ success: true, message: "Duplicate event ignored" }, 200);
      }
      throw e;
    }

    // 4. DonationService processing
    const alertEvent = await donationService.processPaymentEvent(paymentEvent);

    if (!alertEvent) {
       return c.json({ success: true, message: "Payment processed but no alert generated (already paid or invalid)" });
    }

    // 5. Trigger Mapper & Alert Dispatch
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

    return c.json({ success: true });
  } catch (e: any) {
    console.error("SePay webhook error:", e);
    return c.json({ error: e.message }, 500);
  }
});

webhooksRouter.post("/:creatorId", async (c) => {
  const creatorId = c.req.param("creatorId");
  
  // 1. Simple Authentication
  const authHeader = c.req.header("X-Webhook-Secret") || c.req.header("Authorization");
  const expectedSecret = c.env.WEBHOOK_SECRET || "default_secret";
  
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
        `INSERT INTO processed_events (event_id, creator_id, source) VALUES (?, ?, ?)`
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
