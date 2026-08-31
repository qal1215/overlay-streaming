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

  const isMounted = React.useRef(true);
  const activeTimeouts = React.useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  useEffect(() => {
    isMounted.current = true;

    // We register the AlertEngine as the processor for the AlertQueue.
    // The queue guarantees this callback is only run for one alert at a time.
    const unregister = alertQueue.setProcessor(async (instance: AlertInstance) => {
      if (!isMounted.current) return;
      setCurrentInstance(instance);

      const alertDef = instance.definition;
      const timeline = alertDef.timeline || { duration: 5000, events: [] };
      
      console.log("[AlertEngine] Processing alert", instance.event.eventId);

      // Process timeline
      return new Promise<void>((resolve) => {
        let hasPlayedMainAudio = false;

        const cleanupAndResolve = () => {
          // Clear all scheduled timeline events
          activeTimeouts.current.forEach(clearTimeout);
          activeTimeouts.current.clear();
          
          if (isMounted.current) {
            setIsVisible(false);
            
            // Wait a tiny bit for exit animations to finish before resolving the queue item
            const exitId = setTimeout(() => {
              activeTimeouts.current.delete(exitId);
              if (isMounted.current) {
                setCurrentInstance(null);
                resolve();
              } else {
                resolve();
              }
            }, 1000);
            activeTimeouts.current.add(exitId);
          } else {
            resolve();
          }
        };

        // If the component unmounts while this Promise is active, we must resolve it.
        // We'll attach a one-off cleanup function to the unmount lifecycle specifically for this instance.
        // However, a simpler way is that the main useEffect cleanup will clear timeouts,
        // but it doesn't have access to `resolve`.
        // To fix this, we can store the current resolve function in a ref.
        currentResolveRef.current = cleanupAndResolve;

        try {
          // Schedule all timeline events
          timeline.events.forEach((event: AlertTimelineEvent) => {
            const timeoutId = setTimeout(() => {
              activeTimeouts.current.delete(timeoutId);
              if (!isMounted.current) return;

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
            activeTimeouts.current.add(timeoutId);
          });

          // Setup completion timeout based on duration
          const completeId = setTimeout(() => {
            activeTimeouts.current.delete(completeId);
            if (isMounted.current) {
              cleanupAndResolve();
            }
          }, timeline.duration);
          activeTimeouts.current.add(completeId);
        } catch (err) {
          console.error("[AlertEngine] Critical timeline setup error", err);
          cleanupAndResolve();
        }
      });
    });

    return () => {
      isMounted.current = false;
      unregister();
      activeTimeouts.current.forEach(clearTimeout);
      activeTimeouts.current.clear();
      
      // If there's an active alert processing, resolve its promise to free the queue
      if (currentResolveRef.current) {
        currentResolveRef.current();
        currentResolveRef.current = null;
      }
    };
  }, []);

  const currentResolveRef = React.useRef<(() => void) | null>(null);

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
