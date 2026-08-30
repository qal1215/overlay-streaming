import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/obs')({
  component: ObsPage,
})

function ObsPage() {
  return <div className="p-4"><h1 className="text-2xl font-bold">OBS Setup (Coming Soon)</h1></div>
}
