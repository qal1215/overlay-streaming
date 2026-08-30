import { Hono } from "hono";
import { Bindings } from "./admin";
import { AlertService } from "../services/alert-service";

const alertsRouter = new Hono<{ Bindings: Bindings }>();

alertsRouter.get("/", async (c) => {
  const service = new AlertService(c.env.DB);
  return c.json(await service.listAlerts(c.req.param("id")));
});

alertsRouter.post("/", async (c) => {
  const service = new AlertService(c.env.DB);
  const body = await c.req.json().catch(() => ({}));
  try {
    const result = await service.createAlert(c.req.param("id"), body);
    return c.json(result);
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

alertsRouter.get("/:alertId", async (c) => {
  const service = new AlertService(c.env.DB);
  const result = await service.getAlert(c.req.param("id"), c.req.param("alertId"));
  if (!result) return c.json({ error: "Alert not found" }, 404);
  return c.json(result);
});

alertsRouter.patch("/:alertId", async (c) => {
  const service = new AlertService(c.env.DB);
  const body = await c.req.json().catch(() => ({}));
  try {
    const result = await service.updateAlert(c.req.param("id"), c.req.param("alertId"), body);
    return c.json({ success: true, message: "Alert updated" });
  } catch (e: any) {
    if (e.message === "Alert not found") return c.json({ error: e.message }, 404);
    if (e.message === "Invalid preset JSON") return c.json({ error: e.message }, 400);
    return c.json({ error: e.message }, 500);
  }
});

alertsRouter.delete("/:alertId", async (c) => {
  const service = new AlertService(c.env.DB);
  try {
    const result = await service.deleteAlert(c.req.param("id"), c.req.param("alertId"));
    return c.json({ success: true, message: "Alert deleted" });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

export default alertsRouter;
