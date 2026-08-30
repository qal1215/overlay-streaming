import { Hono } from "hono";
import { cors } from "hono/cors";

import adminRouter from "./routes/admin";
import { OverlayRoom } from "./OverlayRoom";

type Bindings = {
  DB: D1Database;
  OVERLAY_ROOM: DurableObjectNamespace;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use("/*", cors());

app.route("/api/admin", adminRouter);

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
