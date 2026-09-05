import { Hono } from "hono";
import { cors } from "hono/cors";

import adminRouter from "./routes/admin";
import webhooksRouter from "./routes/webhooks";
import donationsRouter from "./routes/donations";
import { OverlayRoom } from "./durable-objects/OverlayRoom";

type Bindings = {
  DB: D1Database;
  OVERLAY_ROOM: DurableObjectNamespace;
  ASSETS_BUCKET: R2Bucket;
  ADMIN_SECRET?: string;
  PLATFORM_ENCRYPTION_KEY: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use(
  "/api/*",
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174", "http://localhost:3000"],
    credentials: true,
  })
);

app.route("/api/admin", adminRouter);
app.route("/api/webhooks", webhooksRouter);
app.route("/api/public", donationsRouter);

// Serve R2 Assets by Object Key OR Asset ID
app.get("/api/assets/*", async (c) => {
  const path = c.req.path.replace('/api/assets/', '');
  if (!path) return c.json({ error: "No key provided" }, 400);

  let objectKey = path;

  // If the path looks like an assetId (starts with asset_), lookup the storage_key in D1
  if (path.startsWith('asset_')) {
    const { results } = await c.env.DB.prepare(
      "SELECT storage_key FROM assets WHERE id = ?"
    )
      .bind(path)
      .all();
      
    if (results.length > 0) {
      objectKey = results[0].storage_key as string;
    }
  }

  const object = await c.env.ASSETS_BUCKET.get(objectKey);
  
  if (object === null) {
    return c.json({ error: "Not found" }, 404);
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  // Cache aggressively for 1 year
  headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  
  return new Response(object.body, {
    headers,
  });
});

// The WebSocket entry point for the overlay
app.get("/api/overlay/:overlayId/ws", async (c) => {
  const overlayId = c.req.param("overlayId");
  const id = c.env.OVERLAY_ROOM.idFromName(overlayId);
  const room = c.env.OVERLAY_ROOM.get(id);
  
  // Ensure the DO has the latest overlay state from DB without broadcasting
  const { OverlayService } = await import("./services/overlay-service");
  const service = new OverlayService(c.env.DB);
  const overlay = await service.getOverlayById(overlayId);
  
  if (overlay) {
    const req = new Request(`http://do/init`, {
      method: "POST",
      body: JSON.stringify(overlay),
      headers: { "Content-Type": "application/json" }
    });
    await room.fetch(req);
  }
  
  return room.fetch(c.req.raw);
});

// Broadcast event to overlay
app.post("/api/overlay/:id/broadcast", async (c) => {
  const creatorId = c.req.param("id");

  // Basic authorization boundary for broadcast (should match AdminAccessMiddleware)
  const authHeader = c.req.header("Authorization") || c.req.header("X-Admin-Secret");
  const adminSecret = c.env.ADMIN_SECRET;
  
  if (!adminSecret) {
    return c.json({ error: "ADMIN_SECRET is not configured" }, 500);
  }

  if (authHeader !== adminSecret && authHeader !== `Bearer ${adminSecret}`) {
    return c.json({ error: "Unauthorized broadcast access" }, 401);
  }

  const id = c.env.OVERLAY_ROOM.idFromName(creatorId);
  const room = c.env.OVERLAY_ROOM.get(id);
  
  // Create a new request directed to the DO's /broadcast route
  const body = await c.req.json();
  const req = new Request(`http://do/broadcast`, {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" }
  });
  
  return room.fetch(req);
});

app.get("/", (c) => {
  return c.text("Overlay Streaming API");
});

// Config routes have been moved to adminRouter

export default app;
export { OverlayRoom };
