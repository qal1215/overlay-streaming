import { D1Database, R2Bucket } from "@cloudflare/workers-types";
import * as assetQueries from "../db/queries/assets";

const MAX_SIZES = {
  image: 10 * 1024 * 1024,
  gif: 20 * 1024 * 1024,
  video: 50 * 1024 * 1024,
  font: 5 * 1024 * 1024,
};

const ALLOWED_MIMES = {
  image: ['image/png', 'image/jpeg', 'image/webp'],
  gif: ['image/gif'],
  video: ['video/mp4', 'video/webm'],
  font: ['font/woff', 'font/woff2', 'font/ttf'],
};

function getAssetTypeFromMime(mime: string): "image" | "gif" | "video" | "font" | null {
  if (ALLOWED_MIMES.image.includes(mime)) return "image";
  if (ALLOWED_MIMES.gif.includes(mime)) return "gif";
  if (ALLOWED_MIMES.video.includes(mime)) return "video";
  if (ALLOWED_MIMES.font.includes(mime)) return "font";
  return null;
}

export class AssetService {
  constructor(private db: D1Database, private r2: R2Bucket) {}

  async listAssets(creatorId: string, typeFilter?: string) {
    return assetQueries.getAssetsList(this.db, creatorId, typeFilter);
  }

  async uploadAsset(creatorId: string, file: File, metadata: any) {
    const mimeType = file.type;
    const assetType = getAssetTypeFromMime(mimeType);

    if (!assetType) {
      throw new Error(`Unsupported file type: ${mimeType}`);
    }

    const maxSize = MAX_SIZES[assetType];
    if (file.size > maxSize) {
      throw new Error(`File exceeds maximum size for ${assetType} (${maxSize / 1024 / 1024}MB)`);
    }

    const id = `asset_${crypto.randomUUID()}`;
    const ext = file.name.split('.').pop() || '';
    const storageKey = `assets/${creatorId}/${assetType}s/${id}.${ext}`;
    const url = `/api/assets/${id}`;
    
    const arrayBuffer = await file.arrayBuffer();

    await this.r2.put(storageKey, arrayBuffer, {
      httpMetadata: { contentType: mimeType }
    });

    const result = await assetQueries.insertAsset(
      this.db, id, creatorId, file.name, assetType, mimeType, storageKey, url, file.size, metadata.width, metadata.height, metadata.duration
    );

    if (result.success) {
      return { id, creator_id: creatorId, name: file.name, type: assetType, url };
    }
    throw new Error("Failed to save asset metadata");
  }

  async deleteAsset(creatorId: string, assetId: string) {
    const storageKey = await assetQueries.getAssetStorageKey(this.db, assetId, creatorId);
    if (storageKey === undefined) {
      throw new Error("Asset not found");
    }

    if (storageKey) {
      await this.r2.delete(storageKey);
    }

    const result = await assetQueries.deleteAsset(this.db, assetId, creatorId);
    if (!result.success) throw new Error("Failed to delete asset");
    return { success: true };
  }
}
