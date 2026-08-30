import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/assets')({
  component: AssetsPage,
})

function AssetsPage() {
  return <div className="p-4"><h1 className="text-2xl font-bold">Assets Management (Coming Soon)</h1></div>
}
