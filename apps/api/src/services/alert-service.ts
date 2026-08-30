import { D1Database } from "@cloudflare/workers-types";
import { AlertPresetSchema } from "@overlay/schema";
import * as alertQueries from "../db/queries/alerts";

export class AlertService {
  constructor(private db: D1Database) {}

  async listAlerts(creatorId: string) {
    return alertQueries.getAlerts(this.db, creatorId);
  }

  async createAlert(creatorId: string, body: any) {
    const id = crypto.randomUUID();
    const name = body.name || "New Alert";
    
    const defaultPreset = AlertPresetSchema.parse({ theme: "cyberpunk" });
    const presetStr = JSON.stringify(body.preset || defaultPreset);

    const result = await alertQueries.insertAlert(this.db, id, creatorId, name, presetStr);
    if (result.success) {
      return { id, creator_id: creatorId, name, preset: JSON.parse(presetStr) };
    }
    throw new Error("Failed to create alert");
  }

  async getAlert(creatorId: string, alertId: string) {
    const alert = await alertQueries.getAlert(this.db, alertId, creatorId);
    if (!alert) return null;
    return {
      ...alert,
      preset: JSON.parse(alert.preset as string),
    };
  }

  async updateAlert(creatorId: string, alertId: string, body: any) {
    const current = await alertQueries.getAlert(this.db, alertId, creatorId);
    if (!current) throw new Error("Alert not found");

    const name = body.name ?? current.name;
    let presetStr = current.preset as string;
    
    if (body.preset) {
      try {
        const currentPreset = JSON.parse(presetStr);
        const mergedPreset = { ...currentPreset, ...body.preset };
        presetStr = JSON.stringify(mergedPreset);
      } catch (e) {
        throw new Error("Invalid preset JSON");
      }
    }

    const result = await alertQueries.updateAlert(this.db, alertId, creatorId, name, presetStr);
    if (!result.success) throw new Error("Failed to update alert");
    return { success: true };
  }

  async deleteAlert(creatorId: string, alertId: string) {
    const result = await alertQueries.deleteAlert(this.db, alertId, creatorId);
    if (!result.success) throw new Error("Failed to delete alert");
    return { success: true };
  }
}
