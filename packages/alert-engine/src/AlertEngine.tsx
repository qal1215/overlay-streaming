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

      // Process timeline
      return new Promise<void>((resolve) => {
        const timeouts: NodeJS.Timeout[] = [];

        // Schedule all timeline events
        alertDef.timeline.events.forEach((event: AlertTimelineEvent) => {
          const timeoutId = setTimeout(() => {
            handleTimelineEvent(event);
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
        }, alertDef.timeline.duration);
        timeouts.push(completeId);

        // Cleanup function (though in normal flow we don't clear these unless unmounted)
        return () => {
          timeouts.forEach(clearTimeout);
        };
      });
    });
  }, []);

  const handleTimelineEvent = (event: AlertTimelineEvent) => {
    console.log(`[AlertEngine] Processing event: ${event.type}`);

    // Handle Visuals
    if (event.type === "enter") {
      setIsVisible(true);
    } else if (event.type === "exit") {
      setIsVisible(false);
    }

    // Handle Audio
    if (event.sound) {
      audioManager.play(event.sound);
    }
  };

  if (!currentInstance) return null;

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
          donorName: currentInstance.definition.data.donorName,
          amount: currentInstance.definition.data.amount,
          message: currentInstance.definition.data.message,
          imageUrl: currentInstance.definition.data.imageUrl,
        }}
        isVisible={isVisible}
      />
    </div>
  );
}
