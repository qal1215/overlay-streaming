import { Hono } from "hono";
import { Bindings } from "./admin";

const audioRouter = new Hono<{ Bindings: Bindings }>();

const DEFAULT_SOUNDS = [
  { id: 'default_chime', creator_id: 'system', name: 'Success Chime', url: 'https://upload.wikimedia.org/wikipedia/commons/b/b5/Radio_chime.ogg', size: 0, created_at: new Date().toISOString() },
  { id: 'default_notification', creator_id: 'system', name: 'Notification Pop', url: 'https://upload.wikimedia.org/wikipedia/commons/d/d1/Pop_sound.ogg', size: 0, created_at: new Date().toISOString() },
  { id: 'synthetic_beep', creator_id: 'system', name: 'Synthetic Beep', url: 'synthetic:beep', size: 0, created_at: new Date().toISOString() },
  { id: 'synthetic_success', creator_id: 'system', name: 'Synthetic Success', url: 'synthetic:success', size: 0, created_at: new Date().toISOString() },
  { id: 'synthetic_error', creator_id: 'system', name: 'Synthetic Error', url: 'synthetic:error', size: 0, created_at: new Date().toISOString() }
];

// GET /api/admin/creator/:id/audio
audioRouter.get("/", async (c) => {
  const creatorId = c.req.param("id");
  const { results } = await c.env.DB.prepare(
    "SELECT id, creator_id, name, url, size, created_at FROM audio_assets WHERE creator_id = ? ORDER BY created_at DESC"
  )
    .bind(creatorId)
    .all();

  return c.json([...DEFAULT_SOUNDS, ...results]);
});

// POST /api/admin/creator/:id/audio
audioRouter.post("/", async (c) => {
  const creatorId = c.req.param("id");
  const body = await c.req.parseBody();
  const file = body['file'] as File;

  if (!file) {
    return c.json({ error: "No file uploaded" }, 400);
  }

  // 5MB limit
  if (file.size > 5 * 1024 * 1024) {
    return c.json({ error: "File exceeds 5MB limit" }, 400);
  }

  const id = crypto.randomUUID();
  const ext = file.name.split('.').pop() || 'mp3';
  const objectKey = `audio/${creatorId}/${id}.${ext}`;
  const name = file.name;
  
  const arrayBuffer = await file.arrayBuffer();

  // Upload to R2
  await c.env.ASSETS_BUCKET.put(objectKey, arrayBuffer, {
    httpMetadata: { contentType: file.type || 'audio/mpeg' }
  });

  // The local R2 URL will be served by a special assets route we will create in the API
  const url = `/api/assets/${objectKey}`;

  // Insert to D1
  const result = await c.env.DB.prepare(
    `INSERT INTO audio_assets (id, creator_id, name, url, size) VALUES (?, ?, ?, ?, ?)`
  )
    .bind(id, creatorId, name, url, file.size)
    .run();

  if (result.success) {
    return c.json({ id, creator_id: creatorId, name, url, size: file.size });
  }

  return c.json({ error: "Failed to save audio metadata" }, 500);
});

// DELETE /api/admin/creator/:id/audio/:audioId
audioRouter.delete("/:audioId", async (c) => {
  const creatorId = c.req.param("id");
  const audioId = c.req.param("audioId");

  const { results } = await c.env.DB.prepare(
    "SELECT url FROM audio_assets WHERE id = ? AND creator_id = ?"
  )
    .bind(audioId, creatorId)
    .all();

  if (results.length === 0) {
    return c.json({ error: "Audio not found" }, 404);
  }

  const url = results[0].url as string;
  // Extract object key from url (e.g., /api/assets/audio/default_creator/xxx.mp3)
  const objectKey = url.replace('/api/assets/', '');

  // Delete from R2
  if (objectKey) {
    await c.env.ASSETS_BUCKET.delete(objectKey);
  }

  // Delete from D1
  const result = await c.env.DB.prepare(
    "DELETE FROM audio_assets WHERE id = ? AND creator_id = ?"
  )
    .bind(audioId, creatorId)
    .run();

  if (result.success) {
    return c.json({ success: true });
  }

  return c.json({ error: "Failed to delete audio" }, 500);
});

export default audioRouter;
