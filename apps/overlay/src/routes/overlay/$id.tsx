import { createFileRoute } from '@tanstack/react-router'
import { OverlayComponentRenderer } from '@overlay/overlay-renderer'
import { useLayoutEffect, useState } from 'react'
import { useOverlayConnection } from '../../hooks/useOverlayConnection'
import type { OverlayComponent } from '@overlay/schema'

export const Route = createFileRoute('/overlay/$id')({
  component: OverlayRuntimeRoute,
})

function OverlayRuntimeRoute() {
  const { id } = Route.useParams()
  const { connectionState, overlay } = useOverlayConnection(id)
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
      </div>
    </>
  )
}
