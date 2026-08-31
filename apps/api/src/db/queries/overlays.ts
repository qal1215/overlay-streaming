import { D1Database } from "@cloudflare/workers-types";

export async function getOverlays(db: D1Database, creatorId: string) {
  const { results } = await db
    .prepare("SELECT * FROM overlays WHERE creator_id = ? ORDER BY updated_at DESC")
    .bind(creatorId)
    .all();
  return results;
}

export async function insertOverlay(
  db: D1Database,
  id: string,
  creatorId: string,
  name: string,
  description: string | null,
  width: number,
  height: number,
  enabled: boolean,
  definitionJson: string
) {
  return db
    .prepare(
      `INSERT INTO overlays (id, creator_id, name, description, width, height, enabled, definition_json) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(id, creatorId, name, description, width, height, enabled ? 1 : 0, definitionJson)
    .run();
}

export async function getOverlay(db: D1Database, id: string, creatorId: string) {
  const { results } = await db
    .prepare("SELECT * FROM overlays WHERE id = ? AND creator_id = ?")
    .bind(id, creatorId)
    .all();
  return results.length > 0 ? results[0] : null;
}

export async function getOverlayById(db: D1Database, id: string) {
  const { results } = await db
    .prepare("SELECT * FROM overlays WHERE id = ?")
    .bind(id)
    .all();
  return results.length > 0 ? results[0] : null;
}

export async function updateOverlay(
  db: D1Database,
  id: string,
  creatorId: string,
  name: string,
  description: string | null,
  width: number,
  height: number,
  enabled: boolean,
  definitionJson: string
) {
  return db
    .prepare(
      `UPDATE overlays SET name = ?, description = ?, width = ?, height = ?, enabled = ?, definition_json = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND creator_id = ?`
    )
    .bind(name, description, width, height, enabled ? 1 : 0, definitionJson, id, creatorId)
    .run();
}

export async function deleteOverlay(db: D1Database, id: string, creatorId: string) {
  return db
    .prepare("DELETE FROM overlays WHERE id = ? AND creator_id = ?")
    .bind(id, creatorId)
    .run();
}

export async function setOverlayEnabled(db: D1Database, id: string, creatorId: string, enabled: boolean) {
  return db
    .prepare("UPDATE overlays SET enabled = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND creator_id = ?")
    .bind(enabled ? 1 : 0, id, creatorId)
    .run();
}
