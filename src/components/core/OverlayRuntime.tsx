import { alertQueue } from "#/lib/AlertQueue";
import { audioManager } from "#/lib/AudioManager";
import { useEffect, useState } from "react";
import type { AlertTheme } from "../alerts/AlertRenderer";
import AlertEngine from "./AlertEngine";
import type { AlertDefinition } from "./types";

interface OverlayRuntimeProps {
  isPreview?: boolean;
}

export default function OverlayRuntime({
  isPreview = false,
}: OverlayRuntimeProps) {
  const [initialized, setInitialized] = useState(false);

  // Auto-initialize audio manager on first interaction (required by OBS/browsers)
  useEffect(() => {
    const initAudio = async () => {
      await audioManager.initialize();
      setInitialized(true);
    };

    if (isPreview) {
      // In preview mode, we can wait for a click, but OBS needs it auto-inited.
      // We attach it to window click just in case for local dev testing.
      window.addEventListener("click", initAudio, { once: true });
    } else {
      // In OBS Browser Source, auto-play policies are usually relaxed,
      // but we still call initialize explicitly.
      initAudio();
    }
  }, [isPreview]);

  // Mock Socket/Event Source for Preview Mode
  const triggerMockAlert = (theme: AlertTheme) => {
    if (!initialized && isPreview) {
      alert("Please click anywhere on the page first to initialize audio.");
      return;
    }

    const mockDefinition: AlertDefinition = {
      id: Date.now().toString(),
      preset: { theme },
      data: {
        donorName: "Neo_Hacker",
        amount: "$50.00",
        message: "Wake up, Neo. The matrix has you...",
        imageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Neo",
      },
      timeline: {
        duration: 5000,
        events: [
          { at: 0, type: "enter" },
          { at: 100, type: "impact", sound: "impact-sound-mock" },
          { at: 4500, type: "exit" },
        ],
      },
    };
    alertQueue.push(mockDefinition);
  };

  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "1":
          triggerMockAlert("cyberpunk");
          break;
        case "2":
          triggerMockAlert("minimal");
          break;
        case "3":
          triggerMockAlert("modern-glass");
          break;
        case "4":
          triggerMockAlert("gaming");
          break;
        case "5":
          triggerMockAlert("anime");
          break;
        case "6":
          triggerMockAlert("retro");
          break;
      }
    };
    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [initialized]);

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        background: isPreview ? "#1a1a1a" : "transparent",
        position: "absolute",
        top: 0,
        left: 0,
        overflow: "hidden", // Extremely important for OBS!
      }}
    >
      {isPreview && (
        <div className="absolute left-4 top-4 z-[9999] rounded-xl border border-white/10 bg-black/80 p-6 text-white shadow-2xl backdrop-blur-md">
          <h2 className="mb-4 text-xl font-bold">Donation Alert Preview</h2>
          {!initialized && (
            <div className="mb-4 text-yellow-400">
              ⚠️ Click anywhere to enable audio
            </div>
          )}
          <div className="flex flex-col gap-2">
            <button
              onClick={() => triggerMockAlert("cyberpunk")}
              className="cursor-pointer rounded bg-purple-600 px-4 py-2 hover:bg-purple-500"
            >
              Test Cyberpunk (1)
            </button>
            <button
              onClick={() => triggerMockAlert("minimal")}
              className="cursor-pointer rounded bg-gray-600 px-4 py-2 hover:bg-gray-500"
            >
              Test Minimal (2)
            </button>
            <button
              onClick={() => triggerMockAlert("modern-glass")}
              className="cursor-pointer rounded bg-blue-600 px-4 py-2 hover:bg-blue-500"
            >
              Test Modern Glass (3)
            </button>
            <button
              onClick={() => triggerMockAlert("gaming")}
              className="cursor-pointer rounded bg-yellow-600 px-4 py-2 hover:bg-yellow-500"
            >
              Test Gaming (4)
            </button>
            <button
              onClick={() => triggerMockAlert("anime")}
              className="cursor-pointer rounded bg-red-600 px-4 py-2 hover:bg-red-500"
            >
              Test Anime (5)
            </button>
            <button
              onClick={() => triggerMockAlert("retro")}
              className="cursor-pointer rounded bg-green-600 px-4 py-2 hover:bg-green-500"
            >
              Test Retro (6)
            </button>
          </div>
          <p className="mt-4 text-xs text-gray-400">
            URL config: ?preview=false to use in OBS.
          </p>
        </div>
      )}

      {/* The Central Alert Orchestrator */}
      <AlertEngine />
    </div>
  );
}
