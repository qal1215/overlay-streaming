import { D1Database } from "@cloudflare/workers-types";
import { getTrigger } from "../db/queries/triggers";

export class TriggerMapper {
  constructor(private db: D1Database) {}

  /**
   * Resolves an alert mapping for a given event.
   * Returns the mapped alertId if a valid, enabled mapping exists.
   * Otherwise returns null.
   */
  async resolve(creatorId: string, source: string, eventType: string): Promise<string | null> {
    const trigger = await getTrigger(this.db, creatorId, source, eventType);
    
    if (!trigger || !trigger.enabled) {
      return null;
    }

    return trigger.alert_id as string;
  }
}
