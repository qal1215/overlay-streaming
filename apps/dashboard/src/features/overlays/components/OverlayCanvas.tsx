import type { OverlayComponent } from "@overlay/schema";
import { Rnd } from "react-rnd";
import { OverlayComponentRenderer } from "@overlay/overlay-renderer";
import { AlertEngine } from "@overlay/alert-engine";

interface OverlayCanvasProps {
  components: OverlayComponent[];
  selectedId: string | null;
  scale: number;
  width: number;
  height: number;
  onSelect: (id: string | null) => void;
  onUpdate: (id: string, updates: Partial<OverlayComponent>) => void;
  resolveAssetUrl?: (assetId?: string) => string;
}

export function OverlayCanvas({
  components,
  selectedId,
  scale,
  width,
  height,
  onSelect,
  onUpdate,
  resolveAssetUrl,
}: OverlayCanvasProps) {
  return (
    <main
      className="flex-1 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-background to-black relative flex items-center justify-center overflow-auto"
      onClick={() => onSelect(null)}
    >
      <div style={{ width: width * scale, height: height * scale, position: "relative" }}>
        <div
          className="bg-black/40 border border-white/20 shadow-[0_0_50px_rgba(0,0,0,0.5)] absolute top-0 left-0 overflow-hidden"
          style={{
            width: `${width}px`,
            height: `${height}px`,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        >
          {/* Grid Pattern Background for Canvas */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:20px_20px]" />

          {/* Render Components wrapped in Rnd */}
          {components.map((comp: any) => (
            <Rnd
              key={comp.id}
              scale={scale}
              bounds="parent"
              position={{ x: comp.position.x, y: comp.position.y }}
              size={{ width: comp.size.width, height: comp.size.height }}
              onDragStop={(e, d) => {
                onUpdate(comp.id, {
                  position: { x: Math.round(d.x), y: Math.round(d.y) },
                });
              }}
              onResizeStop={(e, direction, ref, delta, position) => {
                onUpdate(comp.id, {
                  size: {
                    width: parseInt(ref.style.width),
                    height: parseInt(ref.style.height),
                  },
                  position: {
                    x: Math.round(position.x),
                    y: Math.round(position.y),
                  },
                });
              }}
              onClick={(e: any) => {
                e.stopPropagation();
                onSelect(comp.id);
              }}
              style={{ zIndex: comp.zIndex }}
              className={`${
                selectedId === comp.id
                  ? "ring-2 ring-primary border-transparent"
                  : "border border-dashed border-white/20 hover:border-white/50"
              } transition-colors cursor-move`}
            >
              <div className="w-full h-full relative group">
                <OverlayComponentRenderer component={comp} resolveAssetUrl={resolveAssetUrl} isEditor={true} />
              </div>
            </Rnd>
          ))}

          {/* Render real AlertEngine for local canvas testing */}
          <AlertEngine />
        </div>
      </div>
    </main>
  );
}
