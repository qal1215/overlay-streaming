import type { AlertTheme } from "../alerts/AlertRenderer";

export interface AlertTimelineEvent {
  at: number; // milliseconds from start
  type: "enter" | "impact" | "tts" | "exit";
  sound?: string;
  // animation?: string; // we can extend with specific animation triggers later
}

export interface AlertDefinition {
  id: string;
  preset: {
    theme: AlertTheme;
  };
  data: {
    donorName: string;
    amount: string;
    message?: string;
    imageUrl?: string;
  };
  timeline: {
    duration: number; // total duration of the alert in ms
    events: AlertTimelineEvent[];
  };
}
