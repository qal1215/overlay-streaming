import StreamOverlay3D from "#/components/StreamOverlay3D";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/StreamOverlay3D")({
  validateSearch: (search) => ({
    isOverlay: search.isOverlay === true || search.isOverlay === "true",
  }),

  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div>
      <StreamOverlay3D />
    </div>
  );
}
