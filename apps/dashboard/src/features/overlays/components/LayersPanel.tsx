import type { OverlayComponent } from "@overlay/schema";
import { Bell, Image as ImageIcon, Layers, Type, Video } from "lucide-react";

interface LayersPanelProps {
  components: OverlayComponent[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

export function LayersPanel({ components, selectedId, onSelect }: LayersPanelProps) {
  return (
    <>
      <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
        <Layers size={14} /> Layers
      </h3>
      <div className="flex-1 overflow-y-auto space-y-1">
        {[...components].reverse().map((comp) => (
          <button
            key={comp.id}
            onClick={() => onSelect(comp.id)}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
              selectedId === comp.id
                ? "bg-primary/20 text-white"
                : "hover:bg-white/5 text-text-muted"
            }`}
          >
            <div className="flex items-center gap-2 truncate">
              {comp.type === "alert" && <Bell size={14} />}
              {comp.type === "text" && <Type size={14} />}
              {comp.type === "image" && <ImageIcon size={14} />}
              {comp.type === "video" && <Video size={14} />}
              <span className="truncate capitalize">{comp.type}</span>
            </div>
          </button>
        ))}
        {components.length === 0 && (
          <div className="text-xs text-text-muted italic text-center py-4">
            No components added.
          </div>
        )}
      </div>
    </>
  );
}
