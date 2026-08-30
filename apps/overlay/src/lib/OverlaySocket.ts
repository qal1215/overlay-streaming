export class OverlaySocket {
  private url: string;
  private ws: WebSocket | null = null;
  private reconnectDelay = 1000;
  private onMessageCallback?: (data: any) => void;

  constructor(url: string) {
    this.url = url;
  }

  public onMessage(callback: (data: any) => void) {
    this.onMessageCallback = callback;
  }

  public connect() {
    console.log(`[OverlaySocket] Connecting to ${this.url}...`);
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      console.log(`[OverlaySocket] Connected!`);
      this.reconnectDelay = 1000; // Reset delay on successful connection
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (this.onMessageCallback) {
          this.onMessageCallback(data);
        }
      } catch (e) {
        console.error(`[OverlaySocket] Failed to parse message`, e);
      }
    };

    this.ws.onclose = () => {
      console.log(`[OverlaySocket] Connection closed. Reconnecting in ${this.reconnectDelay}ms...`);
      setTimeout(() => this.connect(), this.reconnectDelay);
      
      // Exponential backoff, max 30s
      this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30000);
    };

    this.ws.onerror = (error) => {
      console.error(`[OverlaySocket] WebSocket error:`, error);
      this.ws?.close(); // Force close to trigger reconnect logic
    };
  }
  
  public disconnect() {
    if (this.ws) {
      this.ws.onclose = null; // Prevent reconnect loop
      this.ws.close();
      this.ws = null;
    }
  }
}
