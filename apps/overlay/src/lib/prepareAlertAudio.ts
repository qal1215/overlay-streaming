import type { AlertDefinition } from '@overlay/schema';
import { audioManager } from '@overlay/audio-engine';
import { API_URL } from './config';

export async function prepareAlertAudio(
  alerts: AlertDefinition[],
  assets?: Record<string, any>
) {
  const urlsToPreload = new Set<string>();

  const resolveAssetUrl = (assetId?: string) => {
    if (!assetId || !assets) return "";
    const asset = assets[assetId];
    return asset ? `${API_URL}${asset.url}` : "";
  };

  alerts.forEach(alertDef => {
    const mainSoundId = alertDef.preset.audio?.soundId;
    if (mainSoundId) {
      const url = resolveAssetUrl(mainSoundId);
      if (url) urlsToPreload.add(url);
    }
    
    if (alertDef.timeline && alertDef.timeline.events) {
      alertDef.timeline.events.forEach(event => {
        if (event.sound) {
           let url = event.sound;
           if (!url.startsWith('http') && !url.startsWith('synthetic:')) {
             const resolved = resolveAssetUrl(url);
             if (resolved) url = resolved;
           }
           if (url && url !== "") urlsToPreload.add(url);
        }
      });
    }
  });

  if (urlsToPreload.size === 0) return;

  const promises = Array.from(urlsToPreload).map(url => 
    audioManager.preload(url).catch(err => {
      console.warn(`[prepareAlertAudio] Failed to preload ${url}:`, err);
    })
  );

  await Promise.all(promises);
}
