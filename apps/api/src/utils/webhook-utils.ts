export function generateSepayWebhookId(): string {
  // Use crypto.randomUUID for cryptographically secure randomness
  return `wh_${crypto.randomUUID().replace(/-/g, '')}`;
}

export function getSepayWebhookUrl(baseUrl: string, webhookId: string): string {
  if (!baseUrl) {
    throw new Error("PUBLIC_API_URL is not configured");
  }
  return `${baseUrl}/api/webhooks/sepay/${webhookId}`;
}
