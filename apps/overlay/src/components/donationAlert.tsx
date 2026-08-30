import OverlayRuntime from "./core/OverlayRuntime";

interface DonationAlertProps {
  isPreview?: boolean;
}

export default function DonationAlert({ isPreview = false }: DonationAlertProps) {
  return <OverlayRuntime isPreview={isPreview} />;
}
