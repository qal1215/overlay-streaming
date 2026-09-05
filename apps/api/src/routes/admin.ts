import { Hono } from "hono";
import overlaysRouter from "./overlays";
import alertsRouter from "./alerts";
import audioRouter from "./audio";
import assetsRouter from "./assets";
import { AlertService } from "../services/alert-service";
export type Bindings = {
  DB: D1Database;
  OVERLAY_ROOM: DurableObjectNamespace;
  ASSETS_BUCKET: R2Bucket;
  WEBHOOK_SECRET?: string;
};

const adminRouter = new Hono<{ Bindings: Bindings }>();

// Admin Access Context & Ownership boundary
async function authorizeCreatorAccess(c: any, creatorId: string): Promise<boolean> {
  const authHeader = c.req.header("Authorization") || c.req.header("X-Admin-Secret");
  const adminSecret = c.env.ADMIN_SECRET || c.env.WEBHOOK_SECRET || "default_admin_secret"; // Fallback for MVP if not set

  // In the future (Phase 15/16), this will verify JWT/session identity and check if the user owns creatorId.
  // For now, we use a simple shared secret to protect the admin routes from arbitrary public access.
  if (authHeader === adminSecret || authHeader === `Bearer ${adminSecret}`) {
    return true;
  }
  return false;
}

// Middleware to protect admin routes
adminRouter.use("/creator/:id/*", async (c, next) => {
  const creatorId = c.req.param("id");
  const isAuthorized = await authorizeCreatorAccess(c, creatorId);
  if (!isAuthorized) {
    return c.json({ error: "Unauthorized access to creator admin resources" }, 401);
  }
  await next();
});

// Get the creator's overlay configuration
adminRouter.get("/creator/:id/config", async (c) => {
  const creatorId = c.req.param("id");
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM overlay_configs WHERE id = ?"
  )
    .bind(creatorId)
    .all();

  if (results.length === 0) {
    // Return default config if not found
    return c.json({ id: creatorId, theme: "cyberpunk", volume: 0.8 });
  }

  return c.json(results[0]);
});

// Update the creator's overlay configuration
adminRouter.put("/creator/:id/config", async (c) => {
  const creatorId = c.req.param("id");
  const body = await c.req.json().catch(() => ({}));
  const { theme, volume } = body;

  const result = await c.env.DB.prepare(
    `INSERT INTO overlay_configs (id, theme, volume) 
     VALUES (?, ?, ?) 
     ON CONFLICT(id) DO UPDATE SET 
     theme=excluded.theme, 
     volume=excluded.volume,
     updated_at=CURRENT_TIMESTAMP`
  )
    .bind(creatorId, theme || "cyberpunk", volume ?? 0.8)
    .run();

  if (result.success) {
    // Broadcast config update to Overlay via Durable Object
    const id = c.env.OVERLAY_ROOM.idFromName(creatorId);
    const room = c.env.OVERLAY_ROOM.get(id);
    
    await room.fetch(new Request("http://do/broadcast", {
      method: "POST",
      body: JSON.stringify({
        type: "CONFIG_UPDATED",
        data: { theme, volume }
      }),
    }));

    return c.json({ success: true, message: "Config updated" });
  }

  return c.json({ error: "Failed to update config" }, 500);
});

adminRouter.post("/creator/:id/test-alert", async (c) => {
  const creatorId = c.req.param("id");
  const body = await c.req.json().catch(() => ({}));

  const mockEvent = {
    eventId: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    creatorId: creatorId,
    source: "dashboard",
    type: "donation" as const,
    timestamp: Date.now(),
    actor: {
      name: body.name || "Test Actor",
    },
    donation: {
      amount: body.amount || "$10.00",
      currency: body.currency || "USD",
    },
    message: body.message || "This is a test alert from the admin dashboard!",
  };

  // The client connects to DO using overlayId, so we must broadcast to the correct overlay
  if (body.overlayId) {
    const doId = c.env.OVERLAY_ROOM.idFromName(body.overlayId);
    const room = c.env.OVERLAY_ROOM.get(doId);
    
    await room.fetch(new Request("http://do/broadcast", {
      method: "POST",
      body: JSON.stringify({
        type: "alert:event",
        resolved: {
          event: mockEvent,
          alertId: body.presetId || "", // Temporary fallback, but real tests should send presetId
        },
      }),
    }));
  } else {
    // Fallback to legacy AlertService behavior if no overlayId is provided
    const alertService = new AlertService(c.env.DB, c.env.OVERLAY_ROOM);
    await alertService.dispatchAlert(creatorId, {
      event: mockEvent,
      alertId: body.presetId || "",
    });
  }

  return c.json({ success: true, message: "Test alert triggered", event: mockEvent });
});

import triggersRouter from "./triggers";
import creatorSettingsRouter from "./creator-settings";

adminRouter.route("/creator/:id/overlays", overlaysRouter);
adminRouter.route("/creator/:id/alerts", alertsRouter);
adminRouter.route("/creator/:id/audio", audioRouter);
adminRouter.route("/creator/:id/assets", assetsRouter);
adminRouter.route("/creator/:id/triggers", triggersRouter);
adminRouter.route("/creator/:id", creatorSettingsRouter);

export default adminRouter;
