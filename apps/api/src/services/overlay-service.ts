import { D1Database } from "@cloudflare/workers-types";
import * as overlayQueries from "../db/queries/overlays";
import * as assetQueries from "../db/queries/assets";
import * as alertQueries from "../db/queries/alerts";
import type { OverlayDefinition, OverlayRuntimeState } from "@overlay/schema";

export class OverlayService {
  constructor(private db: D1Database) {}

  private mapRowToOverlayDefinition(row: any): OverlayDefinition {
    const definitionJson = JSON.parse(row.definition_json as string);
    return {
      id: row.id,
      creatorId: row.creator_id,
      name: row.name,
      description: row.description,
      width: row.width,
      height: row.height,
      enabled: Boolean(row.enabled),
      components: definitionJson.components || [],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async listOverlays(creatorId: string): Promise<OverlayDefinition[]> {
    const rows = await overlayQueries.getOverlays(this.db, creatorId);
    return rows.map((row) => this.mapRowToOverlayDefinition(row));
  }

  async createOverlay(creatorId: string, body: any): Promise<OverlayDefinition> {
    const id = crypto.randomUUID();
    const name = body.name || "New Overlay";
    const description = body.description || null;
    const width = body.width || 1920;
    const height = body.height || 1080;
    const enabled = body.enabled ?? false;
    const definitionJson = JSON.stringify({ components: [] });

    const result = await overlayQueries.insertOverlay(this.db, id, creatorId, name, description, width, height, enabled, definitionJson);
    if (result.success) {
      return this.mapRowToOverlayDefinition({
        id,
        creator_id: creatorId,
        name,
        description,
        width,
        height,
        enabled,
        definition_json: definitionJson,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }
    throw new Error("Failed to create overlay");
  }

  async getOverlay(creatorId: string, overlayId: string) {
    const row = await overlayQueries.getOverlay(this.db, overlayId, creatorId);
    if (!row) return null;

    const overlay = this.mapRowToOverlayDefinition(row);

    const assetIds = new Set<string>();
    overlay.components.forEach((c: any) => {
      if (c.assetId) assetIds.add(c.assetId);
    });

    const alertsMap: Record<string, any> = {};
    const alertIds = new Set<string>();
    overlay.components.forEach((c: any) => {
      if (c.type === "alert" && c.alertId) alertIds.add(c.alertId);
    });

    if (alertIds.size > 0) {
      const alertResults = await alertQueries.getAlertsByIds(this.db, Array.from(alertIds));
      alertResults.forEach((a: any) => {
        const preset = JSON.parse(a.preset as string);
        const duration = preset.animation?.duration || 5000;
        const timeline = {
          duration,
          events: [
            { at: 0, type: "enter" },
            { at: 300, type: "impact" },
            { at: duration - 500, type: "exit" },
          ]
        };
        alertsMap[a.id] = { ...a, preset, timeline };
        // Extract assets from alert preset
        if (preset.audio?.soundId) assetIds.add(preset.audio.soundId);
        // If there are image URLs in the preset we would add them here too
      });
    }

    const assetsMap: Record<string, any> = {};
    if (assetIds.size > 0) {
      const assetResults = await assetQueries.getAssetsByIds(this.db, Array.from(assetIds));
      assetResults.forEach((a: any) => {
        assetsMap[a.id] = a;
      });
    }

    return { 
      overlay: { ...overlay, assets: assetsMap },
      alerts: alertsMap
    } as OverlayRuntimeState;
  }

  async getOverlayById(overlayId: string) {
    const row = await overlayQueries.getOverlayById(this.db, overlayId);
    if (!row) return null;

    const overlay = this.mapRowToOverlayDefinition(row);

    const assetIds = new Set<string>();
    overlay.components.forEach((c: any) => {
      if (c.assetId) assetIds.add(c.assetId);
    });

    const alertsMap: Record<string, any> = {};
    const alertIds = new Set<string>();
    overlay.components.forEach((c: any) => {
      if (c.type === "alert" && c.alertId) alertIds.add(c.alertId);
    });

    if (alertIds.size > 0) {
      const alertResults = await alertQueries.getAlertsByIds(this.db, Array.from(alertIds));
      alertResults.forEach((a: any) => {
        const preset = JSON.parse(a.preset as string);
        const duration = preset.animation?.duration || 5000;
        const timeline = {
          duration,
          events: [
            { at: 0, type: "enter" },
            { at: 300, type: "impact" },
            { at: duration - 500, type: "exit" },
          ]
        };
        alertsMap[a.id] = { ...a, preset, timeline };
        if (preset.audio?.soundId) assetIds.add(preset.audio.soundId);
      });
    }

    const assetsMap: Record<string, any> = {};
    if (assetIds.size > 0) {
      const assetResults = await assetQueries.getAssetsByIds(this.db, Array.from(assetIds));
      assetResults.forEach((a: any) => {
        assetsMap[a.id] = a;
      });
    }

    return { 
      overlay: { ...overlay, assets: assetsMap },
      alerts: alertsMap
    } as OverlayRuntimeState;
  }

  async updateOverlay(creatorId: string, overlayId: string, body: any) {
    const current = await overlayQueries.getOverlay(this.db, overlayId, creatorId);
    if (!current) throw new Error("Overlay not found");

    const name = body.name ?? current.name;
    const description = body.description !== undefined ? body.description : current.description;
    const width = body.width ?? current.width;
    const height = body.height ?? current.height;
    const enabled = body.enabled ?? Boolean(current.enabled);
    
    const currentDefinition = JSON.parse(current.definition_json as string);
    const components = body.components ? body.components : currentDefinition.components;
    const definitionJson = JSON.stringify({ ...currentDefinition, components });

    const result = await overlayQueries.updateOverlay(this.db, overlayId, creatorId, name, description, width, height, enabled, definitionJson);
    if (!result.success) throw new Error("Failed to update overlay");
    return { success: true };
  }

  async deleteOverlay(creatorId: string, overlayId: string) {
    const result = await overlayQueries.deleteOverlay(this.db, overlayId, creatorId);
    if (!result.success) throw new Error("Failed to delete overlay");
    return { success: true };
  }

  async duplicateOverlay(creatorId: string, overlayId: string) {
    const original = await overlayQueries.getOverlay(this.db, overlayId, creatorId);
    if (!original) throw new Error("Overlay not found");

    const newId = crypto.randomUUID();
    const newName = `${original.name} (Copy)`;

    const result = await overlayQueries.insertOverlay(
      this.db, 
      newId, 
      creatorId, 
      newName, 
      original.description as string | null, 
      original.width as number, 
      original.height as number, 
      false, // duplicates are disabled by default
      original.definition_json as string
    );
    if (!result.success) throw new Error("Failed to duplicate overlay");
    return { id: newId };
  }
  
  async activateOverlay(creatorId: string, overlayId: string) {
    const current = await overlayQueries.getOverlay(this.db, overlayId, creatorId);
    if (!current) throw new Error("Overlay not found");
    
    const result = await overlayQueries.setOverlayEnabled(this.db, overlayId, creatorId, true);
    if (!result.success) throw new Error("Failed to activate overlay");
    return { success: true };
  }

  async deactivateOverlay(creatorId: string, overlayId: string) {
    const current = await overlayQueries.getOverlay(this.db, overlayId, creatorId);
    if (!current) throw new Error("Overlay not found");
    
    const result = await overlayQueries.setOverlayEnabled(this.db, overlayId, creatorId, false);
    if (!result.success) throw new Error("Failed to deactivate overlay");
    return { success: true };
  }
}
