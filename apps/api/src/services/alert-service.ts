import { D1Database } from "@cloudflare/workers-types";
import { AlertPresetSchema, AlertEvent, AlertEventSchema } from "@overlay/schema";
import * as alertQueries from "../db/queries/alerts";

export class AlertService {
  constructor(private db: D1Database, private overlayRoom?: any) {}

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

    // Re-hydrate overlays that use this alert
    if (this.overlayRoom) {
      const { getOverlaysByAlertId } = await import("../db/queries/overlays");
      const affectedOverlayIds = await getOverlaysByAlertId(this.db, creatorId, alertId);
      
      if (affectedOverlayIds.length > 0) {
        const { OverlayService } = await import("./overlay-service");
        const overlayService = new OverlayService(this.db);
        
        // Ensure DO routes correctly if the DO ID is per creator or per overlay
        // Note: Currently, index.ts routes `/api/overlay/:overlayId/ws` -> DO idFromName(overlayId).
        // It routes `/api/overlay/:id/broadcast` -> DO idFromName(creatorId). Wait.
        // Wait, in index.ts:
        // `app.get("/api/overlay/:overlayId/ws", ... id = c.env.OVERLAY_ROOM.idFromName(overlayId);`
        // So the DO is per-overlay.
        for (const affectedId of affectedOverlayIds) {
          const doId = this.overlayRoom.idFromName(affectedId);
          const room = this.overlayRoom.get(doId);
          
          const state = await overlayService.getOverlayById(affectedId);
          if (state) {
            await room.fetch(new Request("http://do/update", {
              method: "POST",
              body: JSON.stringify(state),
              headers: { "Content-Type": "application/json" }
            }));
          }
        }
      }
    }

    return { success: true };
  }

  async deleteAlert(creatorId: string, alertId: string) {
    const result = await alertQueries.deleteAlert(this.db, alertId, creatorId);
    if (!result.success) throw new Error("Failed to delete alert");
    return { success: true };
  }

  async dispatchAlert(creatorId: string, event: AlertEvent) {
    if (!this.overlayRoom) {
      throw new Error("OverlayRoom namespace not provided to AlertService");
    }

    // Validate the event against the schema
    const parsedEvent = AlertEventSchema.parse(event);

    // Get the Durable Object for this creator
    // (Assuming creatorId is used to route to their specific DO room as established)
    const id = this.overlayRoom.idFromName(creatorId);
    const room = this.overlayRoom.get(id);

    const message = {
      type: "alert:event",
      event: parsedEvent,
    };

    const response = await room.fetch(new Request("http://do/broadcast", {
      method: "POST",
      body: JSON.stringify(message),
      headers: {
        "Content-Type": "application/json",
      },
    }));

    if (!response.ok) {
      throw new Error(`Failed to broadcast alert: ${response.statusText}`);
    }

    return { success: true };
  }
}
