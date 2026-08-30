import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/settings')({
  component: SettingsPage,
})

function SettingsPage() {
  return <div className="p-4"><h1 className="text-2xl font-bold">System Settings (Coming Soon)</h1></div>
}
