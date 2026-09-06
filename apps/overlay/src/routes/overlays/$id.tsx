import { createFileRoute } from "@tanstack/react-router";
import { OverlayComponentRenderer } from "@overlay/overlay-renderer";
import { useLayoutEffect, useState, useRef } from "react";
import { useOverlayConnection } from "../../hooks/useOverlayConnection";
import type {
  OverlayComponent,
  AlertEvent,
  AlertInstance,
  AlertPlacement,
  ResolvedAlertEvent,
} from "@overlay/schema";
import { AlertEngine, alertQueue } from "@overlay/alert-engine";
import { AudioSetup } from "../../components/AudioSetup";
import { API_URL } from "../../lib/config";

export const Route = createFileRoute("/overlays/$id")({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      runtime: search.runtime as string | undefined,
    };
  },
  component: OverlayRuntimeRoute,
});

function OverlayRuntimeRoute() {
  const { id } = Route.useParams();
  const { runtime } = Route.useSearch();
  const isObs = runtime === "obs";
  const [scale, setScale] = useState(1);
  const runtimeStateRef = useRef<any>(null); // To always access latest runtime state in handleAlertEvent

  const handleAlertEvent = async (resolvedEvent: ResolvedAlertEvent) => {
    const { event, alertId } = resolvedEvent;
    console.log("[AlertRuntime] Received alert:event", event.eventId || "unknown", "mapped to", alertId);
    
    const runtimeState = runtimeStateRef.current;
    if (!runtimeState || !runtimeState.overlay) return;
    const overlay = runtimeState.overlay;

    // Find the alert component that matches this alertId strictly.
    const targetComponent = overlay.components.find(
      (c: any) =>
        c.type === "alert" &&
        c.alertId === alertId,
    );

    if (!targetComponent) {
      console.warn(
        "[AlertRuntime] No AlertComponent found on this overlay for alertId:",
        alertId
      );
      return;
    }

    console.log("[AlertRuntime] Resolved AlertComponent", { alertId });

    // Zero-HTTP local lookup of the alert definition
    let alertDef = runtimeState.alerts[alertId];

    if (!alertDef) {
      console.warn(
        "[AlertRuntime] AlertDefinition not found in preloaded runtime state for alertId:",
        alertId,
      );
      return;
    }

    console.log("[AlertRuntime] Resolved AlertDefinition", {
      name: alertDef.name,
    });

    // Clone it so we don't mutate the cached version
    alertDef = JSON.parse(JSON.stringify(alertDef));

    // Merge event data into the definition data so the donor name/amount shows up
    alertDef.data = {
      ...alertDef.data,
      donorName: event.actor?.name || "Anonymous",
      amount: event.actor?.amount || "",
      message: event.message,
    };

    // Use event duration if provided to override the timeline duration
    if (event.alert?.duration && alertDef.timeline) {
      const duration = event.alert.duration;
      alertDef.timeline.duration = duration;
      const exitEvent = alertDef.timeline.events.find(
        (e: any) => e.type === "exit",
      );
      if (exitEvent) {
        exitEvent.at = duration - 500;
      }
    }

    const placement: AlertPlacement = {
      x: targetComponent.position.x,
      y: targetComponent.position.y,
      width: targetComponent.size.width,
      height: targetComponent.size.height,
      zIndex: targetComponent.zIndex,
    };

    const resolveAssetUrl = (assetId?: string) => {
      if (!assetId) return "";
      const asset = overlay.assets?.[assetId];
      return asset ? `${API_URL}${asset.url}` : "";
    };

    const resolvedSoundUrl = alertDef.preset.audio?.soundId
      ? resolveAssetUrl(alertDef.preset.audio.soundId)
      : "";
    const audioSource = resolvedSoundUrl
      ? { type: "asset" as const, url: resolvedSoundUrl }
      : { type: "synthetic" as const, preset: "beep" };

    console.log("[AlertRuntime] Resolved audio", audioSource);

    const instance: AlertInstance = {
      event,
      definition: alertDef,
      placement,
      audio: audioSource,
    };

    console.log("[AlertRuntime] Creating AlertInstance");

    alertQueue.push(instance);
  };

  const { connectionState, runtimeState } = useOverlayConnection(
    id,
    handleAlertEvent,
  );

  // Keep runtimeStateRef updated
  useLayoutEffect(() => {
    runtimeStateRef.current = runtimeState;
  }, [runtimeState]);

  const overlay = runtimeState?.overlay;

  useLayoutEffect(() => {
    if (!overlay) return;

    const handleResize = () => {
      const scaleX = window.innerWidth / overlay.width;
      const scaleY = window.innerHeight / overlay.height;
      setScale(Math.min(scaleX, scaleY));
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, [overlay?.width, overlay?.height]);

  if (!overlay) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-white/50 bg-black/80 font-mono text-sm">
        <div>Loading Overlay: {id}</div>
        <div className="mt-2 text-xs opacity-50">Status: {connectionState}</div>
      </div>
    );
  }

  const resolveAssetUrl = (assetId?: string) => {
    if (!assetId) return "";
    const asset = overlay.assets?.[assetId];
    return asset ? `${API_URL}${asset.url}` : "";
  };

  return (
    <>
      {/* Optional dev-only connection status badge in the corner */}
      {connectionState !== "connected" && (
        <div className="absolute top-2 right-2 px-2 py-1 bg-red-500/80 text-white text-xs font-bold rounded z-50">
          {connectionState.toUpperCase()}
        </div>
      )}

      {!isObs && <AudioSetup />}

      <div
        style={{
          width: `${overlay.width}px`,
          height: `${overlay.height}px`,
          transform: scale === 1 ? "none" : `scale(${scale})`,
          transformOrigin: "top left",
          position: "relative",
          willChange: scale === 1 ? "auto" : "transform",
          backfaceVisibility: "hidden",
        }}
      >
        {overlay.components.map((comp) => (
          <div
            key={comp.id}
            style={{
              position: "absolute",
              left: `${comp.position.x}px`,
              top: `${comp.position.y}px`,
              width: `${comp.size.width}px`,
              height: `${comp.size.height}px`,
              zIndex: comp.zIndex,
              // If not visible or disabled, we could hide it here.
              // visibility: comp.visible === false ? 'hidden' : 'visible'
            }}
          >
            <OverlayComponentRenderer
              component={comp as OverlayComponent}
              resolveAssetUrl={resolveAssetUrl}
            />
          </div>
        ))}
      </div>

      {/* 
        Render the AlertEngine outside the scaled container, or inside. 
        Actually, if we put it inside the scaled container, the placement coordinates 
        (which match the Component) will be scaled automatically!
      */}
      <div
        style={{
          width: `${overlay.width}px`,
          height: `${overlay.height}px`,
          transform: scale === 1 ? "none" : `scale(${scale})`,
          transformOrigin: "top left",
          position: "absolute",
          top: 0,
          left: 0,
          pointerEvents: "none",
          willChange: scale === 1 ? "auto" : "transform",
          backfaceVisibility: "hidden",
        }}
      >
        <AlertEngine />
      </div>
    </>
  );
}
