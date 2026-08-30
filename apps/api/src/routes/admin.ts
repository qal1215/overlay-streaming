import { Hono } from "hono";
import overlaysRouter from "./overlays";
import alertsRouter from "./alerts";
import audioRouter from "./audio";
export type Bindings = {
  DB: D1Database;
  OVERLAY_ROOM: DurableObjectNamespace;
  ASSETS_BUCKET: R2Bucket;
};

const adminRouter = new Hono<{ Bindings: Bindings }>();

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

// Trigger a test alert to the creator's overlay
adminRouter.post("/creator/:id/test-alert", async (c) => {
  const creatorId = c.req.param("id");
  const body = await c.req.json().catch(() => ({}));

  // Create a mock alert event based on requested theme or fallback to cyberpunk
  const mockAlert = {
    type: "NEW_ALERT",
    data: {
      id: Date.now().toString(),
      preset: { theme: body.theme || "cyberpunk" },
      data: {
        donorName: "Test_Admin",
        amount: "$100.00",
        message: "This is a test alert from the admin dashboard!",
        imageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Admin",
      },
      timeline: {
        duration: 6000,
        events: [
          { at: 0, type: "enter", sound: "enter-sound-mock" },
          { at: 300, type: "impact", sound: "impact-sound-mock" },
          { at: 5500, type: "exit" },
        ],
      },
    },
  };

  // Get the Durable Object for this creator
  const id = c.env.OVERLAY_ROOM.idFromName(creatorId);
  const room = c.env.OVERLAY_ROOM.get(id);

  // Instead of calling HTTP on the DO, we can use RPC (if enabled) or standard fetch.
  // We'll use a standard HTTP fetch to the DO to trigger the broadcast.
  // Wait, the standard way to call a custom method on DO via fetch is sending a custom path or method.
  // Let's send a POST request to the DO.
  const response = await room.fetch(new Request("http://do/broadcast", {
    method: "POST",
    body: JSON.stringify(mockAlert),
  }));

  return c.json({ success: true, message: "Test alert triggered" });
});

adminRouter.route("/creator/:id/overlays", overlaysRouter);
adminRouter.route("/creator/:id/alerts", alertsRouter);
adminRouter.route("/creator/:id/audio", audioRouter);

export default adminRouter;
