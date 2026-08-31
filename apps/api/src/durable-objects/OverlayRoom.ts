import { DurableObject } from "cloudflare:workers";
import type { OverlayDefinition, OverlayRuntimeMessage } from "@overlay/schema";

export class OverlayRoom extends DurableObject {
  private currentOverlay: OverlayDefinition | null = null;

  constructor(ctx: DurableObjectState, env: any) {
    super(ctx, env);
    // Ideally we'd load the initial state from D1 here if we don't have it,
    // but the API route can also just push the state to us.
    this.ctx.blockConcurrencyWhile(async () => {
      const stored = await this.ctx.storage.get<OverlayDefinition>("overlay");
      if (stored) {
        this.currentOverlay = stored;
      }
    });
  }

  async fetch(request: Request) {
    const url = new URL(request.url);

    // Endpoint for the API to push overlay updates
    if (request.method === "POST" && url.pathname === "/update") {
      const overlay = (await request.json()) as OverlayDefinition;
      this.currentOverlay = overlay;
      await this.ctx.storage.put("overlay", overlay);
      
      const message: OverlayRuntimeMessage = {
        type: "overlay:update",
        overlay,
      };
      
      return this.broadcast(message);
    }

    // Endpoint for the API to initialize the DO state without broadcasting
    if (request.method === "POST" && url.pathname === "/init") {
      if (!this.currentOverlay) {
        const overlay = (await request.json()) as OverlayDefinition;
        this.currentOverlay = overlay;
        await this.ctx.storage.put("overlay", overlay);
      }
      return new Response("ok");
    }

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
    
    // Send initial state upon connection
    if (this.currentOverlay) {
      const initMessage: OverlayRuntimeMessage = {
        type: "overlay:init",
        overlay: this.currentOverlay,
      };
      server.send(JSON.stringify(initMessage));
    }

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
    // Handle messages from OBS if needed
  }

  async webSocketClose(ws: WebSocket, code: number, reason: string, wasClean: boolean) {
    // Automatically handled by Cloudflare
  }

  async webSocketError(ws: WebSocket, error: unknown) {
    // Automatically handled by Cloudflare
  }

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
