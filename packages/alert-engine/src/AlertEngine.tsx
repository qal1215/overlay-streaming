import React, { useEffect, useState } from "react";
import type { AlertDefinition, AlertTimelineEvent } from "@overlay/schema";
import { alertQueue } from "./AlertQueue";
import { audioManager } from "@overlay/audio-engine";
import AlertRenderer from "./AlertRenderer";

export function AlertEngine() {
  const [currentAlert, setCurrentAlert] = useState<AlertDefinition | null>(
    null,
  );
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // We register the AlertEngine as the processor for the AlertQueue.
    // The queue guarantees this callback is only run for one alert at a time.
    alertQueue.setProcessor(async (alertDef: AlertDefinition) => {
      setCurrentAlert(alertDef);

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
            setCurrentAlert(null);
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

  if (!currentAlert) return null;

  return (
    <AlertRenderer
      currentAlert={{
        id: currentAlert.id,
        theme: currentAlert.preset.theme,
        donorName: currentAlert.data.donorName,
        amount: currentAlert.data.amount,
        message: currentAlert.data.message,
        imageUrl: currentAlert.data.imageUrl,
      }}
      isVisible={isVisible}
    />
  );
}
