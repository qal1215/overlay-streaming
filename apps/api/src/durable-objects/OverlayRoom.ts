import { DurableObject } from "cloudflare:workers";

export class OverlayRoom extends DurableObject {

  constructor(ctx: DurableObjectState, env: any) {
    super(ctx, env);
  }

  async fetch(request: Request) {
    const url = new URL(request.url);

    if (request.method === "POST" && url.pathname === "/broadcast") {
      const event = await request.json();
      return this.broadcast(event);
    }

    const upgradeHeader = request.headers.get("Upgrade");
    if (!upgradeHeader || upgradeHeader !== "websocket") {
      return new Response("Expected Upgrade: websocket", { status: 426 });
    }

    const webSocketPair = new WebSocketPair();
    const client = webSocketPair[0];
    const server = webSocketPair[1];

    this.ctx.acceptWebSocket(server);

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
    // We can handle messages from OBS here if needed (e.g., ping/pong)
  }

  async webSocketClose(ws: WebSocket, code: number, reason: string, wasClean: boolean) {
    // Automatically handled by Cloudflare
  }

  async webSocketError(ws: WebSocket, error: unknown) {
    // Automatically handled by Cloudflare
  }

  // Custom method to broadcast an alert to all connected OBS instances
  async broadcast(event: any) {
    const message = JSON.stringify(event);
    const sockets = this.ctx.getWebSockets();
    for (const session of sockets) {
      try {
        session.send(message);
      } catch (err) {
        console.error("Failed to send message to session", err);
      }
    }
    return new Response(`Broadcasted to ${sockets.length} clients`, { status: 200 });
  }
}
