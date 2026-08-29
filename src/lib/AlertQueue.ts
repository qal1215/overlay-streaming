import type { AlertDefinition } from "#/components/core/types";

export class AlertQueue {
  private queue: AlertDefinition[] = [];
  private playing = false;
  private processCallback?: (event: AlertDefinition) => Promise<void>;

  /**
   * Set the handler that processes each alert in the queue.
   * This is typically the AlertEngine.
   */
  public setProcessor(callback: (event: AlertDefinition) => Promise<void>) {
    this.processCallback = callback;
  }

  public async push(event: AlertDefinition) {
    this.queue.push(event);

    if (!this.playing) {
      await this.process();
    }
  }

  private async process() {
    this.playing = true;

    while (this.queue.length > 0) {
      const event = this.queue.shift();
      if (event && this.processCallback) {
        await this.processCallback(event);
      }
    }

    this.playing = false;
  }
}

export const alertQueue = new AlertQueue();
