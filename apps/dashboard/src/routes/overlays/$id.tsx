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

export const Route = createFileRoute("/overlays/$id")({
  component: OverlayEditorPage,
});

function OverlayEditorPage() {
  const { id } = Route.useParams();
  const { data: overlay, isLoading } = useOverlay(id);
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
    return asset ? `http://localhost:8787${asset.url}` : "https://placehold.co/600x400";
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
        onTestAlert={() => {
          fetch("http://localhost:8787/api/overlay/default_creator/broadcast", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type: "DONATION", amount: "$50.00", username: "TestUser123" }),
          });
        }}
        onSave={handleSave}
        isSaving={updateOverlay.isPending}
        overlayId={id}
      />

      <div className="flex-1 flex overflow-hidden">
        <aside className="w-64 border-r border-white/10 bg-surface/80 p-4 overflow-y-auto flex flex-col z-10 backdrop-blur-md">
          <ComponentToolbar onAdd={editor.handleAddComponent} />
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
    </div>
  );
}
