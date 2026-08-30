import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/audio')({
  component: AudioPage,
})

function AudioPage() {
  return <div className="p-4"><h1 className="text-2xl font-bold">Audio Library (Coming Soon)</h1></div>
}
