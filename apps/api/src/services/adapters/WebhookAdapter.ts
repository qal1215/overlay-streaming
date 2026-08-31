import { AlertEvent, AlertEventSchema } from "@overlay/schema";
import { AlertEventSource } from "./AlertEventSource";

export class WebhookAdapter implements AlertEventSource {
  readonly source = "webhook";

  normalize(creatorId: string, input: any): AlertEvent {
    if (!input || typeof input !== "object") {
      throw new Error("Invalid payload: must be a JSON object");
    }

    // In a real generic webhook, they should provide an event ID.
    // If they don't, we can try to hash the payload or generate one, 
    // but the idempotency check won't work well without a stable ID.
    // We enforce an eventId from the sender.
    if (!input.eventId) {
      throw new Error("Missing eventId in webhook payload");
    }
    
    if (!input.type) {
      throw new Error("Missing type in webhook payload");
    }

    const event: AlertEvent = {
      eventId: String(input.eventId),
      creatorId,
      source: this.source,
      type: input.type as any,
      timestamp: input.timestamp || Date.now(),
      actor: input.actor ? { name: String(input.actor.name || "Anonymous") } : undefined,
      donation: input.donation ? {
        amount: String(input.donation.amount),
        currency: input.donation.currency ? String(input.donation.currency) : undefined,
      } : undefined,
      metadata: input.metadata,
      message: input.message ? String(input.message) : undefined,
    };

    // Validate against our schema to ensure the payload is correct
    return AlertEventSchema.parse(event);
  }
}
