import { Hono } from "hono";
import { cors } from "hono/cors";

import adminRouter from "./routes/admin";
import { OverlayRoom } from "./OverlayRoom";

type Bindings = {
  DB: D1Database;
  OVERLAY_ROOM: DurableObjectNamespace;
  ASSETS_BUCKET: R2Bucket;
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
app.get("/api/overlay/:id/ws", async (c) => {
  const creatorId = c.req.param("id");
  const id = c.env.OVERLAY_ROOM.idFromName(creatorId);
  const room = c.env.OVERLAY_ROOM.get(id);
  
  return room.fetch(c.req.raw);
});

// Broadcast event to overlay
app.post("/api/overlay/:id/broadcast", async (c) => {
  const creatorId = c.req.param("id");
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
