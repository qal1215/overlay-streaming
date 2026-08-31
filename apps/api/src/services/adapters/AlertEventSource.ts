import { AlertEvent } from "@overlay/schema";

/**
 * Common interface for all external event adapters.
 * Each platform (Twitch, Kick, Stripe, Webhook, etc.) implements this
 * to normalize their raw payloads into a standardized AlertEvent.
 */
export interface AlertEventSource {
  /**
   * The source identifier for this adapter (e.g. "webhook", "twitch").
   */
  readonly source: string;

  /**
   * Validates and converts the raw input payload into an AlertEvent.
   * Throws an error if the payload is invalid or cannot be processed.
   * 
   * @param creatorId - The creator receiving the event
   * @param input - The raw payload from the external source
   */
  normalize(creatorId: string, input: unknown): AlertEvent;
}
