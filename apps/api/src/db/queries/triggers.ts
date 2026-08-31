import { D1Database } from "@cloudflare/workers-types";

export async function getTrigger(db: D1Database, creatorId: string, source: string, eventType: string) {
  const { results } = await db
    .prepare("SELECT * FROM alert_triggers WHERE creator_id = ? AND source = ? AND event_type = ?")
    .bind(creatorId, source, eventType)
    .all();
  return results.length > 0 ? results[0] : null;
}

export async function getTriggersByCreator(db: D1Database, creatorId: string) {
  const { results } = await db
    .prepare("SELECT * FROM alert_triggers WHERE creator_id = ? ORDER BY created_at DESC")
    .bind(creatorId)
    .all();
  return results;
}

export async function insertTrigger(
  db: D1Database,
  id: string,
  creatorId: string,
  source: string,
  eventType: string,
  alertId: string,
  enabled: boolean
) {
  return db
    .prepare(
      `INSERT INTO alert_triggers (id, creator_id, source, event_type, alert_id, enabled) 
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .bind(id, creatorId, source, eventType, alertId, enabled ? 1 : 0)
    .run();
}

export async function updateTrigger(
  db: D1Database,
  id: string,
  creatorId: string,
  alertId: string,
  enabled: boolean
) {
  return db
    .prepare(
      `UPDATE alert_triggers SET alert_id = ?, enabled = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND creator_id = ?`
    )
    .bind(alertId, enabled ? 1 : 0, id, creatorId)
    .run();
}

export async function deleteTrigger(db: D1Database, id: string, creatorId: string) {
  return db
    .prepare("DELETE FROM alert_triggers WHERE id = ? AND creator_id = ?")
    .bind(id, creatorId)
    .run();
}
