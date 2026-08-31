import { createFileRoute } from "@tanstack/react-router";
import { useAssets } from "../../features/assets/hooks/useAssets";
import { useOverlay, useUpdateOverlay } from "../../features/overlays/hooks/useOverlays";
import { useOverlayEditor } from "../../features/overlays/editor/editor-state";
import { EditorToolbar } from "../../features/overlays/components/EditorToolbar";
import { ComponentToolbar } from "../../features/overlays/components/ComponentToolbar";
import { LayersPanel } from "../../features/overlays/components/LayersPanel";
import { OverlayCanvas } from "../../features/overlays/components/OverlayCanvas";
import { PropertiesPanel } from "../../features/overlays/components/PropertiesPanel";
import { AssetPickerModal } from "../../features/overlays/components/AssetPickerModal";
import { OverlayAlertPickerModal } from "../../features/overlays/components/OverlayAlertPickerModal";
import { alertQueue } from "@overlay/alert-engine";
import type { AlertEvent, AlertInstance, AlertPlacement } from "@overlay/schema";
import { API_URL } from "../../api/client";

export const Route = createFileRoute("/overlays/$id")({
  component: OverlayEditorPage,
});

function OverlayEditorPage() {
  const { id } = Route.useParams();
  const { data: runtimeState, isLoading } = useOverlay(id);
  const overlay = runtimeState?.overlay;
  const { data: assets } = useAssets("all");
  const updateOverlay = useUpdateOverlay();

  const editor = useOverlayEditor(overlay);

  if (isLoading) return <div className="p-8">Loading editor...</div>;
  if (!overlay) return <div className="p-8">Overlay not found</div>;

  const handleSave = () => {
    updateOverlay.mutate({ id, data: { name: editor.name, components: editor.components } });
  };

  const getAssetUrl = (assetId?: string) => {
    if (!assetId) return "https://placehold.co/600x400";
    const asset = assets?.find((a) => a.id === assetId);
    return asset ? `${API_URL}${asset.url}` : "https://placehold.co/600x400";
  };

  const handleTestAlertLocally = async () => {
    const targetComponent = editor.components.find((c: any) => c.type === "alert");
    if (!targetComponent) {
      console.warn("No AlertComponent found to test locally.");
      return;
    }

    let alertDef;
    try {
      const alertId = (targetComponent as any).alertId;
      const res = await fetch(`${API_URL}/api/admin/creator/default_creator/alerts/${alertId}`);
      if (!res.ok) throw new Error("Failed to fetch alert definition");
      alertDef = await res.json();
      
      alertDef.data = {
        ...alertDef.data,
        donorName: "TestUser",
        amount: "$50",
        message: "This is a local canvas test!",
      };
      const soundUrl = alertDef.preset.audio?.soundId ? getAssetUrl(alertDef.preset.audio.soundId) : undefined;
      
      if (!alertDef.timeline || !alertDef.timeline.events || alertDef.timeline.events.length === 0) {
        alertDef.timeline = {
          duration: 5000,
          events: [
            { at: 0, type: "enter", sound: soundUrl },
            { at: 300, type: "impact" },
            { at: 4500, type: "exit" },
          ]
        };
      }
    } catch (err) {
      console.error("Failed to load alert definition for local test", err);
      return;
    }

    const mockEvent: AlertEvent = {
      id: `evt_${Date.now()}`,
      type: "donation",
      timestamp: Date.now(),
      actor: { name: "TestUser", amount: "$50" },
      message: "This is a local canvas test!",
    };

    const placement: AlertPlacement = {
      x: targetComponent.position.x,
      y: targetComponent.position.y,
      width: targetComponent.size.width,
      height: targetComponent.size.height,
      zIndex: targetComponent.zIndex,
    };

    const instance: AlertInstance = {
      event: mockEvent,
      definition: alertDef,
      placement,
    };

    alertQueue.push(instance);
  };

  return (
    <div className="h-full flex flex-col -m-8">
      <EditorToolbar
        name={editor.name}
        onNameChange={editor.setName}
        scale={editor.scale}
        onScaleChange={editor.setScale}
        width={overlay.width}
        height={overlay.height}
        onSave={handleSave}
        isSaving={updateOverlay.isPending}
        overlayId={id}
        onTestAlert={handleTestAlertLocally}
      />

      <div className="flex-1 flex overflow-hidden">
        <aside className="w-64 border-r border-white/10 bg-surface/80 p-4 overflow-y-auto flex flex-col z-10 backdrop-blur-md">
          <ComponentToolbar onAdd={(type) => {
            if (type === "alert") {
              editor.setAlertPickerOpen(true);
            } else {
              editor.handleAddComponent(type);
            }
          }} />
          <LayersPanel
            components={editor.components}
            selectedId={editor.selectedId}
            onSelect={editor.selectComponent}
          />
        </aside>

        <OverlayCanvas
          components={editor.components}
          selectedId={editor.selectedId}
          scale={editor.scale}
          width={overlay.width}
          height={overlay.height}
          onSelect={editor.selectComponent}
          onUpdate={editor.updateComponent}
          resolveAssetUrl={getAssetUrl}
        />

        <PropertiesPanel
          component={editor.selectedComponent}
          assets={assets}
          onUpdate={editor.updateComponent}
          onUpdateConfig={editor.updateComponentConfig}
          onMoveZIndex={editor.moveZIndex}
          onRemove={editor.removeComponent}
          onOpenAssetPicker={(type) => {
            editor.setAssetPickerType(type);
            editor.setAssetPickerOpen(true);
          }}
        />
      </div>

      <AssetPickerModal
        isOpen={editor.assetPickerOpen}
        type={editor.assetPickerType}
        assets={assets}
        onClose={() => editor.setAssetPickerOpen(false)}
        onSelect={(assetId) => {
          if (editor.selectedId) {
            editor.updateComponent(editor.selectedId, { assetId });
          }
          editor.setAssetPickerOpen(false);
        }}
      />

      <OverlayAlertPickerModal
        isOpen={editor.alertPickerOpen}
        onClose={() => editor.setAlertPickerOpen(false)}
        onSelect={(alertId) => {
          editor.addAlertComponent(alertId);
          editor.setAlertPickerOpen(false);
        }}
      />
    </div>
  );
}
