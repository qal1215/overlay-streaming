import type { OverlayComponent } from "@overlay/schema";

export function TextRenderer({ component }: { component: OverlayComponent }) {
  if (component.type !== "text") return null;
  return (
    <div
      className="w-full h-full flex items-center justify-center p-4 overflow-hidden text-center"
      style={{
        /* @ts-ignore */
        color: component.config?.color,
        /* @ts-ignore */
        fontSize: `${component.config?.fontSize}px`,
      }}
    >
      {/* @ts-ignore */}
      {component.config?.text || "Double click to edit"}
    </div>
  );
}
