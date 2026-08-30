import type { OverlayComponent } from "@overlay/schema";
import { AlertRenderer } from "./components/AlertRenderer";
import { TextRenderer } from "./components/TextRenderer";
import { ImageRenderer } from "./components/ImageRenderer";
import { VideoRenderer } from "./components/VideoRenderer";

export interface OverlayComponentRendererProps {
  component: OverlayComponent;
  resolveAssetUrl?: (assetId?: string) => string;
}

export function OverlayComponentRenderer({
  component,
  resolveAssetUrl,
}: OverlayComponentRendererProps) {
  const getUrl = resolveAssetUrl || ((id?: string) => "https://placehold.co/600x400");

  switch (component.type) {
    case "alert":
      return <AlertRenderer component={component} />;
    case "text":
      return <TextRenderer component={component} />;
    case "image":
      return <ImageRenderer component={component} resolveAssetUrl={getUrl} />;
    case "video":
      return <VideoRenderer component={component} resolveAssetUrl={getUrl} />;
    default:
      return null;
  }
}
