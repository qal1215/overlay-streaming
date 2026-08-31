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

      // Preload audio and initialize context
      await audioManager.initialize();
      const timeline = alertDef.timeline || { duration: 5000, events: [] };
      for (const event of timeline.events) {
        if (event.sound) {
          await audioManager.preload(event.sound, event.sound);
        }
      }

      // Process timeline
      return new Promise<void>((resolve) => {
        const timeouts: ReturnType<typeof setTimeout>[] = [];

        // Schedule all timeline events
        timeline.events.forEach((event: AlertTimelineEvent) => {
          const timeoutId = setTimeout(() => {
            handleTimelineEvent(event, alertDef);
          }, event.at);
          timeouts.push(timeoutId);
        });

        // Setup completion timeout based on duration
        const completeId = setTimeout(() => {
          setIsVisible(false);
          // Wait a tiny bit for exit animations to finish before resolving the queue item
          setTimeout(() => {
            setCurrentInstance(null);
            resolve();
          }, 1000);
        }, timeline.duration);
        timeouts.push(completeId);

        // Cleanup function (though in normal flow we don't clear these unless unmounted)
        return () => {
          timeouts.forEach(clearTimeout);
        };
      });
    });
  }, []);

  const handleTimelineEvent = (event: AlertTimelineEvent, alertDef: any) => {
    console.log(`[AlertEngine] Processing event: ${event.type}`);

    // Handle Visuals
    if (event.type === "enter") {
      setIsVisible(true);
    } else if (event.type === "exit") {
      setIsVisible(false);
    }

    // Handle Audio
    if (event.sound) {
      audioManager.play(event.sound, alertDef.preset.audio?.volume ?? 0.8);
    }
  };

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
