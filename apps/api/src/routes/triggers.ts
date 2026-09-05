import { Hono } from "hono";
import { Bindings } from "./admin";
import * as triggerQueries from "../db/queries/triggers";
import { AlertService } from "../services/alert-service";

const triggersRouter = new Hono<{ Bindings: Bindings }>();

triggersRouter.get("/", async (c) => {
  const creatorId = c.req.param("id")!;
  const triggers = await triggerQueries.getTriggersByCreator(c.env.DB, creatorId);
  return c.json(triggers);
});

triggersRouter.post("/", async (c) => {
  const creatorId = c.req.param("id")!;
  const body = await c.req.json();

  const { source, eventType, alertId, enabled } = body;
  
  if (!source || !eventType || !alertId) {
    return c.json({ error: "Missing required fields" }, 400);
  }

  // Validate that the alert actually belongs to this creator
  const alertService = new AlertService(c.env.DB);
  const alert = await alertService.getAlert(creatorId, alertId);
  if (!alert) {
    return c.json({ error: "Alert not found or not owned by creator" }, 400);
  }

  const triggerId = crypto.randomUUID();
  try {
    await triggerQueries.insertTrigger(
      c.env.DB,
      triggerId,
      creatorId,
      source,
      eventType,
      alertId,
      enabled !== false
    );
    return c.json({ id: triggerId, creatorId, source, eventType, alertId, enabled: enabled !== false });
  } catch (e: any) {
    if (e.message && e.message.includes("UNIQUE constraint failed")) {
      return c.json({ error: "A trigger for this source and event type already exists" }, 409);
    }
    return c.json({ error: "Failed to create trigger" }, 500);
  }
});

triggersRouter.patch("/:triggerId", async (c) => {
  const creatorId = c.req.param("id")!;
  const triggerId = c.req.param("triggerId");
  const body = await c.req.json();

  // Validate if alertId is being changed, that the new alert is owned by the creator
  if (body.alertId) {
    const alertService = new AlertService(c.env.DB);
    const alert = await alertService.getAlert(creatorId, body.alertId);
    if (!alert) {
      return c.json({ error: "Alert not found or not owned by creator" }, 400);
    }
  }

  const { results } = await c.env.DB.prepare("SELECT * FROM alert_triggers WHERE id = ? AND creator_id = ?").bind(triggerId, creatorId).all();
  if (results.length === 0) {
    return c.json({ error: "Trigger not found" }, 404);
  }
  
  const current = results[0] as any;
  const newAlertId = body.alertId ?? current.alert_id;
  const newEnabled = body.enabled ?? current.enabled;

  await triggerQueries.updateTrigger(c.env.DB, triggerId, creatorId, newAlertId, newEnabled);
  return c.json({ success: true });
});

triggersRouter.delete("/:triggerId", async (c) => {
  const creatorId = c.req.param("id")!;
  const triggerId = c.req.param("triggerId");
  
  await triggerQueries.deleteTrigger(c.env.DB, triggerId, creatorId);
  return c.json({ success: true });
});

export default triggersRouter;
