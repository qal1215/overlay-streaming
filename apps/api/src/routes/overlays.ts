import { Hono } from "hono";
import { Bindings } from "./admin";
import { OverlayService } from "../services/overlay-service";

const overlaysRouter = new Hono<{ Bindings: Bindings }>();

overlaysRouter.get("/", async (c) => {
  const service = new OverlayService(c.env.DB);
  return c.json(await service.listOverlays(c.req.param("id") as string));
});

overlaysRouter.post("/", async (c) => {
  const service = new OverlayService(c.env.DB);
  const body = await c.req.json().catch(() => ({}));
  try {
    const result = await service.createOverlay(c.req.param("id") as string, body);
    return c.json(result);
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

overlaysRouter.get("/:overlayId", async (c) => {
  const service = new OverlayService(c.env.DB);
  const result = await service.getOverlay(c.req.param("id") as string, c.req.param("overlayId") as string);
  if (!result) return c.json({ error: "Overlay not found" }, 404);
  return c.json(result);
});

overlaysRouter.patch("/:overlayId", async (c) => {
  const service = new OverlayService(c.env.DB);
  const body = await c.req.json().catch(() => ({}));
  const overlayId = c.req.param("overlayId");
  const creatorId = c.req.param("id");
  try {
    await service.updateOverlay(creatorId, overlayId, body);
    
    // Fetch the updated overlay
    const updatedOverlay = await service.getOverlay(creatorId, overlayId);
    if (!updatedOverlay) throw new Error("Overlay not found after update");
    
    // Push the updated overlay to the Durable Object
    const doId = c.env.OVERLAY_ROOM.idFromName(overlayId);
    const room = c.env.OVERLAY_ROOM.get(doId);
    
    const req = new Request(`http://do/update`, {
      method: "POST",
      body: JSON.stringify(updatedOverlay),
      headers: { "Content-Type": "application/json" }
    });
    // Fire and forget (don't block the API response)
    c.executionCtx.waitUntil(room.fetch(req));

    return c.json(updatedOverlay);
  } catch (e: any) {
    if (e.message === "Overlay not found") return c.json({ error: e.message }, 404);
    return c.json({ error: e.message }, 500);
  }
});

overlaysRouter.delete("/:overlayId", async (c) => {
  const service = new OverlayService(c.env.DB);
  try {
    const result = await service.deleteOverlay(c.req.param("id") as string, c.req.param("overlayId") as string);
    return c.json(result);
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

overlaysRouter.post("/:overlayId/duplicate", async (c) => {
  const service = new OverlayService(c.env.DB);
  try {
    const result = await service.duplicateOverlay(c.req.param("id") as string, c.req.param("overlayId") as string);
    return c.json({ success: true, id: result.id, message: "Overlay duplicated" });
  } catch (e: any) {
    if (e.message === "Overlay not found") return c.json({ error: e.message }, 404);
    return c.json({ error: e.message }, 500);
  }
});

overlaysRouter.post("/:overlayId/activate", async (c) => {
  const service = new OverlayService(c.env.DB);
  try {
    const result = await service.activateOverlay(c.req.param("id") as string, c.req.param("overlayId") as string);
    return c.json({ success: true, message: "Overlay activated" });
  } catch (e: any) {
    if (e.message === "Overlay not found") return c.json({ error: e.message }, 404);
    return c.json({ error: e.message }, 500);
  }
});

overlaysRouter.post("/:overlayId/deactivate", async (c) => {
  const service = new OverlayService(c.env.DB);
  try {
    const result = await service.deactivateOverlay(c.req.param("id") as string, c.req.param("overlayId") as string);
    return c.json({ success: true, message: "Overlay deactivated" });
  } catch (e: any) {
    if (e.message === "Overlay not found") return c.json({ error: e.message }, 404);
    return c.json({ error: e.message }, 500);
  }
});

export default overlaysRouter;
