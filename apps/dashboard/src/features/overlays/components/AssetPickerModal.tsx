import { X } from "lucide-react";

interface AssetPickerModalProps {
  isOpen: boolean;
  type: "image" | "video";
  assets?: any[];
  onClose: () => void;
  onSelect: (assetId: string) => void;
}

export function AssetPickerModal({
  isOpen,
  type,
  assets,
  onClose,
  onSelect,
}: AssetPickerModalProps) {
  if (!isOpen) return null;

  const filteredAssets = assets?.filter((a) =>
    type === "image" ? a.type === "image" || a.type === "gif" : a.type === "video"
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-8"
      onClick={onClose}
    >
      <div
        className="bg-surface border border-white/10 rounded-2xl max-w-4xl w-full max-h-[80vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <h3 className="font-bold text-lg">
            Select {type === "image" ? "Image/GIF" : "Video"} Asset
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg text-text-muted hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
            {filteredAssets?.map((asset) => (
              <div
                key={asset.id}
                className="group bg-background border border-white/5 rounded-xl overflow-hidden hover:border-primary cursor-pointer flex flex-col"
                onClick={() => onSelect(asset.id)}
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
          {filteredAssets?.length === 0 && (
            <div className="text-center text-text-muted py-12">
              No compatible assets found in your library.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
