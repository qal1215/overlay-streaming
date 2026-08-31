import { useEffect, useState } from "react";
import { X } from "lucide-react";
import type { AlertDefinition } from "@overlay/schema";

interface OverlayAlertPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (alertId: string) => void;
  creatorId?: string;
}

export function OverlayAlertPickerModal({
  isOpen,
  onClose,
  onSelect,
  creatorId = "default_creator",
}: OverlayAlertPickerModalProps) {
  const [alerts, setAlerts] = useState<AlertDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      fetch(`http://localhost:8787/api/admin/creator/${creatorId}/alerts`)
        .then((res) => res.json())
        .then((data) => {
          setAlerts(data);
        })
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, creatorId]);

  if (!isOpen) return null;

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
          <h3 className="font-bold text-lg">Select Alert</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg text-text-muted hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {isLoading ? (
            <div className="text-center text-text-muted py-8">Loading alerts...</div>
          ) : alerts.length === 0 ? (
            <div className="text-center text-text-muted py-8">
              No alerts found. Create one in the Alerts library first!
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {alerts.map((alert) => (
                <button
                  key={alert.id}
                  onClick={() => onSelect(alert.id)}
                  className="flex flex-col items-start p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors text-left group hover:border-primary"
                >
                  <span className="font-medium text-white mb-1 group-hover:text-primary transition-colors">
                    {/* @ts-ignore - Some older APIs return just name */}
                    {alert.name || alert.preset?.theme || "Custom Alert"}
                  </span>
                  <span className="text-xs text-text-muted font-mono">
                    Theme: {alert.preset?.theme || "custom"}
                  </span>
                  <span className="text-xs text-text-muted font-mono mt-1">
                    ID: {alert.id}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
