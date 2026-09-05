import { Hono } from "hono";
import { Bindings } from "./admin";
import { AlertService } from "../services/alert-service";

const alertsRouter = new Hono<{ Bindings: Bindings }>();

alertsRouter.get("/", async (c) => {
  const service = new AlertService(c.env.DB);
  return c.json(await service.listAlerts(c.req.param("id")!));
});

alertsRouter.post("/", async (c) => {
  const service = new AlertService(c.env.DB);
  const body = await c.req.json().catch(() => ({}));
  try {
    const result = await service.createAlert(c.req.param("id")!, body);
    return c.json(result);
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

alertsRouter.get("/:alertId", async (c) => {
  const service = new AlertService(c.env.DB);
  const result = await service.getAlert(c.req.param("id")!, c.req.param("alertId"));
  if (!result) return c.json({ error: "Alert not found" }, 404);
  return c.json(result);
});

alertsRouter.patch("/:alertId", async (c) => {
  const service = new AlertService(c.env.DB);
  const body = await c.req.json().catch(() => ({}));
  try {
    const creatorId = c.req.param("id")!;
    const alertId = c.req.param("alertId");
    const result = await service.updateAlert(creatorId, alertId, body);
    
    // Invalidate DO cache for any overlay using this alert
    const { OverlayService } = await import("../services/overlay-service");
    const overlayService = new OverlayService(c.env.DB);
    const overlays = await overlayService.listOverlays(creatorId);
    
    for (const overlay of overlays) {
      const hasAlert = overlay.components.some((comp: any) => comp.type === "alert" && comp.alertId === alertId);
      if (hasAlert) {
        const updatedAlert = await service.getAlert(creatorId, alertId);
        if (updatedAlert) {
          const doId = c.env.OVERLAY_ROOM.idFromName(overlay.id);
          const room = c.env.OVERLAY_ROOM.get(doId);
          const req = new Request(`http://do/alert/update`, {
            method: "POST",
            body: JSON.stringify(updatedAlert),
            headers: { "Content-Type": "application/json" }
          });
          c.executionCtx.waitUntil(room.fetch(req));
        }
      }
    }

    return c.json({ success: true, message: "Alert updated and broadcasted" });
  } catch (e: any) {
    if (e.message === "Alert not found") return c.json({ error: e.message }, 404);
    if (e.message === "Invalid preset JSON") return c.json({ error: e.message }, 400);
    return c.json({ error: e.message }, 500);
  }
});

alertsRouter.delete("/:alertId", async (c) => {
  const service = new AlertService(c.env.DB);
  try {
    const result = await service.deleteAlert(c.req.param("id")!, c.req.param("alertId"));
    return c.json({ success: true, message: "Alert deleted" });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

export default alertsRouter;
