import { ArrowLeft, Save } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { TestAlertButton } from "./TestAlertButton";

interface EditorToolbarProps {
  name: string;
  onNameChange: (name: string) => void;
  scale: number;
  onScaleChange: (scale: number) => void;
  width: number;
  height: number;
  onSave: () => void;
  isSaving: boolean;
  overlayId: string;
  onTestAlert?: () => void;
}

export function EditorToolbar({
  name,
  onNameChange,
  scale,
  onScaleChange,
  width,
  height,
  onSave,
  isSaving,
  overlayId,
  onTestAlert,
}: EditorToolbarProps) {
  const handleCopyLink = () => {
    navigator.clipboard.writeText(
      `http://localhost:3000/overlays/${overlayId}`,
    );
  };
  return (
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
          onChange={(e) => onNameChange(e.target.value)}
          className="bg-transparent border-none focus:outline-none text-lg font-bold text-white px-2 py-1 rounded hover:bg-white/5 focus:bg-white/5 transition-colors"
        />
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center bg-black/20 rounded-lg overflow-hidden mr-4">
          <button
            onClick={() => onScaleChange(Math.max(0.1, scale - 0.1))}
            className="px-3 py-1.5 text-text-muted hover:text-white hover:bg-white/10 transition-colors font-medium"
          >
            -
          </button>
          <span className="px-2 py-1.5 text-xs text-text-muted min-w-[3rem] text-center font-medium border-x border-white/5">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={() => onScaleChange(Math.min(2, scale + 0.1))}
            className="px-3 py-1.5 text-text-muted hover:text-white hover:bg-white/10 transition-colors font-medium"
          >
            +
          </button>
        </div>
        <div className="text-xs text-text-muted mr-4 bg-black/20 px-2 py-1 rounded">
          {width} × {height}
        </div>
        <button
          onClick={handleCopyLink}
          className="flex items-center gap-2 px-3 py-1.5 bg-black/20 hover:bg-white/10 text-white text-sm font-medium rounded-lg transition-colors mr-2"
          title="Copy OBS Browser Source URL"
        >
          <span className="font-mono text-xs">Copy OBS Link</span>
        </button>
        <TestAlertButton overlayId={overlayId} onTestLocally={onTestAlert} />
        <button
          onClick={onSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-3 py-1.5 bg-primary hover:bg-primary-hover text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          <Save size={16} />
          {isSaving ? "Saving..." : "Save Layout"}
        </button>
      </div>
    </header>
  );
}
