import { createFileRoute } from '@tanstack/react-router'
import { OverlayComponentRenderer } from '@overlay/overlay-renderer'
import { useLayoutEffect, useState, useRef } from 'react'
import { useOverlayConnection } from '../../hooks/useOverlayConnection'
import type { OverlayComponent, AlertEvent, AlertInstance, AlertPlacement } from '@overlay/schema'
import { AlertEngine, alertQueue } from '@overlay/alert-engine'

// Removed mocked resolveAlertPreset
export const Route = createFileRoute('/overlay/$id')({
  component: OverlayRuntimeRoute,
})

function OverlayRuntimeRoute() {
  const { id } = Route.useParams()
  const [scale, setScale] = useState(1);
  const overlayRef = useRef<any>(null); // To always access latest overlay in handleAlertEvent

  const handleAlertEvent = async (event: AlertEvent) => {
    console.log("Received alert:event", event);
    const overlay = overlayRef.current;
    if (!overlay) return;

    // Find the alert component that matches this event.
    // For Phase 10: One active AlertComponent per event type per overlay.
    // Currently fallback to any alert component or match presetId if given.
    const targetComponent = overlay.components.find(
      (c: any) => c.type === 'alert' && (!event.alert?.presetId || c.alertId === event.alert.presetId)
    );

    if (!targetComponent) {
      console.warn("No AlertComponent found for event on this overlay", event);
      return;
    }

    let alertDef;
    try {
      // Fetch the actual alert definition from the backend
      const res = await fetch(`http://localhost:8787/api/admin/creator/default_creator/alerts/${targetComponent.alertId}`);
      if (!res.ok) throw new Error("Failed to fetch alert definition");
      alertDef = await res.json();
      
      // Merge event data into the definition data so the donor name/amount shows up
      alertDef.data = {
        ...alertDef.data,
        donorName: event.actor?.name || "Anonymous",
        amount: event.actor?.amount || "",
        message: event.message,
      };

      // Ensure timeline exists (since DB only stores preset config)
      alertDef.timeline = {
        duration: event.alert?.duration || 6000,
        events: [
          { at: 0, type: "enter" },
          { at: 300, type: "impact" },
          { at: (event.alert?.duration || 6000) - 500, type: "exit" },
        ]
      };
    } catch (err) {
      console.error("Failed to load alert definition", err);
      return;
    }
    
    const placement: AlertPlacement = {
      x: targetComponent.position.x,
      y: targetComponent.position.y,
      width: targetComponent.size.width,
      height: targetComponent.size.height,
      zIndex: targetComponent.zIndex,
    };

    const instance: AlertInstance = {
      event,
      definition: alertDef,
      placement,
    };
    
    alertQueue.push(instance);
  };

  const { connectionState, overlay } = useOverlayConnection(id, handleAlertEvent)
  
  // Keep overlayRef updated
  useLayoutEffect(() => {
    overlayRef.current = overlay;
  }, [overlay]);

  useLayoutEffect(() => {
    if (!overlay) return;
    
    const handleResize = () => {
      const scaleX = window.innerWidth / overlay.width;
      const scaleY = window.innerHeight / overlay.height;
      setScale(Math.min(scaleX, scaleY));
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
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
    // In production, we'd use an env var or a relative path, but localhost:8787 is used here for dev
    return asset ? `http://localhost:8787${asset.url}` : "";
  };

  return (
    <>
      {/* Optional dev-only connection status badge in the corner */}
      {connectionState !== 'connected' && (
        <div className="absolute top-2 right-2 px-2 py-1 bg-red-500/80 text-white text-xs font-bold rounded z-50">
          {connectionState.toUpperCase()}
        </div>
      )}
      
      <div 
        style={{ 
          width: `${overlay.width}px`, 
          height: `${overlay.height}px`,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          position: 'relative'
        }}
      >
        {overlay.components.map(comp => (
          <div 
            key={comp.id}
            style={{
              position: 'absolute',
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
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          position: 'absolute',
          top: 0,
          left: 0,
          pointerEvents: 'none'
        }}
      >
        <AlertEngine />
      </div>
    </>
  )
}
