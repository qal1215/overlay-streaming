import { createFileRoute } from "@tanstack/react-router";
import DonationAlert from "#/components/donationAlert";

export const Route = createFileRoute("/donationAlert")({
  validateSearch: (search) => ({
    preview: search.preview === true || search.preview === "true",
  }),
  component: RouteComponent,
});

function RouteComponent() {
  const { preview } = Route.useSearch();
  return <DonationAlert isPreview={preview} />;
}
