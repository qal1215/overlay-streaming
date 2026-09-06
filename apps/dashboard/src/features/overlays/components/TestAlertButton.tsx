import { useState } from "react";
import { Bell, Loader2 } from "lucide-react";
import { API_URL } from "../../../api/client";

interface TestAlertButtonProps {
  creatorId?: string;
  overlayId?: string;
  onTestLocally?: () => void;
}

export function TestAlertButton({ creatorId = "qal1215", overlayId, onTestLocally }: TestAlertButtonProps) {
  const [isSending, setIsSending] = useState(false);

  const handleTestAlert = async () => {
    setIsSending(true);
    if (onTestLocally) onTestLocally();
    try {
      await fetch(`${API_URL}/api/admin/creator/${creatorId}/test-alert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "TestUser",
          amount: "$50",
          message: "This is a test alert!",
          overlayId,
        }),
      });
    } catch (err) {
      console.error("Failed to trigger test alert", err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <button
      onClick={handleTestAlert}
      disabled={isSending}
      className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium rounded-lg transition-colors mr-2 disabled:opacity-50"
    >
      {isSending ? <Loader2 size={16} className="animate-spin" /> : <Bell size={16} />}
      Test Alert
    </button>
  );
}
