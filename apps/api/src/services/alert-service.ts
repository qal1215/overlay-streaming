import { D1Database } from "@cloudflare/workers-types";
import { AlertPresetSchema, AlertEvent, AlertEventSchema } from "@overlay/schema";
import * as alertQueries from "../db/queries/alerts";

export class AlertService {
  constructor(private db: D1Database, private overlayRoom?: any) {}

  async listAlerts(creatorId: string) {
    const alerts = await alertQueries.getAlerts(this.db, creatorId);
    return alerts.map(alert => ({
      ...alert,
      preset: typeof alert.preset === 'string' ? JSON.parse(alert.preset) : alert.preset
    }));
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
    const preset = JSON.parse(alert.preset as string);
    const duration = preset.animation?.duration || 5000;
    
    return {
      ...alert,
      preset,
      timeline: {
        duration,
        events: [
          { at: 0, type: "enter" },
          { at: 300, type: "impact" },
          { at: duration - 500, type: "exit" },
        ]
      }
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

  async dispatchAlert(creatorId: string, event: import("@overlay/schema").ResolvedAlertEvent) {
    if (!this.overlayRoom) {
      throw new Error("OverlayRoom namespace not provided to AlertService");
    }
    
    // We expect a ResolvedAlertEvent here now, but we can also parse it if needed
    // However, it's already generated internally by webhooks/admin routes so we can trust it.
    
    const message = {
      type: "alert:event",
      resolved: event,
    };
    
    // Get all overlays for this creator
    const { getOverlays } = await import("../db/queries/overlays");
    const overlays = await getOverlays(this.db, creatorId);

    if (overlays.length === 0) {
      console.log(`No active overlays found for creator ${creatorId} to dispatch event to.`);
      return { success: true };
    }

    const broadcastPromises = overlays.map(async (overlay) => {
      // The overlayRoom ID is based on overlay.id, matching the WS connection
      const doId = this.overlayRoom!.idFromName(overlay.id as string);
      const room = this.overlayRoom!.get(doId);

      const response = await room.fetch(new Request("http://do/broadcast", {
        method: "POST",
        body: JSON.stringify(message),
        headers: {
          "Content-Type": "application/json",
        },
      }));
      
      if (!response.ok) {
        console.error(`Failed to broadcast alert to overlay ${overlay.id}: ${response.statusText}`);
      }
    });

    await Promise.all(broadcastPromises);

    return { success: true };
  }
}
