import React, { useEffect, useState } from "react";
import type { AlertInstance, AlertTimelineEvent } from "@overlay/schema";
import { alertQueue } from "./AlertQueue";
import { audioManager } from "@overlay/audio-engine";
import AlertRenderer from "./AlertRenderer";

export function AlertEngine() {
  const [currentInstance, setCurrentInstance] = useState<AlertInstance | null>(
    null,
  );
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // We register the AlertEngine as the processor for the AlertQueue.
    // The queue guarantees this callback is only run for one alert at a time.
    alertQueue.setProcessor(async (instance: AlertInstance) => {
      setCurrentInstance(instance);
      const alertDef = instance.definition;

      // The context will be lazily initialized or unlocked by AudioSetup.
      // We no longer call audioManager.initialize() here to prevent blocking.
      const timeline = alertDef.timeline || { duration: 5000, events: [] };
      
      console.log("[AlertEngine] Processing alert", instance.event.id);
      
      try {
        if (instance.audio) {
          if (instance.audio.type === "asset") {
            console.log("[AudioManager] Preloading:\n", instance.audio.url);
          } else if (instance.audio.type === "synthetic") {
            console.log("[AudioManager] Preloading synthetic:\n", instance.audio.preset);
          }
          await audioManager.preload(instance.audio);
        }

        for (const event of timeline.events) {
          if (event.sound) {
            await audioManager.preload(event.sound, event.sound);
          }
        }
      } catch (err) {
        console.warn("[AlertEngine] Audio preload failed, continuing visually", err);
      }

      // Process timeline
      return new Promise<void>((resolve) => {
        const timeouts: ReturnType<typeof setTimeout>[] = [];
        let hasPlayedMainAudio = false;

        const cleanupAndResolve = () => {
          timeouts.forEach(clearTimeout);
          setIsVisible(false);
          // Wait a tiny bit for exit animations to finish before resolving the queue item
          setTimeout(() => {
            setCurrentInstance(null);
            resolve();
          }, 1000);
        };

        try {
          // Schedule all timeline events
          timeline.events.forEach((event: AlertTimelineEvent) => {
            const timeoutId = setTimeout(() => {
              try {
                console.log(`[AlertEngine] Processing event: ${event.type}`);

                // Handle Visuals
                if (event.type === "enter") {
                  setIsVisible(true);
                  
                  // Play main audio on enter if not played
                  if (!hasPlayedMainAudio && instance.audio) {
                    hasPlayedMainAudio = true;
                    audioManager.play(instance.audio, alertDef.preset.audio?.volume ?? 0.8);
                  }
                } else if (event.type === "exit") {
                  setIsVisible(false);
                }

                // Handle Timeline Specific Audio
                if (event.sound) {
                  audioManager.play(event.sound, alertDef.preset.audio?.volume ?? 0.8);
                }
              } catch (err) {
                console.error("[AlertEngine] Timeline event execution error", err);
              }
            }, event.at);
            timeouts.push(timeoutId);
          });

          // Setup completion timeout based on duration
          const completeId = setTimeout(() => {
            cleanupAndResolve();
          }, timeline.duration);
          timeouts.push(completeId);
        } catch (err) {
          console.error("[AlertEngine] Critical timeline setup error", err);
          cleanupAndResolve();
        }

        // We don't return the cleanup function to React anymore because 
        // the queue lifecycle owns it. If the component unmounts, the queue will just discard.
      });
    });
  }, []);

  if (!currentInstance) return null;

  const data = currentInstance.definition.data || { donorName: "Unknown", amount: "" };

  return (
    <div
      style={{
        position: "absolute",
        left: currentInstance.placement.x,
        top: currentInstance.placement.y,
        width: currentInstance.placement.width,
        height: currentInstance.placement.height,
        zIndex: currentInstance.placement.zIndex,
      }}
    >
      <AlertRenderer
        currentAlert={{
          id: currentInstance.definition.id,
          theme: currentInstance.definition.preset.theme,
          donorName: data.donorName,
          amount: data.amount,
          message: data.message,
          imageUrl: data.imageUrl,
        }}
        isVisible={isVisible}
      />
    </div>
  );
}
