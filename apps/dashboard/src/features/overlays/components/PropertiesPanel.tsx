import type { OverlayComponent } from "@overlay/schema";
import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";

interface PropertiesPanelProps {
  component?: OverlayComponent;
  assets?: any[];
  alerts?: Record<string, any>;
  onUpdate: (id: string, updates: Partial<OverlayComponent>) => void;
  onUpdateConfig: (id: string, config: any) => void;
  onMoveZIndex: (id: string, direction: "up" | "down") => void;
  onRemove: (id: string) => void;
  onOpenAssetPicker: (type: "image" | "video") => void;
  onTestAlert?: (componentId: string) => void;
}

export function PropertiesPanel({
  component,
  assets,
  alerts,
  onUpdate,
  onUpdateConfig,
  onMoveZIndex,
  onRemove,
  onOpenAssetPicker,
  onTestAlert,
}: PropertiesPanelProps) {
  if (!component) {
    return (
      <aside className="w-80 border-l border-white/10 bg-surface/80 p-5 overflow-y-auto flex flex-col z-10 backdrop-blur-md">
        <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-6">
          Properties
        </h3>
        <div className="text-sm text-text-muted italic">
          Select a component on the canvas to view and edit its properties.
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-80 border-l border-white/10 bg-surface/80 p-5 overflow-y-auto flex flex-col z-10 backdrop-blur-md">
      <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-6">
        Properties
      </h3>

      <div className="space-y-6">
        {/* Type Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="uppercase text-sm font-bold text-white tracking-widest">
              {component.type}
            </span>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => onMoveZIndex(component.id, "up")}
              className="p-1.5 hover:bg-white/10 rounded text-text-muted hover:text-white"
              title="Bring Forward"
            >
              <ArrowUp size={14} />
            </button>
            <button
              onClick={() => onMoveZIndex(component.id, "down")}
              className="p-1.5 hover:bg-white/10 rounded text-text-muted hover:text-white"
              title="Send Backward"
            >
              <ArrowDown size={14} />
            </button>
            <button
              onClick={() => onRemove(component.id)}
              className="p-1.5 hover:bg-red-500/20 rounded text-red-400"
              title="Delete"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {/* Transform */}
        <div className="space-y-3">
          <label className="text-xs font-medium text-text-muted uppercase">Transform</label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-[10px] text-text-muted absolute ml-2 mt-2">X</span>
              <input
                type="number"
                value={component.position.x}
                onChange={(e) =>
                  onUpdate(component.id, {
                    position: { ...component.position, x: parseInt(e.target.value) },
                  })
                }
                className="w-full bg-background border border-white/10 rounded-lg px-2 py-1.5 pl-6 text-sm text-white"
              />
            </div>
            <div>
              <span className="text-[10px] text-text-muted absolute ml-2 mt-2">Y</span>
              <input
                type="number"
                value={component.position.y}
                onChange={(e) =>
                  onUpdate(component.id, {
                    position: { ...component.position, y: parseInt(e.target.value) },
                  })
                }
                className="w-full bg-background border border-white/10 rounded-lg px-2 py-1.5 pl-6 text-sm text-white"
              />
            </div>
            <div>
              <span className="text-[10px] text-text-muted absolute ml-2 mt-2">W</span>
              <input
                type="number"
                value={component.size.width}
                onChange={(e) =>
                  onUpdate(component.id, {
                    size: { ...component.size, width: parseInt(e.target.value) },
                  })
                }
                className="w-full bg-background border border-white/10 rounded-lg px-2 py-1.5 pl-6 text-sm text-white"
              />
            </div>
            <div>
              <span className="text-[10px] text-text-muted absolute ml-2 mt-2">H</span>
              <input
                type="number"
                value={component.size.height}
                onChange={(e) =>
                  onUpdate(component.id, {
                    size: { ...component.size, height: parseInt(e.target.value) },
                  })
                }
                className="w-full bg-background border border-white/10 rounded-lg px-2 py-1.5 pl-6 text-sm text-white"
              />
            </div>
          </div>
        </div>

        {/* Specific Configs */}
        {component.type === "text" && "config" in component && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-text-muted uppercase">Text Content</label>
              <textarea
                value={(component.config as any).text as string}
                onChange={(e) => onUpdateConfig(component.id, { text: e.target.value })}
                className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-sm text-white min-h-[80px]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-text-muted uppercase">Font Size</label>
              <input
                type="number"
                value={(component.config as any).fontSize as number}
                onChange={(e) => onUpdateConfig(component.id, { fontSize: parseInt(e.target.value) })}
                className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-text-muted uppercase">Color</label>
              <input
                type="color"
                value={(component.config as any).color as string}
                onChange={(e) => onUpdateConfig(component.id, { color: e.target.value })}
                className="w-full h-10 rounded cursor-pointer bg-transparent border-0 p-0"
              />
            </div>
          </div>
        )}

        {(component.type === "image" || component.type === "video") && (
          <div className="space-y-4">
            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <label className="text-xs font-medium text-text-muted uppercase mb-3 block">
                Selected Asset
              </label>
              {/* @ts-ignore */}
              {component.assetId ? (
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-semibold truncate bg-background px-3 py-2 rounded border border-white/5">
                    {/* @ts-ignore */}
                    {assets?.find((a) => a.id === component.assetId)?.name || "Unknown Asset"}
                  </span>
                  <button
                    onClick={() => onOpenAssetPicker(component.type === "image" ? "image" : "video")}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded text-sm transition-colors mt-2"
                  >
                    Change Asset
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => onOpenAssetPicker(component.type === "image" ? "image" : "video")}
                  className="w-full px-4 py-3 bg-primary hover:bg-primary-hover text-white rounded font-medium transition-colors"
                >
                  Choose Asset
                </button>
              )}
            </div>
          </div>
        )}

        {component.type === "alert" && (
          <div className="space-y-4">
            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <label className="text-xs font-medium text-text-muted uppercase mb-3 block">
                Linked Alert
              </label>
              {/* @ts-ignore */}
              {alerts && alerts[component.alertId] ? (
                <div className="flex flex-col gap-3">
                  <span className="text-sm font-semibold truncate bg-background px-3 py-2 rounded border border-white/5 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 shrink-0"></span>
                    {/* @ts-ignore */}
                    {alerts[component.alertId].name || "Custom Alert"}
                  </span>
                  
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <button
                      onClick={() => onTestAlert?.(component.id)}
                      className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded text-xs font-medium transition-colors"
                    >
                      ▶ Preview
                    </button>
                    {/* @ts-ignore */}
                    <a
                      href={`/alerts/${component.alertId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-primary/20 hover:bg-primary/30 text-primary text-center rounded text-xs font-medium transition-colors"
                    >
                      Edit Alert
                    </a>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
                    <span className="font-bold block mb-1">⚠ Alert Unavailable</span>
                    This alert may have been deleted or doesn't exist.
                  </div>
                  <button
                    onClick={() => onRemove(component.id)}
                    className="w-full px-3 py-2 bg-white/5 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded text-sm transition-colors mt-2"
                  >
                    Remove from overlay
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
