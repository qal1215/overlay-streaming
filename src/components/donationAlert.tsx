import { useEffect, useState } from "react"; 
import AlertRenderer, { type AlertEvent, type AlertTheme } from "./alerts/AlertRenderer";

interface DonationAlertProps {
  isPreview?: boolean;
}

export default function DonationAlert({ isPreview = false }: DonationAlertProps) {
  const [currentAlert, setCurrentAlert] = useState<AlertEvent | null>(null);

  const triggerMockAlert = (theme: AlertTheme) => {
    setCurrentAlert({
      id: Date.now().toString(),
      theme,
      donorName: "Neo_Hacker",
      amount: "$50.00",
      message: "Wake up, Neo. The matrix has you...",
      imageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Neo", // Mock avatar
    });
  };

  // Mock receiving donation events for testing via keyboard (optional shortcut)
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "1": triggerMockAlert("cyberpunk"); break;
        case "2": triggerMockAlert("minimal"); break;
        case "3": triggerMockAlert("modern-glass"); break;
        case "4": triggerMockAlert("gaming"); break;
        case "5": triggerMockAlert("anime"); break;
        case "6": triggerMockAlert("retro"); break;
      }
    };
    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, []);

  return (
    <div
      style={{
        width: "100vw", // Đổi thành vw/vh để đảm bảo luôn có kích thước
        height: "100vh",
        background: isPreview ? "#1a1a1a" : "transparent",
        position: "absolute", // Thêm absolute nếu đây là overlay đè lên stream
        top: 0,
        left: 0,
        overflow: "hidden"
      }}
    >
      {/* Preview Control Panel */}
      {isPreview && (
        <div className="absolute left-4 top-4 z-[9999] rounded-xl border border-white/10 bg-black/80 p-6 text-white shadow-2xl backdrop-blur-md">
          <h2 className="mb-4 text-xl font-bold">Donation Alert Preview</h2>
          <div className="flex flex-col gap-2">
            <button onClick={() => triggerMockAlert("cyberpunk")} className="cursor-pointer rounded bg-purple-600 px-4 py-2 hover:bg-purple-500">Test Cyberpunk (1)</button>
            <button onClick={() => triggerMockAlert("minimal")} className="cursor-pointer rounded bg-gray-600 px-4 py-2 hover:bg-gray-500">Test Minimal (2)</button>
            <button onClick={() => triggerMockAlert("modern-glass")} className="cursor-pointer rounded bg-blue-600 px-4 py-2 hover:bg-blue-500">Test Modern Glass (3)</button>
            <button onClick={() => triggerMockAlert("gaming")} className="cursor-pointer rounded bg-yellow-600 px-4 py-2 hover:bg-yellow-500">Test Gaming (4)</button>
            <button onClick={() => triggerMockAlert("anime")} className="cursor-pointer rounded bg-red-600 px-4 py-2 hover:bg-red-500">Test Anime (5)</button>
            <button onClick={() => triggerMockAlert("retro")} className="cursor-pointer rounded bg-green-600 px-4 py-2 hover:bg-green-500">Test Retro (6)</button>
          </div>
          <p className="mt-4 text-xs text-gray-400">URL config: ?preview=false to use in OBS.</p>
        </div>
      )}

      {/* Alert Engine Rendering Layer */}
      <AlertRenderer
        currentAlert={currentAlert}
        onComplete={() => setCurrentAlert(null)}
      />
    </div>
  );
}
