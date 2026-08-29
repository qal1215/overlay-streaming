import React from "react";
import CyberpunkAlert from "./themes/cyberpunk/CyberpunkAlert";
import MinimalAlert from "./themes/minimal/MinimalAlert";
import ModernGlassAlert from "./themes/modern-glass/ModernGlassAlert";
import GamingAlert from "./themes/gaming/GamingAlert";
import AnimeAlert from "./themes/anime/AnimeAlert";
import RetroAlert from "./themes/retro/RetroAlert";

export type AlertTheme = 
  | "cyberpunk" | "minimal" | "modern-glass" | "gaming" | "anime" | "retro"
  | "classic" | "neon" | "holographic" | "comic" | "luxury" | "glitch" | "scifi" | "3d" | "memes";

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
      return <CyberpunkAlert key={currentAlert.id} isVisible={true} {...currentAlert} onComplete={onComplete} />;
    case "minimal":
      return <MinimalAlert key={currentAlert.id} isVisible={true} {...currentAlert} onComplete={onComplete} />;
    case "modern-glass":
      return <ModernGlassAlert key={currentAlert.id} isVisible={true} {...currentAlert} onComplete={onComplete} />;
    case "gaming":
      return <GamingAlert key={currentAlert.id} isVisible={true} {...currentAlert} onComplete={onComplete} />;
    case "anime":
      return <AnimeAlert key={currentAlert.id} isVisible={true} {...currentAlert} onComplete={onComplete} />;
    case "retro":
      return <RetroAlert key={currentAlert.id} isVisible={true} {...currentAlert} onComplete={onComplete} />;
    default:
      // Fallback
      return <CyberpunkAlert key={currentAlert.id} isVisible={true} {...currentAlert} onComplete={onComplete} />;
  }
}
