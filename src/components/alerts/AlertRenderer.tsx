import React from "react";
import CyberpunkAlert from "./CyberpunkAlert";

export type AlertTheme = "cyberpunk" | "minimal" | "anime" | "gaming";

export interface AlertEvent {
  id: string;
  theme: AlertTheme;
  donorName: string;
  amount: string;
  message?: string;
  imageUrl?: string;
  soundUrl?: string;
}

interface AlertRendererProps {
  currentAlert: AlertEvent | null;
  onComplete: () => void;
}

export default function AlertRenderer({ currentAlert, onComplete }: AlertRendererProps) {
  if (!currentAlert) return null;

  switch (currentAlert.theme) {
    case "cyberpunk":
      return (
        <CyberpunkAlert
          key={currentAlert.id} // Ensures it remounts for new alerts with same theme
          isVisible={true}
          donorName={currentAlert.donorName}
          amount={currentAlert.amount}
          message={currentAlert.message}
          imageUrl={currentAlert.imageUrl}
          soundUrl={currentAlert.soundUrl}
          onComplete={onComplete}
        />
      );
    // Add other themes here later
    // case "minimal":
    //   return <MinimalAlert ... />
    default:
      // Fallback
      return (
        <CyberpunkAlert
          key={currentAlert.id}
          isVisible={true}
          donorName={currentAlert.donorName}
          amount={currentAlert.amount}
          message={currentAlert.message}
          imageUrl={currentAlert.imageUrl}
          soundUrl={currentAlert.soundUrl}
          onComplete={onComplete}
        />
      );
  }
}
