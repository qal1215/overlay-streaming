import { Hono } from "hono";
import { Bindings } from "./admin";

const assetsRouter = new Hono<{ Bindings: Bindings }>();

// 10 MB Image, 20 MB GIF, 50 MB Video, 5 MB Font
const MAX_SIZES = {
  image: 10 * 1024 * 1024,
  gif: 20 * 1024 * 1024,
  video: 50 * 1024 * 1024,
  font: 5 * 1024 * 1024,
};

const ALLOWED_MIMES = {
  image: ['image/png', 'image/jpeg', 'image/webp'],
  gif: ['image/gif'],
  video: ['video/mp4', 'video/webm'],
  font: ['font/woff', 'font/woff2', 'font/ttf'],
};

// Helper to determine asset type from MIME
function getAssetTypeFromMime(mime: string): "image" | "gif" | "video" | "font" | null {
  if (ALLOWED_MIMES.image.includes(mime)) return "image";
  if (ALLOWED_MIMES.gif.includes(mime)) return "gif";
  if (ALLOWED_MIMES.video.includes(mime)) return "video";
  if (ALLOWED_MIMES.font.includes(mime)) return "font";
  return null;
}

// GET /api/admin/creator/:id/assets
assetsRouter.get("/", async (c) => {
  const creatorId = c.req.param("id");
  const typeFilter = c.req.query("type"); // optional

  let query = "SELECT * FROM assets WHERE creator_id = ? ORDER BY created_at DESC";
  let params: any[] = [creatorId];

  if (typeFilter) {
    query = "SELECT * FROM assets WHERE creator_id = ? AND type = ? ORDER BY created_at DESC";
    params.push(typeFilter);
  }

  const { results } = await c.env.DB.prepare(query).bind(...params).all();
  return c.json(results);
});

// POST /api/admin/creator/:id/assets
assetsRouter.post("/", async (c) => {
  const creatorId = c.req.param("id");
  const body = await c.req.parseBody();
  const file = body['file'] as File;

  // Optional metadata from frontend
  const width = body['width'] ? parseInt(body['width'] as string, 10) : null;
  const height = body['height'] ? parseInt(body['height'] as string, 10) : null;
  const duration = body['duration'] ? parseFloat(body['duration'] as string) : null;

  if (!file) {
    return c.json({ error: "No file uploaded" }, 400);
  }

  const mimeType = file.type;
  const assetType = getAssetTypeFromMime(mimeType);

  if (!assetType) {
    return c.json({ error: `Unsupported file type: ${mimeType}` }, 400);
  }

  const maxSize = MAX_SIZES[assetType];
  if (file.size > maxSize) {
    return c.json({ error: `File exceeds maximum size for ${assetType} (${maxSize / 1024 / 1024}MB)` }, 400);
  }

  const id = `asset_${crypto.randomUUID()}`;
  const ext = file.name.split('.').pop() || '';
  
  // Storage convention: assets/{creatorId}/{type}s/{filename}
  const storageKey = `assets/${creatorId}/${assetType}s/${id}.${ext}`;
  const url = `/api/assets/${id}`; // Resolvable via existing asset route
  
  const arrayBuffer = await file.arrayBuffer();

  // 1. Upload to R2
  await c.env.ASSETS_BUCKET.put(storageKey, arrayBuffer, {
    httpMetadata: { contentType: mimeType }
  });

  // 2. Insert to D1
  const result = await c.env.DB.prepare(
    `INSERT INTO assets (id, creator_id, name, type, mime_type, storage_key, url, size, width, height, duration) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(id, creatorId, file.name, assetType, mimeType, storageKey, url, file.size, width, height, duration)
    .run();

  if (result.success) {
    return c.json({
      id,
      creator_id: creatorId,
      name: file.name,
      type: assetType,
      url
    });
  }

  return c.json({ error: "Failed to save asset metadata" }, 500);
});

// DELETE /api/admin/creator/:id/assets/:assetId
assetsRouter.delete("/:assetId", async (c) => {
  const creatorId = c.req.param("id");
  const assetId = c.req.param("assetId");

  const { results } = await c.env.DB.prepare(
    "SELECT storage_key FROM assets WHERE id = ? AND creator_id = ?"
  )
    .bind(assetId, creatorId)
    .all();

  if (results.length === 0) {
    return c.json({ error: "Asset not found" }, 404);
  }

  const storageKey = results[0].storage_key as string;

  // Delete from R2
  if (storageKey) {
    await c.env.ASSETS_BUCKET.delete(storageKey);
  }

  // Delete from D1
  const result = await c.env.DB.prepare(
    "DELETE FROM assets WHERE id = ? AND creator_id = ?"
  )
    .bind(assetId, creatorId)
    .run();

  if (result.success) {
    return c.json({ success: true });
  }

  return c.json({ error: "Failed to delete asset" }, 500);
});

export default assetsRouter;
