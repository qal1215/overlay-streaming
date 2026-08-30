import type { OverlayComponent } from "@overlay/schema";
import { Bell } from "lucide-react";

export function AlertRenderer({ component }: { component: OverlayComponent }) {
  if (component.type !== "alert") return null;
  return (
    <div className="w-full h-full bg-emerald-500/20 flex flex-col items-center justify-center border border-emerald-500/50">
      <Bell size={32} className="text-emerald-400 mb-2 opacity-50" />
      <span className="text-emerald-400 font-bold uppercase tracking-wider text-xl">
        {/* @ts-ignore */}
        {component.config?.text || "Alert Area"}
      </span>
    </div>
  );
}
