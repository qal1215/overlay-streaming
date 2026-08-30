import { useState, useEffect } from "react";
import type { OverlayComponent } from "@overlay/schema";

export function useOverlayEditor(initialOverlay: any) {
  const [name, setName] = useState("");
  const [components, setComponents] = useState<OverlayComponent[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Asset Picker State
  const [assetPickerOpen, setAssetPickerOpen] = useState(false);
  const [assetPickerType, setAssetPickerType] = useState<"image" | "video">("image");

  const [scale, setScale] = useState(0.5);

  useEffect(() => {
    if (initialOverlay) {
      setName(initialOverlay.name);
      setComponents(initialOverlay.components || []);
    }
  }, [initialOverlay]);

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

  const updateComponent = (compId: string, updates: Partial<OverlayComponent>) => {
    setComponents((prev) =>
      prev.map((c) => (c.id === compId ? ({ ...c, ...updates } as OverlayComponent) : c))
    );
  };

  const updateComponentConfig = (compId: string, configUpdates: any) => {
    setComponents((prev) =>
      prev.map((c) => {
        if (c.id === compId && "config" in c) {
          return { ...c, config: { ...(c as any).config, ...configUpdates } } as OverlayComponent;
        }
        return c;
      })
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

  const selectComponent = (id: string | null) => setSelectedId(id);

  const selectedComponent = components.find((c) => c.id === selectedId);

  return {
    name,
    setName,
    components,
    selectedId,
    selectedComponent,
    scale,
    setScale,
    assetPickerOpen,
    setAssetPickerOpen,
    assetPickerType,
    setAssetPickerType,
    handleAddComponent,
    updateComponent,
    updateComponentConfig,
    removeComponent,
    moveZIndex,
    selectComponent,
  };
}

export type OverlayEditorContextType = ReturnType<typeof useOverlayEditor>;
