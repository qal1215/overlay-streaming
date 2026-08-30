import { createFileRoute } from '@tanstack/react-router'
import { OverlayComponentRenderer } from '@overlay/overlay-renderer'
import type { OverlayDefinition, OverlayComponent } from '@overlay/schema'
import { useLayoutEffect, useState } from 'react'

export const Route = createFileRoute('/test-renderer')({
  component: TestRendererRoute,
})

// Deterministic test data based on user instructions
const TEST_OVERLAY: OverlayDefinition = {
  id: "test-overlay-1",
  creatorId: "test-creator-1",
  name: "Deterministic Test",
  width: 1920,
  height: 1080,
  createdAt: new Date(),
  updatedAt: new Date(),
  components: [
    {
      id: "text-1",
      type: "text",
      position: { x: 100, y: 100 },
      size: { width: 400, height: 100 },
      zIndex: 1,
      config: {
        text: "Deterministic Text Output",
        fontSize: 48,
        color: "#ffffff"
      }
    },
    {
      id: "image-1",
      type: "image",
      position: { x: 800, y: 400 },
      size: { width: 300, height: 200 },
      zIndex: 2,
      assetId: "placeholder-1"
    }
  ]
}

function TestRendererRoute() {
  const [scale, setScale] = useState(1);

  // Auto-scale to fit window dimensions while preserving the exact 1920x1080 logical coordinates
  useLayoutEffect(() => {
    const handleResize = () => {
      const scaleX = window.innerWidth / TEST_OVERLAY.width;
      const scaleY = window.innerHeight / TEST_OVERLAY.height;
      // OBS usually fits exactly, but we'll use min to ensure it doesn't clip if aspect ratio is off
      setScale(Math.min(scaleX, scaleY));
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial call

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div 
      style={{ 
        width: `${TEST_OVERLAY.width}px`, 
        height: `${TEST_OVERLAY.height}px`,
        transform: `scale(${scale})`,
        transformOrigin: "top left",
        position: 'relative'
      }}
    >
      {TEST_OVERLAY.components.map(comp => (
        <div 
          key={comp.id}
          style={{
            position: 'absolute',
            left: `${comp.position.x}px`,
            top: `${comp.position.y}px`,
            width: `${comp.size.width}px`,
            height: `${comp.size.height}px`,
            zIndex: comp.zIndex
          }}
        >
          <OverlayComponentRenderer component={comp as OverlayComponent} />
        </div>
      ))}
    </div>
  )
}
