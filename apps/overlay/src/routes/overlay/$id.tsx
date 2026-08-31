import { createFileRoute } from '@tanstack/react-router'
import { OverlayComponentRenderer } from '@overlay/overlay-renderer'
import { useLayoutEffect, useState } from 'react'
import { useOverlayConnection } from '../../hooks/useOverlayConnection'
import type { OverlayComponent, AlertEvent } from '@overlay/schema'
import { AlertEngine, alertQueue } from '@overlay/alert-engine'

// A simple local preset resolver for Phase 9
function resolveAlertPreset(event: AlertEvent) {
  return {
    id: event.id,
    preset: {
      theme: (event.alert?.presetId as any) || "cyberpunk",
      visual: { layout: "centered" as const },
      animation: { enterStyle: "fade" as const, exitStyle: "fade" as const },
      audio: { volume: 0.8 },
      tts: { enabled: false, voice: "default", volume: 0.8, template: "{name} donated {amount}! {message}" }
    },
    data: {
      donorName: event.actor?.name || "Anonymous",
      amount: event.actor?.amount || "",
      message: event.message,
    },
    timeline: {
      duration: event.alert?.duration || 6000,
      events: [
        { at: 0, type: "enter" as const, sound: "enter-sound-mock" },
        { at: 300, type: "impact" as const, sound: "impact-sound-mock" },
        { at: (event.alert?.duration || 6000) - 500, type: "exit" as const },
      ]
    }
  };
}
export const Route = createFileRoute('/overlay/$id')({
  component: OverlayRuntimeRoute,
})

function OverlayRuntimeRoute() {
  const { id } = Route.useParams()
  
  const handleAlertEvent = (event: AlertEvent) => {
    console.log("Received alert:event", event);
    const alertDef = resolveAlertPreset(event);
    alertQueue.push(alertDef);
  };

  const { connectionState, overlay } = useOverlayConnection(id, handleAlertEvent)
  const [scale, setScale] = useState(1);

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
        
        {/* Render the AlertEngine on top of everything else */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 9999 }}>
          <AlertEngine />
        </div>
      </div>
    </>
  )
}
