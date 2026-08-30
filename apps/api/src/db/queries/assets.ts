export async function getAssetsList(db: D1Database, creatorId: string, typeFilter?: string) {
  if (typeFilter) {
    const { results } = await db
      .prepare("SELECT * FROM assets WHERE creator_id = ? AND type = ? ORDER BY created_at DESC")
      .bind(creatorId, typeFilter)
      .all();
    return results;
  }
  const { results } = await db
    .prepare("SELECT * FROM assets WHERE creator_id = ? ORDER BY created_at DESC")
    .bind(creatorId)
    .all();
  return results;
}

export async function insertAsset(
  db: D1Database,
  id: string,
  creatorId: string,
  name: string,
  type: string,
  mimeType: string,
  storageKey: string,
  url: string,
  size: number,
  width: number | null,
  height: number | null,
  duration: number | null
) {
  return db
    .prepare(
      `INSERT INTO assets (id, creator_id, name, type, mime_type, storage_key, url, size, width, height, duration) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(id, creatorId, name, type, mimeType, storageKey, url, size, width, height, duration)
    .run();
}

export async function getAssetStorageKey(db: D1Database, id: string, creatorId: string) {
  const { results } = await db
    .prepare("SELECT storage_key FROM assets WHERE id = ? AND creator_id = ?")
    .bind(id, creatorId)
    .all();
  return results.length > 0 ? (results[0].storage_key as string) : null;
}

export async function deleteAsset(db: D1Database, id: string, creatorId: string) {
  return db
    .prepare("DELETE FROM assets WHERE id = ? AND creator_id = ?")
    .bind(id, creatorId)
    .run();
}

export async function getAssetsByIds(db: D1Database, assetIds: string[]) {
  if (assetIds.length === 0) return [];
  const placeholders = assetIds.map(() => '?').join(',');
  const { results } = await db
    .prepare(`SELECT * FROM assets WHERE id IN (${placeholders})`)
    .bind(...assetIds)
    .all();
  return results;
}
