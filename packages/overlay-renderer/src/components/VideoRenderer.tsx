import type { OverlayComponent } from "@overlay/schema";
import { Video } from "lucide-react";

export function VideoRenderer({ 
  component, 
  resolveAssetUrl 
}: { 
  component: OverlayComponent;
  resolveAssetUrl: (id?: string) => string;
}) {
  if (component.type !== "video") return null;
  return (
    <div className="w-full h-full bg-white/5 flex flex-col items-center justify-center overflow-hidden">
      {component.assetId ? (
        <video
          src={resolveAssetUrl(component.assetId)}
          className="w-full h-full object-contain pointer-events-none"
          autoPlay
          loop={component.loop}
          muted
        />
      ) : (
        <div className="text-center">
          <Video size={48} className="mx-auto text-text-muted mb-2 opacity-30" />
          <span className="text-text-muted text-sm font-medium block px-4 py-2 border border-white/10 rounded-lg">
            Select Asset
          </span>
        </div>
      )}
    </div>
  );
}
