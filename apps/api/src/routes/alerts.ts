import { Hono } from "hono";
import { Bindings } from "./admin";
import { AlertPresetSchema } from "@overlay/schema";

const alertsRouter = new Hono<{ Bindings: Bindings }>();

// GET /api/admin/creator/:id/alerts
alertsRouter.get("/", async (c) => {
  const creatorId = c.req.param("id");
  const { results } = await c.env.DB.prepare(
    "SELECT id, creator_id, name, created_at, updated_at FROM alerts WHERE creator_id = ? ORDER BY updated_at DESC"
  )
    .bind(creatorId)
    .all();

  return c.json(results);
});

// POST /api/admin/creator/:id/alerts
alertsRouter.post("/", async (c) => {
  const creatorId = c.req.param("id");
  const body = await c.req.json().catch(() => ({}));
  const id = crypto.randomUUID();
  const name = body.name || "New Alert";
  
  // Provide default preset structure based on the schema
  const defaultPreset = AlertPresetSchema.parse({ theme: "cyberpunk" });
  const presetStr = JSON.stringify(body.preset || defaultPreset);

  const result = await c.env.DB.prepare(
    `INSERT INTO alerts (id, creator_id, name, preset) VALUES (?, ?, ?, ?)`
  )
    .bind(id, creatorId, name, presetStr)
    .run();

  if (result.success) {
    return c.json({ id, creator_id: creatorId, name, preset: JSON.parse(presetStr) });
  }

  return c.json({ error: "Failed to create alert" }, 500);
});

// GET /api/admin/creator/:id/alerts/:alertId
alertsRouter.get("/:alertId", async (c) => {
  const creatorId = c.req.param("id");
  const alertId = c.req.param("alertId");

  const { results } = await c.env.DB.prepare(
    "SELECT * FROM alerts WHERE id = ? AND creator_id = ?"
  )
    .bind(alertId, creatorId)
    .all();

  if (results.length === 0) {
    return c.json({ error: "Alert not found" }, 404);
  }

  const alert = results[0];
  return c.json({
    ...alert,
    preset: JSON.parse(alert.preset as string),
  });
});

// PATCH /api/admin/creator/:id/alerts/:alertId
alertsRouter.patch("/:alertId", async (c) => {
  const creatorId = c.req.param("id");
  const alertId = c.req.param("alertId");
  const body = await c.req.json().catch(() => ({}));

  const { results } = await c.env.DB.prepare("SELECT * FROM alerts WHERE id = ? AND creator_id = ?").bind(alertId, creatorId).all();
  if (results.length === 0) return c.json({ error: "Alert not found" }, 404);

  const current = results[0];
  const name = body.name ?? current.name;
  
  let presetStr = current.preset as string;
  if (body.preset) {
    try {
      // Partially merge preset
      const currentPreset = JSON.parse(presetStr);
      const mergedPreset = { ...currentPreset, ...body.preset };
      // Deep merge for nested objects if needed, but for now simple spread is fine if we send full objects for nested properties
      presetStr = JSON.stringify(mergedPreset);
    } catch (e) {
      return c.json({ error: "Invalid preset JSON" }, 400);
    }
  }

  const result = await c.env.DB.prepare(
    `UPDATE alerts SET name = ?, preset = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND creator_id = ?`
  )
    .bind(name, presetStr, alertId, creatorId)
    .run();

  if (result.success) {
    return c.json({ success: true, message: "Alert updated" });
  }

  return c.json({ error: "Failed to update alert" }, 500);
});

// DELETE /api/admin/creator/:id/alerts/:alertId
alertsRouter.delete("/:alertId", async (c) => {
  const creatorId = c.req.param("id");
  const alertId = c.req.param("alertId");

  const result = await c.env.DB.prepare(
    "DELETE FROM alerts WHERE id = ? AND creator_id = ?"
  )
    .bind(alertId, creatorId)
    .run();

  if (result.success) {
    return c.json({ success: true, message: "Alert deleted" });
  }

  return c.json({ error: "Failed to delete alert" }, 500);
});

export default alertsRouter;
