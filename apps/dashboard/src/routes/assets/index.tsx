import type { AssetDefinition } from "@overlay/schema";
import { createFileRoute } from "@tanstack/react-router";
import { FileType2, Search, Trash2, UploadCloud, X } from "lucide-react";
import { useRef, useState } from "react";
import {
  useAssets,
  useDeleteAsset,
  useUploadAsset,
} from "../../features/assets/hooks/useAssets";
import { API_URL } from "../../api/client";

export const Route = createFileRoute("/assets/")({
  component: AssetsLibraryPage,
});

type UploadProgress = {
  fileName: string;
  progress: number;
  error?: string;
  isComplete: boolean;
};

function AssetsLibraryPage() {
  const [filter, setFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const { data: assets, isLoading } = useAssets(filter);
  const uploadAsset = useUploadAsset();
  const deleteAsset = useDeleteAsset();

  const [uploads, setUploads] = useState<Record<string, UploadProgress>>({});
  const [previewAsset, setPreviewAsset] = useState<AssetDefinition | null>(
    null,
  );

  const fileInputRef = useRef<HTMLInputElement>(null);

  const extractMetadata = (
    file: File,
  ): Promise<{ width?: number; height?: number; duration?: number }> => {
    return new Promise((resolve) => {
      const url = URL.createObjectURL(file);

      if (file.type.startsWith("image/")) {
        const img = new Image();
        img.onload = () => {
          URL.revokeObjectURL(url);
          resolve({ width: img.width, height: img.height });
        };
        img.onerror = () => resolve({});
        img.src = url;
      } else if (file.type.startsWith("video/")) {
        const video = document.createElement("video");
        video.onloadedmetadata = () => {
          URL.revokeObjectURL(url);
          resolve({
            width: video.videoWidth,
            height: video.videoHeight,
            duration: video.duration,
          });
        };
        video.onerror = () => resolve({});
        video.src = url;
      } else {
        resolve({});
      }
    });
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const uploadId = crypto.randomUUID();

      setUploads((prev) => ({
        ...prev,
        [uploadId]: { fileName: file.name, progress: 0, isComplete: false },
      }));

      try {
        const metadata = await extractMetadata(file);

        await uploadAsset.mutateAsync({
          file,
          metadata,
          onProgress: (progress) => {
            setUploads((prev) => ({
              ...prev,
              [uploadId]: { ...prev[uploadId], progress },
            }));
          },
        });

        setUploads((prev) => ({
          ...prev,
          [uploadId]: { ...prev[uploadId], progress: 100, isComplete: true },
        }));

        // Remove completed upload after 3 seconds
        setTimeout(() => {
          setUploads((prev) => {
            const next = { ...prev };
            delete next[uploadId];
            return next;
          });
        }, 3000);
      } catch (err: any) {
        setUploads((prev) => ({
          ...prev,
          [uploadId]: {
            ...prev[uploadId],
            error: err.message,
            isComplete: true,
          },
        }));
      }
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const formatSize = (bytes: number) => {
    return (bytes / 1024 / 1024).toFixed(2) + " MB";
  };

  const filteredAssets = assets?.filter((a) =>
    a.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="max-w-6xl space-y-8 pb-20">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Asset Management</h2>
          <p className="text-text-muted mt-1">
            Manage images, GIFs, videos, and fonts.
          </p>
        </div>
        <div>
          <input
            type="file"
            multiple
            ref={fileInputRef}
            onChange={(e) => handleFiles(e.target.files)}
            accept="image/*, video/*, font/*"
            className="hidden"
          />
        </div>
      </header>

      {/* Upload Dropzone */}
      <div
        className="border-2 border-dashed border-white/20 rounded-2xl p-12 flex flex-col items-center justify-center text-center bg-surface/30 hover:bg-surface/50 hover:border-primary/50 transition-all cursor-pointer group"
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleFiles(e.dataTransfer.files);
        }}
      >
        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform group-hover:bg-primary/20 group-hover:text-primary">
          <UploadCloud size={32} />
        </div>
        <h3 className="text-lg font-semibold mb-2">
          Drop files here or click to browse
        </h3>
        <p className="text-text-muted text-sm">
          Supports PNG, JPG, WEBP, GIF, MP4, WEBM, TTF, WOFF
        </p>
      </div>

      {/* Upload Progress Queue */}
      {Object.keys(uploads).length > 0 && (
        <div className="bg-surface rounded-xl border border-white/10 p-4 space-y-3">
          <h4 className="font-semibold text-sm uppercase tracking-wider text-text-muted">
            Uploads
          </h4>
          {Object.entries(uploads).map(([id, upload]) => (
            <div key={id} className="flex items-center gap-4">
              <span className="text-sm truncate w-48">{upload.fileName}</span>
              <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full ${upload.error ? "bg-red-500" : "bg-primary"} transition-all duration-300`}
                  style={{ width: `${upload.progress}%` }}
                />
              </div>
              <span className="text-sm text-text-muted w-12 text-right">
                {upload.error ? "Error" : `${upload.progress}%`}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Filter and Search */}
      <div className="flex items-center justify-between gap-4 bg-surface/50 p-2 rounded-lg border border-white/5">
        <div className="flex gap-1">
          {["all", "image", "gif", "video", "font"].map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`px-4 py-2 rounded-md font-medium text-sm transition-colors capitalize ${filter === t ? "bg-primary text-white shadow-lg" : "text-text-muted hover:bg-white/5"}`}
            >
              {t === "all" ? "All Assets" : `${t}s`}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
          />
          <input
            type="text"
            placeholder="Search assets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-64 bg-background border border-white/10 rounded-lg py-2 pl-9 pr-4 text-sm focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* Asset Grid */}
      {isLoading ? (
        <div className="text-center text-text-muted py-12">
          Loading assets...
        </div>
      ) : filteredAssets?.length === 0 ? (
        <div className="text-center py-20 border border-white/5 border-dashed rounded-2xl bg-surface/30 text-text-muted">
          No assets found.
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredAssets?.map((asset) => (
            <div
              key={asset.id}
              className="group bg-surface border border-white/5 rounded-xl overflow-hidden hover:border-primary/50 transition-all cursor-pointer flex flex-col"
              onClick={() => setPreviewAsset(asset)}
            >
              <div className="aspect-square bg-background flex items-center justify-center p-4 relative overflow-hidden">
                {asset.type === "image" || asset.type === "gif" ? (
                  <img
                    src={`${API_URL}${asset.url}`}
                    alt={asset.name}
                    className="w-full h-full object-contain"
                  />
                ) : asset.type === "video" ? (
                  <video
                    src={`${API_URL}${asset.url}`}
                    className="w-full h-full object-cover"
                    muted
                  />
                ) : (
                  <FileType2 size={48} className="text-text-muted" />
                )}

                {/* Delete button (shows on hover) */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm("Delete this asset?")) {
                      deleteAsset.mutate(asset.id);
                    }
                  }}
                  className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all backdrop-blur-md"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="p-3 border-t border-white/5">
                <div className="text-xs font-semibold uppercase tracking-wider text-primary mb-1">
                  {asset.type}
                </div>
                <h4 className="font-medium text-sm truncate" title={asset.name}>
                  {asset.name}
                </h4>
                <div className="flex justify-between items-center mt-1 text-xs text-text-muted">
                  <span>{formatSize(asset.size)}</span>
                  {asset.width && (
                    <span>
                      {asset.width}x{asset.height}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      {previewAsset && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-8"
          onClick={() => setPreviewAsset(null)}
        >
          <div
            className="bg-surface border border-white/10 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/20">
              <div>
                <h3 className="font-bold text-lg">{previewAsset.name}</h3>
                <p className="text-text-muted text-sm flex gap-4 mt-1">
                  <span>{previewAsset.type.toUpperCase()}</span>
                  <span>{formatSize(previewAsset.size)}</span>
                  {previewAsset.width && (
                    <span>
                      {previewAsset.width} × {previewAsset.height}
                    </span>
                  )}
                  {previewAsset.duration && (
                    <span>{previewAsset.duration.toFixed(1)}s</span>
                  )}
                </p>
              </div>
              <button
                onClick={() => setPreviewAsset(null)}
                className="p-2 hover:bg-white/10 rounded-lg text-text-muted hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-8 flex items-center justify-center bg-black/40 bg-[radial-gradient(#ffffff11_1px,transparent_1px)] [background-size:16px_16px]">
              {previewAsset.type === "image" || previewAsset.type === "gif" ? (
                <img
                  src={`${API_URL}${previewAsset.url}`}
                  alt={previewAsset.name}
                  className="max-w-full max-h-full object-contain shadow-2xl rounded-lg"
                />
              ) : previewAsset.type === "video" ? (
                <video
                  src={`${API_URL}${previewAsset.url}`}
                  controls
                  autoPlay
                  loop
                  className="max-w-full max-h-full shadow-2xl rounded-lg"
                />
              ) : (
                <div className="text-center">
                  <FileType2
                    size={64}
                    className="mx-auto text-text-muted mb-4"
                  />
                  <p className="text-text-muted">
                    Font Preview Not Available Yet
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-white/10 bg-black/20 flex justify-end gap-3">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(
                    `${API_URL}${previewAsset.url}`,
                  );
                  alert("URL copied to clipboard!");
                }}
                className="px-4 py-2 border border-white/10 hover:bg-white/5 rounded-lg text-sm font-medium transition-colors"
              >
                Copy URL
              </button>
              <button
                onClick={() => {
                  if (confirm("Delete this asset?")) {
                    deleteAsset.mutate(previewAsset.id);
                    setPreviewAsset(null);
                  }
                }}
                className="px-4 py-2 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/20 hover:border-red-500 rounded-lg text-sm font-medium transition-colors"
              >
                Delete Asset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
