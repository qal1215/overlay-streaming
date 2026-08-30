import type { OverlayComponent } from "@overlay/schema";
import { Bell, Image as ImageIcon, Type, Video } from "lucide-react";

interface ComponentToolbarProps {
  onAdd: (type: OverlayComponent["type"]) => void;
}

export function ComponentToolbar({ onAdd }: ComponentToolbarProps) {
  return (
    <>
      <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
        Add Component
      </h3>
      <div className="grid grid-cols-2 gap-2 mb-8">
        <button
          onClick={() => onAdd("alert")}
          className="flex flex-col items-center justify-center p-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl transition-colors group"
        >
          <Bell size={20} className="text-primary mb-2 group-hover:scale-110 transition-transform" />
          <span className="text-xs font-medium">Alerts</span>
        </button>
        <button
          onClick={() => onAdd("text")}
          className="flex flex-col items-center justify-center p-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl transition-colors group"
        >
          <Type size={20} className="text-primary mb-2 group-hover:scale-110 transition-transform" />
          <span className="text-xs font-medium">Text</span>
        </button>
        <button
          onClick={() => onAdd("image")}
          className="flex flex-col items-center justify-center p-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl transition-colors group"
        >
          <ImageIcon size={20} className="text-primary mb-2 group-hover:scale-110 transition-transform" />
          <span className="text-xs font-medium">Image/GIF</span>
        </button>
        <button
          onClick={() => onAdd("video")}
          className="flex flex-col items-center justify-center p-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl transition-colors group"
        >
          <Video size={20} className="text-primary mb-2 group-hover:scale-110 transition-transform" />
          <span className="text-xs font-medium">Video</span>
        </button>
      </div>
    </>
  );
}
