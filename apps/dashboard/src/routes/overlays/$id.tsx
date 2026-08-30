import type { OverlayComponent } from "@overlay/schema";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Bell,
  Image as ImageIcon,
  Layers,
  Save,
  Trash2,
  Type,
  Video,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Rnd } from "react-rnd";
import { useAssets } from "../../hooks/useAssets";
import { useOverlay, useUpdateOverlay } from "../../hooks/useOverlays";

export const Route = createFileRoute("/overlays/$id")({
  component: OverlayEditorPage,
});

function OverlayEditorPage() {
  const { id } = Route.useParams();
  const { data: overlay, isLoading } = useOverlay(id);
  const { data: assets } = useAssets("all");
  const updateOverlay = useUpdateOverlay();

  const [name, setName] = useState("");
  const [components, setComponents] = useState<OverlayComponent[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Asset Picker State
  const [assetPickerOpen, setAssetPickerOpen] = useState(false);
  const [assetPickerType, setAssetPickerType] = useState<"image" | "video">(
    "image",
  );

  const SCALE = 0.5;

  useEffect(() => {
    if (overlay) {
      setName(overlay.name);
      setComponents(overlay.components || []);
    }
  }, [overlay]);

  if (isLoading) return <div className="p-8">Loading editor...</div>;
  if (!overlay) return <div className="p-8">Overlay not found</div>;

  const handleSave = () => {
    updateOverlay.mutate({ id, data: { name, components } });
  };

  const handleAddComponent = (type: OverlayComponent["type"]) => {
    let newComp: any = {
      id: crypto.randomUUID(),
      type,
      position: { x: 100, y: 100 },
      size: { width: 300, height: 200 },
      zIndex: components.length,
    };

    if (type === "text")
      newComp.config = { text: "New Text", fontSize: 48, color: "#ffffff" };
    if (type === "alert") newComp.config = { text: "Alert Area" };
    if (type === "image") newComp.assetId = undefined;
    if (type === "video") {
      newComp.assetId = undefined;
      newComp.loop = true;
    }

    setComponents([...components, newComp]);
    setSelectedId(newComp.id);
  };

  const updateComponent = (
    compId: string,
    updates: Partial<OverlayComponent>,
  ) => {
    setComponents((prev) =>
      prev.map((c) =>
        c.id === compId ? ({ ...c, ...updates } as OverlayComponent) : c,
      ),
    );
  };

  const updateComponentConfig = (compId: string, configUpdates: any) => {
    setComponents((prev) =>
      prev.map((c) => {
        if (c.id === compId && "config" in c) {
          return { ...c, config: { ...c.config, ...configUpdates } };
        }
        return c;
      }),
    );
  };

  const removeComponent = (compId: string) => {
    setComponents((prev) => prev.filter((c) => c.id !== compId));
    if (selectedId === compId) setSelectedId(null);
  };

  const moveZIndex = (compId: string, direction: "up" | "down") => {
    const idx = components.findIndex((c) => c.id === compId);
    if (idx === -1) return;
    const newComps = [...components];
    if (direction === "up" && idx < newComps.length - 1) {
      const temp = newComps[idx].zIndex;
      newComps[idx].zIndex = newComps[idx + 1].zIndex;
      newComps[idx + 1].zIndex = temp;
      const item = newComps.splice(idx, 1)[0];
      newComps.splice(idx + 1, 0, item);
    } else if (direction === "down" && idx > 0) {
      const temp = newComps[idx].zIndex;
      newComps[idx].zIndex = newComps[idx - 1].zIndex;
      newComps[idx - 1].zIndex = temp;
      const item = newComps.splice(idx, 1)[0];
      newComps.splice(idx - 1, 0, item);
    }
    setComponents(newComps);
  };

  const selectedComponent = components.find((c) => c.id === selectedId);

  // Helper to resolve asset URLs
  const getAssetUrl = (assetId?: string) => {
    if (!assetId) return "https://placehold.co/600x400";
    const asset = assets?.find((a) => a.id === assetId);
    return asset
      ? `http://localhost:8787${asset.url}`
      : "https://placehold.co/600x400";
  };

  return (
    <div className="h-full flex flex-col -m-8">
      {/* Editor Topbar */}
      <header className="h-14 border-b border-white/10 bg-surface flex items-center justify-between px-4 z-20 shadow-md">
        <div className="flex items-center gap-4">
          <Link
            to="/overlays"
            className="p-2 hover:bg-white/10 rounded-lg text-text-muted hover:text-white transition-colors"
          >
            <ArrowLeft size={18} />
          </Link>
          <div className="w-px h-6 bg-white/10" />
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-transparent border-none focus:outline-none text-lg font-bold text-white px-2 py-1 rounded hover:bg-white/5 focus:bg-white/5 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="text-xs text-text-muted mr-4 bg-black/20 px-2 py-1 rounded">
            {overlay.resolution_width} × {overlay.resolution_height}
          </div>
          <button
            onClick={() => {
              fetch('http://localhost:8787/api/overlay/default_creator/broadcast', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'DONATION', amount: '$50.00', username: 'TestUser123' })
              })
            }}
            className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium rounded-lg transition-colors mr-2"
          >
            <Bell size={16} />
            Test Alert
          </button>
          <button
            onClick={handleSave}
            disabled={updateOverlay.isPending}
            className="flex items-center gap-2 px-3 py-1.5 bg-primary hover:bg-primary-hover text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            <Save size={16} />
            {updateOverlay.isPending ? "Saving..." : "Save Layout"}
          </button>
        </div>
      </header>

      {/* Editor Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Component Palette & Layers */}
        <aside className="w-64 border-r border-white/10 bg-surface/80 p-4 overflow-y-auto flex flex-col z-10 backdrop-blur-md">
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
            Add Component
          </h3>
          <div className="grid grid-cols-2 gap-2 mb-8">
            <button
              onClick={() => handleAddComponent("alert")}
              className="flex flex-col items-center justify-center p-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl transition-colors group"
            >
              <Bell
                size={20}
                className="text-primary mb-2 group-hover:scale-110 transition-transform"
              />
              <span className="text-xs font-medium">Alerts</span>
            </button>
            <button
              onClick={() => handleAddComponent("text")}
              className="flex flex-col items-center justify-center p-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl transition-colors group"
            >
              <Type
                size={20}
                className="text-primary mb-2 group-hover:scale-110 transition-transform"
              />
              <span className="text-xs font-medium">Text</span>
            </button>
            <button
              onClick={() => handleAddComponent("image")}
              className="flex flex-col items-center justify-center p-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl transition-colors group"
            >
              <ImageIcon
                size={20}
                className="text-primary mb-2 group-hover:scale-110 transition-transform"
              />
              <span className="text-xs font-medium">Image/GIF</span>
            </button>
            <button
              onClick={() => handleAddComponent("video")}
              className="flex flex-col items-center justify-center p-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl transition-colors group"
            >
              <Video
                size={20}
                className="text-primary mb-2 group-hover:scale-110 transition-transform"
              />
              <span className="text-xs font-medium">Video</span>
            </button>
          </div>

          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
            <Layers size={14} /> Layers
          </h3>
          <div className="flex-1 overflow-y-auto space-y-1">
            {[...components].reverse().map((comp) => (
              <button
                key={comp.id}
                onClick={() => setSelectedId(comp.id)}
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
        </aside>

        {/* Canvas Area */}
        <main
          className="flex-1 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-background to-black relative flex items-center justify-center overflow-auto"
          onClick={() => setSelectedId(null)}
        >
            <div
              className="bg-black/40 border border-white/20 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden backdrop-blur-sm"
              style={{
                width: `${(overlay as any).resolution_width}px`,
                height: `${(overlay as any).resolution_height}px`,
                transform: `scale(${SCALE})`,
                transformOrigin: "center center",
              }}
            >
            {/* Grid Pattern Background for Canvas */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:20px_20px]" />

            {/* Render Components */}
            {components.map((comp: any) => (
              <Rnd
                key={comp.id}
                scale={SCALE}
                bounds="parent"
                position={{ x: comp.position.x, y: comp.position.y }}
                size={{ width: comp.size.width, height: comp.size.height }}
                onDragStop={(e, d) => {
                  updateComponent(comp.id, {
                    position: { x: Math.round(d.x), y: Math.round(d.y) },
                  });
                }}
                onResizeStop={(e, direction, ref, delta, position) => {
                  updateComponent(comp.id, {
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
                  setSelectedId(comp.id);
                }}
                style={{ zIndex: comp.zIndex }}
                className={`${selectedId === comp.id ? "ring-2 ring-primary border-transparent" : "border border-dashed border-white/20 hover:border-white/50"} transition-colors cursor-move`}
              >
                {/* Visual Representation based on type */}
                <div className="w-full h-full relative group">
                  {comp.type === "alert" && (
                    <div className="w-full h-full bg-emerald-500/20 flex flex-col items-center justify-center border border-emerald-500/50">
                      <Bell
                        size={32}
                        className="text-emerald-400 mb-2 opacity-50"
                      />
                      <span className="text-emerald-400 font-bold uppercase tracking-wider text-xl">
                        {comp.config?.text || "Alert Area"}
                      </span>
                    </div>
                  )}
                  {comp.type === "text" && (
                    <div
                      className="w-full h-full flex items-center justify-center p-4 overflow-hidden text-center"
                      style={{
                        color: comp.config?.color,
                        fontSize: `${comp.config?.fontSize}px`,
                      }}
                    >
                      {comp.config?.text || "Double click to edit"}
                    </div>
                  )}
                  {comp.type === "image" && (
                    <div className="w-full h-full bg-white/5 flex flex-col items-center justify-center overflow-hidden">
                      {comp.assetId ? (
                        <img
                          src={getAssetUrl(comp.assetId)}
                          alt="Overlay component"
                          className="w-full h-full object-contain pointer-events-none"
                        />
                      ) : (
                        <div className="text-center">
                          <ImageIcon
                            size={48}
                            className="mx-auto text-text-muted mb-2 opacity-30"
                          />
                          <span className="text-text-muted text-sm font-medium block px-4 py-2 border border-white/10 rounded-lg">
                            Select Asset
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                  {comp.type === "video" && (
                    <div className="w-full h-full bg-white/5 flex flex-col items-center justify-center overflow-hidden">
                      {comp.assetId ? (
                        <video
                          src={getAssetUrl(comp.assetId)}
                          className="w-full h-full object-contain pointer-events-none"
                          autoPlay
                          loop={comp.loop}
                          muted
                        />
                      ) : (
                        <div className="text-center">
                          <Video
                            size={48}
                            className="mx-auto text-text-muted mb-2 opacity-30"
                          />
                          <span className="text-text-muted text-sm font-medium block px-4 py-2 border border-white/10 rounded-lg">
                            Select Asset
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </Rnd>
            ))}
          </div>
        </main>

        {/* Right Sidebar - Properties */}
        <aside className="w-80 border-l border-white/10 bg-surface/80 p-5 overflow-y-auto flex flex-col z-10 backdrop-blur-md">
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-6">
            Properties
          </h3>

          {selectedComponent ? (
            <div className="space-y-6">
              {/* Type Header */}
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <span className="uppercase text-sm font-bold text-white tracking-widest">
                    {selectedComponent.type}
                  </span>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => moveZIndex(selectedComponent.id, "up")}
                    className="p-1.5 hover:bg-white/10 rounded text-text-muted hover:text-white"
                    title="Bring Forward"
                  >
                    <ArrowUp size={14} />
                  </button>
                  <button
                    onClick={() => moveZIndex(selectedComponent.id, "down")}
                    className="p-1.5 hover:bg-white/10 rounded text-text-muted hover:text-white"
                    title="Send Backward"
                  >
                    <ArrowDown size={14} />
                  </button>
                  <button
                    onClick={() => removeComponent(selectedComponent.id)}
                    className="p-1.5 hover:bg-red-500/20 rounded text-red-400"
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Transform */}
              <div className="space-y-3">
                <label className="text-xs font-medium text-text-muted uppercase">
                  Transform
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[10px] text-text-muted absolute ml-2 mt-2">
                      X
                    </span>
                    <input
                      type="number"
                      value={selectedComponent.position.x}
                      onChange={(e) =>
                        updateComponent(selectedComponent.id, {
                          position: {
                            ...selectedComponent.position,
                            x: parseInt(e.target.value),
                          },
                        })
                      }
                      className="w-full bg-background border border-white/10 rounded-lg px-2 py-1.5 pl-6 text-sm text-white"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-text-muted absolute ml-2 mt-2">
                      Y
                    </span>
                    <input
                      type="number"
                      value={selectedComponent.position.y}
                      onChange={(e) =>
                        updateComponent(selectedComponent.id, {
                          position: {
                            ...selectedComponent.position,
                            y: parseInt(e.target.value),
                          },
                        })
                      }
                      className="w-full bg-background border border-white/10 rounded-lg px-2 py-1.5 pl-6 text-sm text-white"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-text-muted absolute ml-2 mt-2">
                      W
                    </span>
                    <input
                      type="number"
                      value={selectedComponent.size.width}
                      onChange={(e) =>
                        updateComponent(selectedComponent.id, {
                          size: {
                            ...selectedComponent.size,
                            width: parseInt(e.target.value),
                          },
                        })
                      }
                      className="w-full bg-background border border-white/10 rounded-lg px-2 py-1.5 pl-6 text-sm text-white"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-text-muted absolute ml-2 mt-2">
                      H
                    </span>
                    <input
                      type="number"
                      value={selectedComponent.size.height}
                      onChange={(e) =>
                        updateComponent(selectedComponent.id, {
                          size: {
                            ...selectedComponent.size,
                            height: parseInt(e.target.value),
                          },
                        })
                      }
                      className="w-full bg-background border border-white/10 rounded-lg px-2 py-1.5 pl-6 text-sm text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Specific Configs */}
              {selectedComponent.type === "text" &&
                "config" in selectedComponent && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-text-muted uppercase">
                        Text Content
                      </label>
                      <textarea
                        value={(selectedComponent.config as any).text as string}
                        onChange={(e) =>
                          updateComponentConfig(selectedComponent.id, {
                            text: e.target.value,
                          })
                        }
                        className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-sm text-white min-h-[80px]"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-text-muted uppercase">
                        Font Size
                      </label>
                      <input
                        type="number"
                        value={
                          (selectedComponent.config as any).fontSize as number
                        }
                        onChange={(e) =>
                          updateComponentConfig(selectedComponent.id, {
                            fontSize: parseInt(e.target.value),
                          })
                        }
                        className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-text-muted uppercase">
                        Color
                      </label>
                      <input
                        type="color"
                        value={
                          (selectedComponent.config as any).color as string
                        }
                        onChange={(e) =>
                          updateComponentConfig(selectedComponent.id, {
                            color: e.target.value,
                          })
                        }
                        className="w-full h-10 rounded cursor-pointer bg-transparent border-0 p-0"
                      />
                    </div>
                  </div>
                )}

              {(selectedComponent.type === "image" ||
                selectedComponent.type === "video") && (
                <div className="space-y-4">
                  <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                    <label className="text-xs font-medium text-text-muted uppercase mb-3 block">
                      Selected Asset
                    </label>
                    {/* @ts-ignore */}
                    {selectedComponent.assetId ? (
                      <div className="flex flex-col gap-2">
                        {/* @ts-ignore */}
                        <span className="text-sm font-semibold truncate bg-background px-3 py-2 rounded border border-white/5">
                          {assets?.find(
                            (a) => a.id === selectedComponent.assetId,
                          )?.name || "Unknown Asset"}
                        </span>
                        <button
                          onClick={() => {
                            setAssetPickerType(
                              selectedComponent.type === "image"
                                ? "image"
                                : "video",
                            );
                            setAssetPickerOpen(true);
                          }}
                          className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded text-sm transition-colors mt-2"
                        >
                          Change Asset
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setAssetPickerType(
                            selectedComponent.type === "image"
                              ? "image"
                              : "video",
                          );
                          setAssetPickerOpen(true);
                        }}
                        className="w-full px-4 py-3 bg-primary hover:bg-primary-hover text-white rounded font-medium transition-colors"
                      >
                        Choose Asset
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm text-text-muted italic">
              Select a component on the canvas to view and edit its properties.
            </div>
          )}
        </aside>
      </div>

      {/* Asset Picker Modal */}
      {assetPickerOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-8"
          onClick={() => setAssetPickerOpen(false)}
        >
          <div
            className="bg-surface border border-white/10 rounded-2xl max-w-4xl w-full max-h-[80vh] flex flex-col shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="font-bold text-lg">
                Select {assetPickerType === "image" ? "Image/GIF" : "Video"}{" "}
                Asset
              </h3>
              <button
                onClick={() => setAssetPickerOpen(false)}
                className="p-2 hover:bg-white/10 rounded-lg text-text-muted hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-6">
              <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
                {assets
                  ?.filter((a) =>
                    assetPickerType === "image"
                      ? a.type === "image" || a.type === "gif"
                      : a.type === "video",
                  )
                  .map((asset) => (
                    <div
                      key={asset.id}
                      className="group bg-background border border-white/5 rounded-xl overflow-hidden hover:border-primary cursor-pointer flex flex-col"
                      onClick={() => {
                        if (selectedId)
                          updateComponent(selectedId, { assetId: asset.id });
                        setAssetPickerOpen(false);
                      }}
                    >
                      <div className="aspect-video bg-black/50 flex items-center justify-center relative overflow-hidden">
                        {asset.type === "image" || asset.type === "gif" ? (
                          <img
                            src={`http://localhost:8787${asset.url}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <video
                            src={`http://localhost:8787${asset.url}`}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div className="p-2 text-xs truncate">{asset.name}</div>
                    </div>
                  ))}
              </div>
              {assets?.filter((a) =>
                assetPickerType === "image"
                  ? a.type === "image" || a.type === "gif"
                  : a.type === "video",
              ).length === 0 && (
                <div className="text-center text-text-muted py-12">
                  No compatible assets found in your library.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
