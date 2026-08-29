import AnimeAlert from "./themes/anime/AnimeAlert";
import CyberpunkAlert from "./themes/cyberpunk/CyberpunkAlert";
import GamingAlert from "./themes/gaming/GamingAlert";
import MinimalAlert from "./themes/minimal/MinimalAlert";
import ModernGlassAlert from "./themes/modern-glass/ModernGlassAlert";
import RetroAlert from "./themes/retro/RetroAlert";

export type AlertTheme =
  | "cyberpunk"
  | "minimal"
  | "modern-glass"
  | "gaming"
  | "anime"
  | "retro"
  | "classic"
  | "neon"
  | "holographic"
  | "comic"
  | "luxury"
  | "glitch"
  | "scifi"
  | "3d"
  | "memes";

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
  isVisible: boolean;
}

export default function AlertRenderer({
  currentAlert,
  isVisible,
}: AlertRendererProps) {
  if (!currentAlert) return null;

  switch (currentAlert.theme) {
    case "cyberpunk":
      return (
        <CyberpunkAlert
          key={currentAlert.id}
          isVisible={isVisible}
          {...currentAlert}
        />
      );
    case "minimal":
      return (
        <MinimalAlert
          key={currentAlert.id}
          isVisible={isVisible}
          {...currentAlert}
        />
      );
    case "modern-glass":
      return (
        <ModernGlassAlert
          key={currentAlert.id}
          isVisible={isVisible}
          {...currentAlert}
        />
      );
    case "gaming":
      return (
        <GamingAlert
          key={currentAlert.id}
          isVisible={isVisible}
          {...currentAlert}
        />
      );
    case "anime":
      return (
        <AnimeAlert
          key={currentAlert.id}
          isVisible={isVisible}
          {...currentAlert}
        />
      );
    case "retro":
      return (
        <RetroAlert
          key={currentAlert.id}
          isVisible={isVisible}
          {...currentAlert}
        />
      );
    default:
      // Fallback
      return (
        <CyberpunkAlert
          key={currentAlert.id}
          isVisible={isVisible}
          {...currentAlert}
        />
      );
  }
}
