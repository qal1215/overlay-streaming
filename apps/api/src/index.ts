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
    origin: ["http://localhost:5173", "http://localhost:5174"],
    credentials: true,
  })
);

app.route("/api/admin", adminRouter);

// Serve R2 Assets
app.get("/api/assets/*", async (c) => {
  const objectKey = c.req.path.replace('/api/assets/', '');
  if (!objectKey) return c.json({ error: "No key provided" }, 400);

  const object = await c.env.ASSETS_BUCKET.get(objectKey);
  
  if (object === null) {
    return c.json({ error: "Not found" }, 404);
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  
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

app.get("/", (c) => {
  return c.text("Overlay Streaming API");
});

// Config routes have been moved to adminRouter

export default app;
export { OverlayRoom };
