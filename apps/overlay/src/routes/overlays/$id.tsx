import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/overlays/$id")({
  component: OverlayRuntime,
});

function OverlayRuntime() {
  const { id } = Route.useParams();
  const [overlay, setOverlay] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Real-time events state
  const [activeAlerts, setActiveAlerts] = useState<any[]>([]);

  // Fetch overlay config
  useEffect(() => {
    const fetchOverlay = async () => {
      try {
        const res = await fetch(
          `http://localhost:8787/api/admin/creator/default_creator/overlays/${id}`,
        );
        if (!res.ok) throw new Error("Failed to fetch overlay");
        const data = await res.json();
        setOverlay(data);
      } catch (err: any) {
        setError(err.message);
      }
    };
    fetchOverlay();
  }, [id]);

  // Setup WebSocket connection
  useEffect(() => {
    if (!overlay) return;

    let ws: WebSocket;
    let reconnectTimeout: ReturnType<typeof setTimeout>;

    const connect = () => {
      ws = new WebSocket(`ws://localhost:8787/api/overlay/default_creator/ws`);

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);

          if (payload.type === "DONATION") {
            // Push to local active alerts state to trigger animation
            const alertId = crypto.randomUUID();
            setActiveAlerts((prev) => [...prev, { id: alertId, ...payload }]);

            // Auto remove after a set time (e.g. 5 seconds)
            setTimeout(() => {
              setActiveAlerts((prev) => prev.filter((a) => a.id !== alertId));
            }, 5000);
          }
        } catch (err) {
          console.error("Failed to parse WS message", err);
        }
      };

      ws.onclose = () => {
        console.log("WS closed, reconnecting...");
        reconnectTimeout = setTimeout(connect, 2000);
      };
    };

    connect();

    return () => {
      clearTimeout(reconnectTimeout);
      if (ws) ws.close();
    };
  }, [overlay]);

  if (error) return <div className="text-white bg-red-500 p-4">{error}</div>;
  if (!overlay) return null; // Transparent background until loaded

  const resolveAssetUrl = (assetId?: string) => {
    if (!assetId) return "";
    const asset = overlay.assets?.[assetId];
    return asset ? `http://localhost:8787${asset.url}` : "";
  };

  // Find the designated alert component area (if any)
  const alertComponent = overlay.components.find(
    (c: any) => c.type === "alert",
  );

  return (
    <div
      className="relative overflow-hidden w-full h-full"
      style={{
        width: `${overlay.resolution_width}px`,
        height: `${overlay.resolution_height}px`,
      }}
    >
      {/* Static Components */}
      {overlay.components.map((comp: any) => {
        if (comp.type === "alert") return null; // Handled separately below

        return (
          <div
            key={comp.id}
            className="absolute"
            style={{
              left: `${comp.position.x}px`,
              top: `${comp.position.y}px`,
              width: `${comp.size.width}px`,
              height: `${comp.size.height}px`,
              zIndex: comp.zIndex,
            }}
          >
            {comp.type === "text" && (
              <div
                className="w-full h-full flex items-center justify-center text-center"
                style={{
                  color: comp.config?.color,
                  fontSize: `${comp.config?.fontSize}px`,
                }}
              >
                {comp.config?.text}
              </div>
            )}

            {comp.type === "image" && comp.assetId && (
              <img
                src={resolveAssetUrl(comp.assetId)}
                className="w-full h-full object-contain"
              />
            )}

            {comp.type === "video" && comp.assetId && (
              <video
                src={resolveAssetUrl(comp.assetId)}
                className="w-full h-full object-contain"
                autoPlay
                loop={comp.loop !== false}
                muted
              />
            )}
          </div>
        );
      })}

      {/* Dynamic Alerts Area */}
      {alertComponent && (
        <div
          className="absolute"
          style={{
            left: `${alertComponent.position.x}px`,
            top: `${alertComponent.position.y}px`,
            width: `${alertComponent.size.width}px`,
            height: `${alertComponent.size.height}px`,
            zIndex: alertComponent.zIndex,
          }}
        >
          <AnimatePresence>
            {activeAlerts.map((alert) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -50, scale: 0.9 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="absolute inset-0 flex flex-col items-center justify-center"
              >
                {/* Visual Alert Content */}
                <div className="bg-gradient-to-r from-emerald-500 to-emerald-700 text-white font-bold text-3xl px-8 py-4 rounded-xl shadow-[0_0_30px_rgba(16,185,129,0.5)] border-2 border-emerald-400">
                  <div className="text-sm text-emerald-200 uppercase tracking-widest text-center mb-1">
                    New {alert.type}
                  </div>
                  <div className="text-center">
                    {alert.username || "Anonymous"} sent {alert.amount}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
