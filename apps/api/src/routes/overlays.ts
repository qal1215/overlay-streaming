import { Hono } from "hono";
import { Bindings } from "./admin";

const overlaysRouter = new Hono<{ Bindings: Bindings }>();

// GET /api/admin/creator/:id/overlays
overlaysRouter.get("/", async (c) => {
  const creatorId = c.req.param("id");
  const { results } = await c.env.DB.prepare(
    "SELECT id, creator_id, name, resolution_width, resolution_height, created_at, updated_at FROM overlays WHERE creator_id = ? ORDER BY updated_at DESC"
  )
    .bind(creatorId)
    .all();

  return c.json(results);
});

// POST /api/admin/creator/:id/overlays
overlaysRouter.post("/", async (c) => {
  const creatorId = c.req.param("id");
  const body = await c.req.json().catch(() => ({}));
  const id = crypto.randomUUID();
  const name = body.name || "New Overlay";
  const width = body.resolution_width || 1920;
  const height = body.resolution_height || 1080;
  const components = JSON.stringify([]);

  const result = await c.env.DB.prepare(
    `INSERT INTO overlays (id, creator_id, name, resolution_width, resolution_height, components) 
     VALUES (?, ?, ?, ?, ?, ?)`
  )
    .bind(id, creatorId, name, width, height, components)
    .run();

  if (result.success) {
    return c.json({ id, creator_id: creatorId, name, resolution_width: width, resolution_height: height, components: [] });
  }

  return c.json({ error: "Failed to create overlay" }, 500);
});

// GET /api/admin/creator/:id/overlays/:overlayId
overlaysRouter.get("/:overlayId", async (c) => {
  const creatorId = c.req.param("id");
  const overlayId = c.req.param("overlayId");

  const { results } = await c.env.DB.prepare(
    "SELECT * FROM overlays WHERE id = ? AND creator_id = ?"
  )
    .bind(overlayId, creatorId)
    .all();

  if (results.length === 0) {
    return c.json({ error: "Overlay not found" }, 404);
  }

  const overlay = results[0];
  const components = JSON.parse(overlay.components as string);
  
  // Extract all assetIds used in components
  const assetIds = new Set<string>();
  components.forEach((c: any) => {
    if (c.assetId) assetIds.add(c.assetId);
  });

  const assetsMap: Record<string, any> = {};
  if (assetIds.size > 0) {
    const placeholders = Array.from(assetIds).map(() => '?').join(',');
    const { results: assetResults } = await c.env.DB.prepare(
      `SELECT * FROM assets WHERE id IN (${placeholders})`
    )
      .bind(...Array.from(assetIds))
      .all();
      
    assetResults.forEach((a: any) => {
      assetsMap[a.id] = a;
    });
  }

  return c.json({
    ...overlay,
    components,
    assets: assetsMap
  });
});

// PATCH /api/admin/creator/:id/overlays/:overlayId
overlaysRouter.patch("/:overlayId", async (c) => {
  const creatorId = c.req.param("id");
  const overlayId = c.req.param("overlayId");
  const body = await c.req.json().catch(() => ({}));

  // Fetch current to update partially
  const { results } = await c.env.DB.prepare("SELECT * FROM overlays WHERE id = ? AND creator_id = ?").bind(overlayId, creatorId).all();
  if (results.length === 0) return c.json({ error: "Overlay not found" }, 404);

  const current = results[0];
  const name = body.name ?? current.name;
  const width = body.resolution_width ?? current.resolution_width;
  const height = body.resolution_height ?? current.resolution_height;
  const components = body.components ? JSON.stringify(body.components) : current.components;

  const result = await c.env.DB.prepare(
    `UPDATE overlays SET name = ?, resolution_width = ?, resolution_height = ?, components = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND creator_id = ?`
  )
    .bind(name, width, height, components, overlayId, creatorId)
    .run();

  if (result.success) {
    return c.json({ success: true, message: "Overlay updated" });
  }

  return c.json({ error: "Failed to update overlay" }, 500);
});

// DELETE /api/admin/creator/:id/overlays/:overlayId
overlaysRouter.delete("/:overlayId", async (c) => {
  const creatorId = c.req.param("id");
  const overlayId = c.req.param("overlayId");

  const result = await c.env.DB.prepare(
    "DELETE FROM overlays WHERE id = ? AND creator_id = ?"
  )
    .bind(overlayId, creatorId)
    .run();

  if (result.success) {
    return c.json({ success: true, message: "Overlay deleted" });
  }

  return c.json({ error: "Failed to delete overlay" }, 500);
});

// POST /api/admin/creator/:id/overlays/:overlayId/duplicate
overlaysRouter.post("/:overlayId/duplicate", async (c) => {
  const creatorId = c.req.param("id");
  const overlayId = c.req.param("overlayId");

  const { results } = await c.env.DB.prepare("SELECT * FROM overlays WHERE id = ? AND creator_id = ?").bind(overlayId, creatorId).all();
  if (results.length === 0) return c.json({ error: "Overlay not found" }, 404);

  const original = results[0];
  const newId = crypto.randomUUID();
  const newName = `${original.name} (Copy)`;

  const result = await c.env.DB.prepare(
    `INSERT INTO overlays (id, creator_id, name, resolution_width, resolution_height, components) 
     VALUES (?, ?, ?, ?, ?, ?)`
  )
    .bind(newId, creatorId, newName, original.resolution_width, original.resolution_height, original.components)
    .run();

  if (result.success) {
    return c.json({ success: true, id: newId, message: "Overlay duplicated" });
  }

  return c.json({ error: "Failed to duplicate overlay" }, 500);
});

export default overlaysRouter;
