export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787';

export const resolveAssetUrl = (assetUrl?: string) => {
  if (!assetUrl) return "";
  if (assetUrl.startsWith("http")) return assetUrl;
  return `${API_URL}${assetUrl}`;
};
