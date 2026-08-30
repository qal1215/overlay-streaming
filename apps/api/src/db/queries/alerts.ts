export async function getAlerts(db: D1Database, creatorId: string) {
  const { results } = await db
    .prepare("SELECT id, creator_id, name, created_at, updated_at FROM alerts WHERE creator_id = ? ORDER BY updated_at DESC")
    .bind(creatorId)
    .all();
  return results;
}

export async function insertAlert(
  db: D1Database,
  id: string,
  creatorId: string,
  name: string,
  preset: string
) {
  return db
    .prepare(`INSERT INTO alerts (id, creator_id, name, preset) VALUES (?, ?, ?, ?)`)
    .bind(id, creatorId, name, preset)
    .run();
}

export async function getAlert(db: D1Database, id: string, creatorId: string) {
  const { results } = await db
    .prepare("SELECT * FROM alerts WHERE id = ? AND creator_id = ?")
    .bind(id, creatorId)
    .all();
  return results.length > 0 ? results[0] : null;
}

export async function updateAlert(
  db: D1Database,
  id: string,
  creatorId: string,
  name: string,
  preset: string
) {
  return db
    .prepare(
      `UPDATE alerts SET name = ?, preset = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND creator_id = ?`
    )
    .bind(name, preset, id, creatorId)
    .run();
}

export async function deleteAlert(db: D1Database, id: string, creatorId: string) {
  return db
    .prepare("DELETE FROM alerts WHERE id = ? AND creator_id = ?")
    .bind(id, creatorId)
    .run();
}
