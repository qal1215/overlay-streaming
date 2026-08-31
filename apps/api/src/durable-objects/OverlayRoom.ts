import { DurableObject } from "cloudflare:workers";
import type { OverlayRuntimeState, OverlayRuntimeMessage } from "@overlay/schema";

export class OverlayRoom extends DurableObject {
  private currentState: OverlayRuntimeState | null = null;

  constructor(ctx: DurableObjectState, env: any) {
    super(ctx, env);
    // Ideally we'd load the initial state from D1 here if we don't have it,
    // but the API route can also just push the state to us.
    this.ctx.blockConcurrencyWhile(async () => {
      const stored = await this.ctx.storage.get<OverlayRuntimeState>("overlay_state");
      if (stored) {
        this.currentState = stored;
      }
    });
  }

  async fetch(request: Request) {
    const url = new URL(request.url);

    // Endpoint for the API to push overlay updates
    if (request.method === "POST" && url.pathname === "/update") {
      const state = (await request.json()) as OverlayRuntimeState;
      this.currentState = state;
      await this.ctx.storage.put("overlay_state", state);
      
      const message: OverlayRuntimeMessage = {
        type: "overlay:update",
        state,
      };
      
      return this.broadcast(message);
    }

    if (request.method === "POST" && url.pathname === "/alert/update") {
      const alertDef = (await request.json()) as any;
      if (this.currentState) {
        this.currentState.alerts[alertDef.id] = alertDef;
        await this.ctx.storage.put("overlay_state", this.currentState);
      }
      
      const message: OverlayRuntimeMessage = {
        type: "alert:update",
        alert: alertDef,
      };
      
      return this.broadcast(message);
    }

    // Endpoint for the API to initialize the DO state without broadcasting
    if (request.method === "POST" && url.pathname === "/init") {
      if (!this.currentState) {
        const state = (await request.json()) as OverlayRuntimeState;
        this.currentState = state;
        await this.ctx.storage.put("overlay_state", state);
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
    if (this.currentState) {
      const initMessage: OverlayRuntimeMessage = {
        type: "overlay:init",
        state: this.currentState,
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
