import type { AlertInstance } from "@overlay/schema";

export class AlertQueue {
  private queue: AlertInstance[] = [];
  private playing = false;
  private processCallback?: (event: AlertInstance) => Promise<void>;
  private subscribers: ((queue: AlertInstance[]) => void)[] = [];

  public subscribe(callback: (queue: AlertInstance[]) => void) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  private notify() {
    this.subscribers.forEach(cb => cb([...this.queue]));
  }

  public getQueue() {
    return [...this.queue];
  }

  /**
   * Set the handler that processes each alert in the queue.
   * This is typically the AlertEngine.
   */
  public setProcessor(callback: (event: AlertInstance) => Promise<void>) {
    this.processCallback = callback;
  }

  public async push(event: AlertInstance) {
    this.queue.push(event);
    this.notify();

    if (!this.playing) {
      await this.process();
    }
  }

  private async process() {
    if (this.playing) return;
    this.playing = true;

    try {
      while (this.queue.length > 0) {
        const event = this.queue.shift();
        this.notify();
        if (event && this.processCallback) {
          try {
            await this.processCallback(event);
          } catch (err) {
            console.error("[AlertQueue] Error processing alert:", err);
          }
        }
      }
    } finally {
      this.playing = false;
    }
  }
}

export const alertQueue = new AlertQueue();
