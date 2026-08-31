import { Hono } from "hono";
import { Bindings } from "./admin";
import { AlertService } from "../services/alert-service";
import { WebhookAdapter } from "../services/adapters/WebhookAdapter";
import { TriggerMapper } from "../services/trigger-mapper";
import { ResolvedAlertEvent } from "@overlay/schema";

const webhooksRouter = new Hono<{ Bindings: Bindings }>();

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
